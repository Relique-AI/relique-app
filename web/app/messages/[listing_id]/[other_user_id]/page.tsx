import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";
import { ChatClient } from "./ChatClient";

export const metadata = { title: "Chat — Pépite" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ listing_id: string; other_user_id: string }>;
}) {
  const { listing_id, other_user_id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/messages/${listing_id}/${other_user_id}`);

  const [listingRes, otherRes, messagesRes] = await Promise.all([
    supabase.from("listings").select("id, name, images, seller_id, status").eq("id", listing_id).single(),
    supabase.from("profiles").select("id, username, avatar_url").eq("id", other_user_id).single(),
    supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, read, created_at")
      .eq("listing_id", listing_id)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true }),
  ]);

  if (!listingRes.data || !otherRes.data) notFound();

  // Mark unread messages as read
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("listing_id", listing_id)
    .eq("sender_id", other_user_id)
    .eq("receiver_id", user.id)
    .eq("read", false);

  const listing = listingRes.data;
  const other = otherRes.data;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-6 w-full flex flex-col">
        {/* Header conversation */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
          <Link href="/messages" className="text-text-muted hover:text-text-primary transition-colors text-lg">
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-semibold text-sm">{other.username ?? "Utilisateur"}</p>
            <Link
              href={`/listing/${listing.id}`}
              className="text-xs text-text-muted hover:text-primary transition-colors truncate block"
            >
              re : {listing.name} →
            </Link>
          </div>
          {listing.status === "active" && listing.seller_id !== user.id && (
            <Link
              href={`/achat/${listing.id}`}
              className="bg-primary text-background text-xs font-semibold px-4 py-2 rounded-full hover:bg-primary-dim transition-colors flex-shrink-0"
            >
              Acheter
            </Link>
          )}
        </div>

        <ChatClient
          listingId={listing_id}
          userId={user.id}
          otherUserId={other_user_id}
          initialMessages={(messagesRes.data ?? []) as any[]}
        />
      </main>
      <Footer />
    </>
  );
}

import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";

export const metadata = { title: "Messages — Pépite" };

type RawMessage = {
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  listings: { id: string; name: string; images: string[] | null } | null;
  sender_profile: { id: string; username: string | null } | null;
  receiver_profile: { id: string; username: string | null } | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/messages");

  const { data: rawMessages } = await supabase
    .from("messages")
    .select(`
      listing_id, sender_id, receiver_id, content, read, created_at,
      listings(id, name, images),
      sender_profile:profiles!messages_sender_id_fkey(id, username),
      receiver_profile:profiles!messages_receiver_id_fkey(id, username)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Group by conversation (listing_id + other_user_id)
  type Conversation = {
    key: string;
    listing_id: string;
    listing_name: string;
    listing_image: string | null;
    other_user_id: string;
    other_username: string;
    last_message: string;
    last_message_at: string;
    unread: boolean;
  };

  const map = new Map<string, Conversation>();
  for (const msg of (rawMessages ?? []) as unknown as RawMessage[]) {
    const isSender = msg.sender_id === user.id;
    const otherUserId = isSender ? msg.receiver_id : msg.sender_id;
    const convKey = `${msg.listing_id}_${otherUserId}`;
    if (map.has(convKey)) continue;

    const otherProfile = isSender ? msg.receiver_profile : msg.sender_profile;
    map.set(convKey, {
      key: convKey,
      listing_id: msg.listing_id,
      listing_name: msg.listings?.name ?? "Annonce",
      listing_image: msg.listings?.images?.[0] ?? null,
      other_user_id: otherUserId,
      other_username: otherProfile?.username ?? "Utilisateur",
      last_message: msg.content,
      last_message_at: msg.created_at,
      unread: !isSender && !msg.read,
    });
  }

  const conversations = Array.from(map.values());

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="font-serif text-3xl text-text-primary mb-8">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-20 text-text-muted bg-surface rounded-2xl border border-border">
            <div className="text-4xl mb-3">✦</div>
            <p className="mb-4">Aucune conversation pour l'instant.</p>
            <Link href="/market" className="text-primary hover:underline text-sm font-semibold">
              Parcourir le marché →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.key}
                href={`/messages/${conv.listing_id}/${conv.other_user_id}`}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  conv.unread
                    ? "border-primary/30 bg-primary/5 hover:bg-primary/8"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0">
                  {conv.listing_image ? (
                    <Image src={conv.listing_image} alt={conv.listing_name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">✦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-semibold truncate ${conv.unread ? "text-text-primary" : "text-text-secondary"}`}>
                      {conv.other_username}
                    </p>
                    {conv.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate italic mb-0.5">re : {conv.listing_name}</p>
                  <p className={`text-xs truncate ${conv.unread ? "text-text-primary font-medium" : "text-text-muted"}`}>
                    {conv.last_message}
                  </p>
                </div>
                <time className="text-xs text-text-muted flex-shrink-0">
                  {new Date(conv.last_message_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </time>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

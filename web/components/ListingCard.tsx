import Image from "next/image";
import Link from "next/link";
import { CONDITION_COLORS, type Listing } from "@/lib/supabase";

export function ListingCard({ listing }: { listing: Listing }) {
  const conditionColor = CONDITION_COLORS[listing.condition] ?? "#E0D4BA";

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div className="bg-surface rounded-2xl overflow-hidden border border-border hover:border-border-strong transition-all duration-200 hover:-translate-y-0.5">
        <div className="relative aspect-square overflow-hidden bg-surface-deep">
          {listing.images?.[0] ? (
            <Image
              src={listing.images[0]}
              alt={listing.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-3xl">
              ✦
            </div>
          )}
          <div
            className="absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: conditionColor + "22", color: conditionColor, border: `1px solid ${conditionColor}44` }}
          >
            {listing.condition}
          </div>
        </div>
        <div className="p-3.5">
          <p className="text-text-primary font-semibold text-sm leading-snug line-clamp-2 mb-1">
            {listing.name}
          </p>
          <p className="text-text-muted text-xs mb-2">{listing.category}</p>
          <p className="text-primary font-bold text-base">{listing.price_final} €</p>
        </div>
      </div>
    </Link>
  );
}

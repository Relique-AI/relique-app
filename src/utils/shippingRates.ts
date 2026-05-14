export const SHIPPING_RATES: Record<string, Record<string, number>> = {
  colissimo:  { xs: 6.50, s:  8.25, m: 10.75, l: 15.50 },
  chronopost: { xs: 12.00, s: 16.00, m: 20.00, l: 28.00 },
};

export const PARCEL_SIZES = [
  { id: 'xs', label: 'Petit',        detail: "Jusqu'à 1 kg · bijoux, accessoires" },
  { id: 's',  label: 'Moyen',        detail: "Jusqu'à 3 kg · vêtements, livres" },
  { id: 'm',  label: 'Grand',        detail: "Jusqu'à 5 kg · objets décoratifs" },
  { id: 'l',  label: 'Très grand',   detail: "Jusqu'à 10 kg · mobilier léger" },
  { id: 'xl', label: 'Hors gabarit', detail: "Plus de 10 kg · frais à convenir avec l'acheteur" },
] as const;

export function getShippingCost(carrier: string, parcelSize: string | null | undefined): number {
  if (carrier === 'hand') return 0;
  if (parcelSize === 'xl') return 0; // hors gabarit : frais convenus séparément
  return SHIPPING_RATES[carrier]?.[parcelSize ?? 's'] ?? 0;
}

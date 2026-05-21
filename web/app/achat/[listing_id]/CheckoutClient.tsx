"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createClient } from "@/lib/supabase-browser";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const SHIPPING_OPTIONS = [
  { id: "hand", label: "Remise en main propre", cost: 0, needsAddress: false },
  { id: "relay", label: "Point relais", cost: 5.49, needsAddress: true },
  { id: "colissimo", label: "Colissimo", cost: 8.25, needsAddress: true },
  { id: "chronopost", label: "Chronopost", cost: 16.00, needsAddress: true },
] as const;

type ShippingId = (typeof SHIPPING_OPTIONS)[number]["id"];

interface Props {
  listingId: string;
  basePrice: number;
  accessToken: string;
}

function PaymentForm({
  listingId,
  basePrice,
  shippingId,
  shippingCost,
  deliveryAddress,
  clientSecret,
  paymentIntentId,
  referralCreditUsed,
  total,
}: {
  listingId: string;
  basePrice: number;
  shippingId: ShippingId;
  shippingCost: number;
  deliveryAddress: string;
  clientSecret: string;
  paymentIntentId: string;
  referralCreditUsed: boolean;
  total: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/achat/succes?pi=${paymentIntentId}&listing_id=${listingId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Erreur lors du paiement.");
      setLoading(false);
    }
  }

  const fee = referralCreditUsed
    ? Math.round((basePrice + shippingCost) * 0.04 * 100) / 100
    : Math.round((basePrice + shippingCost) * 0.08 * 100) / 100;

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Objet</span><span>{basePrice} €</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Livraison</span><span>{shippingCost === 0 ? "Gratuit" : `${shippingCost} €`}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Frais de service {referralCreditUsed && <span className="text-primary text-xs ml-1">−50% parrainage</span>}</span>
          <span>{fee.toFixed(2)} €</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between font-bold text-text-primary text-base">
          <span>Total</span><span>{(total / 100).toFixed(2)} €</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <PaymentElement />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary text-background font-semibold py-4 rounded-full hover:bg-primary-dim transition-colors disabled:opacity-40"
      >
        {loading ? "Paiement en cours…" : `Payer ${(total / 100).toFixed(2)} €`}
      </button>

      <p className="text-xs text-text-muted text-center">
        Paiement sécurisé par Stripe · Protection acheteur Pépite
      </p>
    </form>
  );
}

export function CheckoutClient({ listingId, basePrice }: Props) {
  const supabase = createClient();

  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [shipping, setShipping] = useState<ShippingId>("hand");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [piData, setPiData] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    total: number;
    referralCreditUsed: boolean;
    shippingCost: number;
  } | null>(null);

  const selectedOption = SHIPPING_OPTIONS.find((o) => o.id === shipping)!;

  async function continueToPayment() {
    if (selectedOption.needsAddress && !address.trim()) {
      setError("Veuillez entrer une adresse de livraison.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            listing_id: listingId,
            shipping_method: shipping,
            ...(address.trim() ? { delivery_address: address.trim() } : {}),
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Erreur serveur.");

      setPiData({
        clientSecret: json.clientSecret,
        paymentIntentId: json.paymentIntentId,
        total: json.amount,
        referralCreditUsed: json.referralCreditUsed ?? false,
        shippingCost: selectedOption.cost,
      });
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "payment" && piData) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: piData.clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#F5B82E",
              colorBackground: "#1C1A16",
              colorText: "#F5F0E8",
              colorDanger: "#E08766",
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
            },
          },
        }}
      >
        <PaymentForm
          listingId={listingId}
          basePrice={basePrice}
          shippingId={shipping}
          shippingCost={piData.shippingCost}
          deliveryAddress={address}
          clientSecret={piData.clientSecret}
          paymentIntentId={piData.paymentIntentId}
          referralCreditUsed={piData.referralCreditUsed}
          total={piData.total}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl text-text-primary">Mode de livraison</h2>

      <div className="space-y-2">
        {SHIPPING_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
              shipping === opt.id
                ? "border-primary/60 bg-primary/5"
                : "border-border hover:border-border-strong"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                value={opt.id}
                checked={shipping === opt.id}
                onChange={() => { setShipping(opt.id); setError(null); }}
                className="accent-primary"
              />
              <span className="text-sm text-text-primary">{opt.label}</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">
              {opt.cost === 0 ? "Gratuit" : `${opt.cost} €`}
            </span>
          </label>
        ))}
      </div>

      {selectedOption.needsAddress && (
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Adresse de livraison</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Nom, Prénom&#10;Numéro et rue&#10;Code postal, Ville"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none"
          />
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={continueToPayment}
        disabled={loading}
        className="w-full bg-primary text-background font-semibold py-4 rounded-full hover:bg-primary-dim transition-colors disabled:opacity-40"
      >
        {loading ? "Chargement…" : "Continuer vers le paiement →"}
      </button>
    </div>
  );
}

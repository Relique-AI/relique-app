"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";
import { CATEGORIES, CONDITION_COLORS, type Listing } from "@/lib/supabase";

type Condition = "Excellent" | "Bon" | "Correct" | "À restaurer";

interface AIResult {
  unsellable: boolean;
  humourMessage: string | null;
  name: string;
  category: string;
  era: string;
  origin: string;
  condition: Condition;
  conditionNote: string;
  story: string;
  priceMin: number;
  priceMax: number;
  priceSuggested: number;
  sellingTips: string[];
  clarifyingQuestions: string[];
}

interface FormData {
  name: string;
  category: string;
  condition: Condition;
  conditionNote: string;
  story: string;
  era: string;
  origin: string;
  priceFinal: number;
}

const CONDITIONS: Condition[] = ["Excellent", "Bon", "Correct", "À restaurer"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function VendreForm() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "", category: "", condition: "Bon", conditionNote: "",
    story: "", era: "", origin: "", priceFinal: 0,
  });
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const remaining = 5 - photos.length;
    const newFiles = Array.from(files).slice(0, remaining);
    setPhotos((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previewUrls[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addPhotos(e.dataTransfer.files);
  }, [photos]);

  async function analyze() {
    if (photos.length === 0) return;
    setAnalyzing(true);
    setError(null);
    try {
      const base64Photos = await Promise.all(photos.map(fileToBase64));
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-object`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({ photos: base64Photos.map((b) => ({ base64: b })) }),
        }
      );

      if (!res.ok) throw new Error("Erreur lors de l'analyse.");
      const { result } = await res.json() as { result: AIResult };

      if (result.unsellable) {
        setError(result.humourMessage ?? "Cet objet ne peut pas être mis en vente.");
        setAnalyzing(false);
        return;
      }

      setAiResult(result);
      setForm({
        name: result.name,
        category: CATEGORIES.includes(result.category) ? result.category : CATEGORIES[0],
        condition: result.condition,
        conditionNote: result.conditionNote ?? "",
        story: result.story ?? "",
        era: result.era ?? "",
        origin: result.origin ?? "",
        priceFinal: result.priceSuggested,
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté.");

      // Upload images to storage
      const imageUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(path, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw new Error(`Upload échoué : ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(path);
        imageUrls.push(publicUrl);
      }

      const { data, error: insertError } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          name: form.name,
          category: form.category,
          condition: form.condition,
          condition_note: form.conditionNote || null,
          story: form.story || null,
          era: form.era || null,
          origin: form.origin || null,
          price_min: aiResult?.priceMin ?? form.priceFinal,
          price_max: aiResult?.priceMax ?? form.priceFinal,
          price_final: form.priceFinal,
          images: imageUrls,
          status: "active",
        })
        .select("id")
        .single();

      if (insertError || !data) throw new Error(insertError?.message ?? "Erreur lors de la publication.");
      router.push(`/listing/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setPublishing(false);
    }
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          }`}
        >
          <div className="text-4xl mb-3 text-text-muted">📸</div>
          <p className="text-text-primary font-semibold mb-1">Ajoute tes photos</p>
          <p className="text-text-muted text-sm">Glisse-dépose ou clique — jusqu'à 5 photos</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addPhotos(e.target.files)}
          />
        </div>

        {/* Previews */}
        {previewUrls.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                <Image src={url} alt={`photo ${i + 1}`} fill sizes="96px" className="object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-background/80 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-text-muted hover:border-primary/40 transition-colors text-2xl"
              >
                +
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={analyze}
          disabled={photos.length === 0 || analyzing}
          className="w-full bg-primary text-background font-semibold py-4 rounded-full hover:bg-primary-dim transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <span className="animate-spin text-lg">✦</span>
              Analyse en cours…
            </>
          ) : (
            "Analyser avec l'IA →"
          )}
        </button>

        <p className="text-xs text-text-muted text-center">
          L'IA identifie l'objet, son état et propose un prix de marché.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thumbnails recap */}
      <div className="flex gap-2">
        {previewUrls.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={url} alt={`photo ${i + 1}`} fill sizes="64px" className="object-cover" />
          </div>
        ))}
        <button
          onClick={() => setStep(1)}
          className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-text-muted text-xs hover:border-primary/40 transition-colors"
        >
          Modifier
        </button>
      </div>

      {/* AI tips */}
      {aiResult?.sellingTips && aiResult.sellingTips.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-primary mb-2">Conseils de vente ✦</p>
          <ul className="space-y-1">
            {aiResult.sellingTips.map((tip, i) => (
              <li key={i} className="text-xs text-text-muted">• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        <Field label="Titre de l'annonce">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
          />
        </Field>

        <Field label="Catégorie">
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={inputCls}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="État">
          <div className="flex gap-2 flex-wrap">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, condition: c }))}
                className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                style={form.condition === c ? {
                  backgroundColor: CONDITION_COLORS[c] + "22",
                  borderColor: CONDITION_COLORS[c] + "66",
                  color: CONDITION_COLORS[c],
                } : {
                  backgroundColor: "transparent",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Note sur l'état (optionnel)">
          <input
            type="text"
            value={form.conditionNote}
            onChange={(e) => setForm((f) => ({ ...f, conditionNote: e.target.value }))}
            placeholder="Ex : légère rayure sur le côté droit"
            className={inputCls}
          />
        </Field>

        <Field label="Histoire de l'objet">
          <textarea
            value={form.story}
            onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
            rows={4}
            className={inputCls + " resize-none"}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Époque">
            <input
              type="text"
              value={form.era}
              onChange={(e) => setForm((f) => ({ ...f, era: e.target.value }))}
              placeholder="Ex : Années 70"
              className={inputCls}
            />
          </Field>
          <Field label="Origine">
            <input
              type="text"
              value={form.origin}
              onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
              placeholder="Ex : France"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label={`Prix de vente — ${form.priceFinal} €`}>
          {aiResult && (
            <p className="text-xs text-text-muted mb-2">
              Fourchette estimée : {aiResult.priceMin} € – {aiResult.priceMax} €
            </p>
          )}
          <input
            type="range"
            min={aiResult ? Math.max(1, aiResult.priceMin - 20) : 1}
            max={aiResult ? aiResult.priceMax + 50 : 500}
            value={form.priceFinal}
            onChange={(e) => setForm((f) => ({ ...f, priceFinal: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              min={1}
              value={form.priceFinal}
              onChange={(e) => setForm((f) => ({ ...f, priceFinal: Number(e.target.value) }))}
              className="w-28 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
            />
            <span className="self-center text-text-muted text-sm">€</span>
          </div>
        </Field>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={publish}
        disabled={publishing || !form.name || form.priceFinal <= 0}
        className="w-full bg-primary text-background font-semibold py-4 rounded-full hover:bg-primary-dim transition-colors disabled:opacity-40"
      >
        {publishing ? "Publication…" : "Publier l'annonce"}
      </button>

      <p className="text-xs text-text-muted text-center">
        Ton annonce sera visible immédiatement dans Le Marché.
      </p>
    </div>
  );
}

const inputCls =
  "w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

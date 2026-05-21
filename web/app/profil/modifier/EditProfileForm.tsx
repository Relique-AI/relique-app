"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  userId: string;
  initialUsername: string;
  initialAvatarUrl: string | null;
}

export function EditProfileForm({ userId, initialUsername, initialAvatarUrl }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(initialUsername);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let avatarUrl = initialAvatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadError) throw new Error(`Upload échoué : ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrl + `?t=${Date.now()}`;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: username.trim(), avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) throw new Error(updateError.message);

      setSuccess(true);
      router.push("/profil");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-raised border-2 border-border-strong hover:border-primary/40 transition-colors group"
        >
          {avatarPreview ? (
            <Image src={avatarPreview} alt="Avatar" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="text-primary font-serif text-3xl flex items-center justify-center w-full h-full">
              {(username || "?")[0].toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-semibold">Changer</span>
          </div>
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
        <p className="text-xs text-text-muted">Clique sur la photo pour la modifier</p>
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5">Nom d'utilisateur</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
          Profil mis à jour !
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-background font-semibold py-3.5 rounded-full hover:bg-primary-dim transition-colors disabled:opacity-40"
      >
        {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

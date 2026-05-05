// Pépite — sections complémentaires : composants, voix, imagerie, app

/* =========================================================================
   COMPOSANTS UI
   ========================================================================= */
function ComponentsSection() {
  return (
    <section id="composants">
      <div className="wrap">
        <span className="section-eyebrow">04 — Composants</span>
        <h2 className="section-title">Une boîte à outils <em>cohérente.</em></h2>
        <p className="section-lede">
          Boutons arrondis pleins (pill), surfaces sombres, accents dorés. Les pictos sont filaires,
          réguliers, sans fioriture — pour ne pas rivaliser avec l'objet photographié.
        </p>

        {/* Boutons */}
        <ComponentBlock title="Boutons" caption="Hiérarchie : primary (or plein) → secondary (contour) → ghost">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <ButtonPrimary icon={<Icon.Camera size={18} />} size="lg">Scanner un objet</ButtonPrimary>
            <ButtonPrimary size="md">Vendre maintenant</ButtonPrimary>
            <ButtonPrimary size="sm">Confirmer</ButtonPrimary>
            <ButtonSecondary icon={<Icon.Sparkle size={16} />}>Estimer à nouveau</ButtonSecondary>
          </div>
        </ComponentBlock>

        {/* Pills / badges */}
        <ComponentBlock title="Pills & badges" caption="Pour statuts, tags, métadonnées d'estimation">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Pill icon={<Icon.Sparkle size={12} />}>Estimé</Pill>
            <Pill tone="success" icon={<Icon.Check size={12} />}>Vendu</Pill>
            <Pill tone="info">IA en réflexion</Pill>
            <Pill tone="danger">Authenticité à vérifier</Pill>
            <Pill tone="solid">★ Pépite rare</Pill>
          </div>
        </ComponentBlock>

        {/* Cards d'objet */}
        <ComponentBlock title="Cartes objet" caption="Grille du marché et de la collection personnelle">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <ItemCard title="Sac vintage cuir" price="68" range="55–85€" placeholder="SAC" />
            <ItemCard title="Montre quartz" price="142" range="120–180€" placeholder="MONTRE" />
            <ItemCard title="Console retro" price="89" range="70–110€" status="vendu" placeholder="CONSOLE" />
            <ItemCard title="Vase céramique" price="34" range="25–45€" placeholder="VASE" />
          </div>
        </ComponentBlock>

        {/* Inputs */}
        <ComponentBlock title="Champs de saisie" caption="Fond ink-700, focus ring doré">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
            <Input label="Titre de l'annonce" placeholder="Sac vintage en cuir cognac" />
            <Input label="Prix demandé" placeholder="68€" />
            <Textarea label="Description" placeholder="Décris l'état, l'histoire de l'objet…" />
          </div>
        </ComponentBlock>

        {/* Iconographie */}
        <ComponentBlock title="Iconographie" caption="Trait 1.6px, arrondis cohérents, pas de remplissage par défaut">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            {[
              { icon: <Icon.Camera size={28} />, label: "Camera" },
              { icon: <Icon.Sparkle size={28} />, label: "Sparkle" },
              { icon: <Icon.Bag size={28} />, label: "Bag" },
              { icon: <Icon.Grid size={28} />, label: "Grid" },
              { icon: <Icon.Shop size={28} />, label: "Shop" },
              { icon: <Icon.Wallet size={28} />, label: "Wallet" },
              { icon: <Icon.User size={28} />, label: "User" },
              { icon: <Icon.Heart size={28} />, label: "Heart" },
              { icon: <Icon.Trend size={28} />, label: "Trend" },
              { icon: <Icon.Check size={28} />, label: "Check" },
            ].map(i => (
              <div key={i.label} style={{
                background: "var(--ink-800)",
                borderRadius: "var(--r-md)",
                padding: "24px 12px",
                textAlign: "center",
                color: "var(--gold-500)",
                border: "1px solid rgba(245,184,46,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{i.icon}</div>
                <div className="caption">{i.label}</div>
              </div>
            ))}
          </div>
        </ComponentBlock>
      </div>
    </section>
  );
}

function ComponentBlock({ title, caption, children }) {
  return (
    <div style={{ marginTop: 56 }}>
      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 24,
        margin: "0 0 6px", color: "var(--cream-50)",
      }}>{title}</h3>
      <div className="caption" style={{ marginBottom: 24 }}>{caption}</div>
      <div style={{
        background: "var(--ink-900)",
        border: "1px solid rgba(245,184,46,0.08)",
        borderRadius: "var(--r-lg)",
        padding: 36,
      }}>
        {children}
      </div>
    </div>
  );
}

function Input({ label, placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <div className="caption" style={{ marginBottom: 8 }}>{label}</div>
      <input
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "var(--ink-700)",
          border: "1px solid var(--ink-500)",
          borderRadius: "var(--r-sm)",
          padding: "14px 16px",
          color: "var(--cream-50)",
          fontFamily: "var(--font-ui)",
          fontSize: 15,
          outline: "none",
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--gold-500)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--ink-500)"}
      />
    </label>
  );
}

function Textarea({ label, placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <div className="caption" style={{ marginBottom: 8 }}>{label}</div>
      <textarea
        placeholder={placeholder}
        rows={3}
        style={{
          width: "100%",
          background: "var(--ink-700)",
          border: "1px solid var(--ink-500)",
          borderRadius: "var(--r-sm)",
          padding: "14px 16px",
          color: "var(--cream-50)",
          fontFamily: "var(--font-ui)",
          fontSize: 15,
          outline: "none",
          resize: "vertical",
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--gold-500)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--ink-500)"}
      />
    </label>
  );
}

/* =========================================================================
   VOIX & TON + IMAGERIE
   ========================================================================= */
function VoiceSection() {
  return (
    <section id="voix">
      <div className="wrap">
        <span className="section-eyebrow">05 — Voix & ton</span>
        <h2 className="section-title">On tutoie, <em>on rassure, on s'efface.</em></h2>
        <p className="section-lede">
          Pépite parle comme un ami qui s'y connaît — sans jargon, sans hype, avec un sourire dans la voix.
          L'IA ne se met jamais en avant : c'est l'objet, et la trouvaille, qui comptent.
        </p>

        {/* 4 piliers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 64 }}>
          {[
            { title: "Chaleureux", body: "Tutoiement systématique. Phrases courtes. On évite le ton corporate." },
            { title: "Précis", body: "Un chiffre vaut mieux qu'un adjectif. Une fourchette de prix > « ça vaut quelque chose »." },
            { title: "Modeste", body: "L'IA dit « je pense que » plutôt que « cet objet vaut »." },
            { title: "Joueur", body: "Quelques clins d'œil affectifs (« t'as une pépite »), jamais lourds." },
          ].map(p => (
            <div key={p.title} style={{
              background: "var(--ink-900)",
              border: "1px solid rgba(245,184,46,0.08)",
              borderRadius: "var(--r-md)",
              padding: 28,
            }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, color: "var(--gold-500)", margin: "0 0 10px" }}>{p.title}</h4>
              <p style={{ fontSize: 14, color: "var(--cream-100)", opacity: 0.75, margin: 0, lineHeight: 1.55 }}>{p.body}</p>
            </div>
          ))}
        </div>

        {/* Yes / No */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 32 }}>
          <VoiceExample ok>
            <em>« On a trouvé ta pépite : un sac Lancel des années 90, plutôt rare. »</em>
          </VoiceExample>
          <VoiceExample>
            <em>« Notre intelligence artificielle a identifié votre article comme étant un sac à main de la marque Lancel. »</em>
          </VoiceExample>
          <VoiceExample ok>
            <em>« Entre 55 € et 85 €. On parie sur 68 €. »</em>
          </VoiceExample>
          <VoiceExample>
            <em>« La fourchette de prix optimale a été calculée par nos algorithmes propriétaires. »</em>
          </VoiceExample>
        </div>

        {/* Imagerie / direction photo */}
        <div style={{ marginTop: 96 }}>
          <span className="caption">Direction artistique · imagerie</span>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 36, margin: "12px 0 24px", color: "var(--cream-50)" }}>
            L'objet en pleine lumière, le reste s'efface.
          </h3>
          <p style={{ fontSize: 16, color: "var(--cream-100)", opacity: 0.75, maxWidth: 640, lineHeight: 1.6 }}>
            Photographies en lumière chaude, fonds sombres et terreux, légère vignette.
            On photographie l'objet comme une pièce de musée — mais sans solennité.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 32 }}>
            <ImgPlaceholder label="objet · fond chaud · 4:3" aspect="4 / 3" />
            <ImgPlaceholder label="détail · macro · 1:1" aspect="1 / 1" />
            <ImgPlaceholder label="contexte · vie quotidienne" aspect="4 / 3" />
            <ImgPlaceholder label="pile d'objets · narratif" aspect="3 / 4" />
          </div>
        </div>
      </div>
    </section>
  );
}

function VoiceExample({ children, ok = false }) {
  return (
    <div style={{
      padding: 28,
      background: "var(--ink-900)",
      border: `1px solid ${ok ? "rgba(181,212,121,0.25)" : "rgba(224,135,102,0.25)"}`,
      borderRadius: "var(--r-md)",
    }}>
      <div className="caption" style={{ color: ok ? "var(--success)" : "var(--danger)", marginBottom: 12 }}>
        {ok ? "✓ COMME ÇA" : "✗ PAS COMME ÇA"}
      </div>
      <p style={{
        fontFamily: "var(--font-display)",
        fontSize: 18,
        lineHeight: 1.5,
        color: "var(--cream-50)",
        margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}

Object.assign(window, { ComponentsSection, VoiceSection });

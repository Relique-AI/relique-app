// Pépite — sections principales du brand book

/* =========================================================================
   HERO / MANIFESTE
   ========================================================================= */
function HeroSection() {
  return (
    <section id="manifeste" style={{ paddingTop: 140, paddingBottom: 160, position: "relative", overflow: "hidden" }}>
      {/* Halo doré derrière */}
      <div style={{
        position: "absolute",
        top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 900, height: 900,
        background: "radial-gradient(circle, rgba(245,184,46,0.18) 0%, rgba(245,184,46,0.04) 35%, transparent 60%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      <div className="wrap" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <PepiteMark size={140} glow />
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: "clamp(64px, 10vw, 160px)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          margin: "32px 0 24px",
          color: "var(--gold-500)",
        }}>
          Pépite
        </h1>
        <p style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(20px, 2.4vw, 32px)",
          color: "var(--cream-100)",
          margin: "0 auto 56px",
          maxWidth: 720,
          lineHeight: 1.4,
        }}>
          Tes objets valent plus que tu ne crois.
        </p>

        {/* Métadonnées brand book */}
        <div style={{
          display: "inline-flex",
          gap: 48,
          padding: "20px 36px",
          border: "1px solid rgba(245,184,46,0.15)",
          borderRadius: "var(--r-pill)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--warm-400)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          <span>Univers graphique</span>
          <span style={{ color: "var(--gold-700)" }}>·</span>
          <span>v1.0</span>
          <span style={{ color: "var(--gold-700)" }}>·</span>
          <span>Mai 2026</span>
        </div>
      </div>

      {/* Manifeste en 3 colonnes */}
      <div className="wrap" style={{ marginTop: 140, position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <span className="section-eyebrow">Manifeste</span>
          <h2 className="section-title" style={{ marginTop: 12 }}>
            Trois mouvements,<br /><em>une seule promesse.</em>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { num: "01", icon: <Icon.Camera size={28} />, title: "Scanne", body: "Pointe ta caméra. On reconnaît l'objet, sa marque, son modèle, son état." },
            { num: "02", icon: <Icon.Sparkle size={28} />, title: "Estime", body: "On compare aux ventes réelles. Tu obtiens une fourchette de prix juste, en quelques secondes." },
            { num: "03", icon: <Icon.Bag size={28} />, title: "Vends", body: "Une annonce prête à publier. Tu valides, on s'occupe de la mise en avant." },
          ].map((step) => (
            <div key={step.num} style={{
              background: "var(--ink-900)",
              border: "1px solid rgba(245,184,46,0.08)",
              borderRadius: "var(--r-lg)",
              padding: 40,
            }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--gold-700)",
                letterSpacing: "0.2em",
                marginBottom: 28,
              }}>
                {step.num}
              </div>
              <div style={{ color: "var(--gold-500)", marginBottom: 24 }}>
                {step.icon}
              </div>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 32,
                margin: "0 0 12px",
                color: "var(--cream-50)",
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 15, color: "var(--cream-100)", opacity: 0.75, margin: 0, lineHeight: 1.6 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   LOGO
   ========================================================================= */
function LogoSection() {
  return (
    <section id="logo">
      <div className="wrap">
        <span className="section-eyebrow">01 — Logo</span>
        <h2 className="section-title">Un sceau, <em>un mot.</em></h2>
        <p className="section-lede">
          Le symbole — un sparkle dans un anneau doré — évoque la trouvaille qui scintille.
          Le wordmark, en serif italique, lui donne sa chaleur d'objet précieux.
        </p>

        {/* Logo principal — large, centré */}
        <div style={{
          marginTop: 80,
          padding: "100px 40px",
          background: "var(--ink-900)",
          borderRadius: "var(--r-lg)",
          border: "1px solid rgba(245,184,46,0.08)",
          textAlign: "center",
        }}>
          <PepiteLockup size={88} direction="vertical" />
          <div className="caption" style={{ marginTop: 60 }}>Lockup principal · vertical</div>
        </div>

        {/* Variantes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
          <LogoCell label="Lockup horizontal">
            <PepiteLockup size={36} direction="horizontal" />
          </LogoCell>
          <LogoCell label="Wordmark seul">
            <PepiteWordmark size={48} />
          </LogoCell>
          <LogoCell label="Symbole seul">
            <PepiteMark size={80} />
          </LogoCell>
          <LogoCell label="Monogramme · favicon">
            <PepiteMonogram size={64} />
          </LogoCell>
        </div>

        {/* Versions monochrome */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
          <LogoCell label="Sur fond clair" bg="var(--cream-50)">
            <PepiteLockup size={36} color="var(--ink-1000)" />
          </LogoCell>
          <LogoCell label="Mono — doré sur cream" bg="var(--cream-100)">
            <PepiteWordmark size={48} color="var(--gold-700)" />
          </LogoCell>
          <LogoCell label="Mono — cream sur ink" bg="var(--ink-800)">
            <PepiteWordmark size={48} color="var(--cream-50)" />
          </LogoCell>
        </div>

        {/* Do / Don't */}
        <div style={{ marginTop: 80 }}>
          <span className="caption">Règles d'usage</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 20 }}>
            <RuleCard ok title="Espace de respiration">
              Garde au moins la hauteur d'un sparkle autour du logo.
            </RuleCard>
            <RuleCard ok title="Sur les fonds chauds">
              Le doré sur ink-1000 ou cream-50 est la combinaison reine.
            </RuleCard>
            <RuleCard title="Pas d'effet ni de gradient">
              Le sparkle est plein. Pas d'ombre portée, pas de dégradé.
            </RuleCard>
            <RuleCard title="Pas de rotation ni d'étirement">
              Le wordmark reste droit, jamais déformé.
            </RuleCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoCell({ children, label, bg = "var(--ink-800)" }) {
  return (
    <div style={{
      background: bg,
      borderRadius: "var(--r-md)",
      border: "1px solid rgba(245,184,46,0.06)",
      padding: 40,
      minHeight: 200,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 32,
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>{children}</div>
      <div className="caption">{label}</div>
    </div>
  );
}

function RuleCard({ title, children, ok = false }) {
  return (
    <div style={{
      padding: 24,
      background: "var(--ink-900)",
      borderRadius: "var(--r-md)",
      border: `1px solid ${ok ? "rgba(181,212,121,0.2)" : "rgba(224,135,102,0.2)"}`,
    }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: ok ? "var(--success)" : "var(--danger)",
      }}>
        {ok ? "✓ À FAIRE" : "✗ À ÉVITER"}
      </div>
      <h4 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: 20,
        margin: "0 0 8px",
        color: "var(--cream-50)",
      }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, color: "var(--cream-100)", opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  );
}

/* =========================================================================
   COULEURS
   ========================================================================= */
function ColorsSection() {
  const golds = [
    { name: "Gold 100", hex: "#FFF4D6", role: "Halo, états très clairs", v: "--gold-100" },
    { name: "Gold 300", hex: "#FBD56B", role: "Hover, accents légers", v: "--gold-300" },
    { name: "Gold 500", hex: "#F5B82E", role: "Or principal — boutons, wordmark", v: "--gold-500", primary: true },
    { name: "Gold 600", hex: "#D9A024", role: "Anneau du symbole, hover", v: "--gold-600" },
    { name: "Gold 700", hex: "#A87A1A", role: "Bordures, texte secondaire", v: "--gold-700" },
    { name: "Gold 800", hex: "#6E4F11", role: "Bronze profond", v: "--gold-800" },
  ];
  const inks = [
    { name: "Ink 1000", hex: "#0B0907", role: "Fond principal de l'app", v: "--ink-1000", primary: true },
    { name: "Ink 900",  hex: "#110D08", role: "Cards, surfaces", v: "--ink-900" },
    { name: "Ink 800",  hex: "#1A1410", role: "Surfaces élevées", v: "--ink-800" },
    { name: "Ink 700",  hex: "#241C16", role: "Inputs, dividers", v: "--ink-700" },
    { name: "Ink 500",  hex: "#463930", role: "Hover surfaces", v: "--ink-500" },
  ];
  const neutrals = [
    { name: "Cream 50",  hex: "#FAF6EC", role: "Texte principal sur ink", v: "--cream-50", primary: true },
    { name: "Cream 100", hex: "#F1EAD9", role: "Texte secondaire", v: "--cream-100" },
    { name: "Cream 200", hex: "#E0D4BA", role: "Texte tertiaire", v: "--cream-200" },
    { name: "Warm 400",  hex: "#A99680", role: "Texte désactivé, captions", v: "--warm-400" },
    { name: "Warm 500",  hex: "#7E6E5C", role: "Métadonnées, footer", v: "--warm-500" },
  ];
  const semantic = [
    { name: "Success", hex: "#B5D479", role: "Confirmé · vendu", v: "--success" },
    { name: "Danger",  hex: "#E08766", role: "Erreur · refus", v: "--danger" },
    { name: "Info",    hex: "#C9A9DB", role: "Info · IA en réflexion", v: "--info" },
  ];

  return (
    <section id="couleurs">
      <div className="wrap">
        <span className="section-eyebrow">02 — Couleurs</span>
        <h2 className="section-title">Une nuit chaude, <em>une lueur d'or.</em></h2>
        <p className="section-lede">
          Le noir n'est pas froid : il est terreux, profond, tirant vers le brun.
          L'or est solaire, jamais clinquant. Le tout fait écrin à l'objet qu'on photographie.
        </p>

        <div style={{ marginTop: 64 }}>
          <ColorRow title="Or — la pépite" swatches={golds} />
          <ColorRow title="Ink — la nuit chaude" swatches={inks} />
          <ColorRow title="Cream — les neutres" swatches={neutrals} />
          <ColorRow title="Sémantique" swatches={semantic} />
        </div>

        {/* Combinaisons recommandées */}
        <div style={{ marginTop: 64 }}>
          <span className="caption">Combinaisons signature</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }}>
            <ComboCard bg="#0B0907" fg="#F5B82E" label="Hero · Boutons primaires" />
            <ComboCard bg="#0B0907" fg="#FAF6EC" label="Texte courant" />
            <ComboCard bg="#FAF6EC" fg="#0B0907" label="Mode clair · Documents" />
            <ComboCard bg="#F5B82E" fg="#0B0907" label="CTA pleins · Accents" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ColorRow({ title, swatches }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h3 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: 24,
        margin: "0 0 20px",
        color: "var(--cream-50)",
      }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {swatches.map((s) => (
          <div key={s.name} style={{
            background: "var(--ink-900)",
            borderRadius: "var(--r-md)",
            border: s.primary ? "1px solid var(--gold-700)" : "1px solid rgba(245,184,46,0.06)",
            overflow: "hidden",
          }}>
            <div style={{ height: 100, background: s.hex, position: "relative" }}>
              {s.primary && (
                <span style={{
                  position: "absolute",
                  top: 8, right: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  background: "var(--ink-1000)",
                  color: "var(--gold-500)",
                  padding: "3px 7px",
                  borderRadius: 4,
                }}>★</span>
              )}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--cream-50)", marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--warm-400)", marginBottom: 6 }}>{s.hex}</div>
              <div style={{ fontSize: 11, color: "var(--cream-200)", opacity: 0.6, lineHeight: 1.4 }}>{s.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComboCard({ bg, fg, label }) {
  return (
    <div style={{
      borderRadius: "var(--r-md)",
      overflow: "hidden",
      border: "1px solid rgba(245,184,46,0.06)",
    }}>
      <div style={{
        background: bg,
        color: fg,
        padding: "32px 20px",
        fontFamily: "var(--font-display)",
        fontSize: 28,
        fontWeight: 500,
        textAlign: "center",
      }}>Pépite</div>
      <div style={{ padding: "10px 14px", background: "var(--ink-900)" }}>
        <div className="caption">{label}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--warm-500)", marginTop: 4 }}>
          {bg} / {fg}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   TYPOGRAPHIE
   ========================================================================= */
function TypographySection() {
  return (
    <section id="typographie">
      <div className="wrap">
        <span className="section-eyebrow">03 — Typographie</span>
        <h2 className="section-title">Deux voix, <em>un dialogue.</em></h2>
        <p className="section-lede">
          Fraunces porte les titres avec une élégance presque éditoriale ; Inter parle l'UI
          avec clarté. Ensemble, elles créent la tension entre objet précieux et outil moderne.
        </p>

        {/* Specimens */}
        <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {/* Fraunces */}
          <div style={{
            background: "var(--ink-900)",
            border: "1px solid rgba(245,184,46,0.08)",
            borderRadius: "var(--r-lg)",
            padding: 48,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div className="caption">Famille de titres</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 36, margin: "8px 0 0" }}>
                  Fraunces
                </h3>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--warm-400)", letterSpacing: "0.1em" }}>
                Serif · Variable · Google Fonts
              </div>
            </div>

            <div style={{ fontFamily: "var(--font-display)", color: "var(--gold-500)", fontWeight: 500, fontSize: "clamp(64px, 9vw, 128px)", lineHeight: 1, letterSpacing: "-0.03em" }}>
              Aa
            </div>
            <div style={{ fontFamily: "var(--font-display)", color: "var(--cream-50)", fontStyle: "italic", fontSize: 28, marginTop: 24, fontWeight: 400 }}>
              Tes objets valent plus que tu ne crois.
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--warm-400)", marginTop: 24, letterSpacing: "0.05em" }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ &nbsp; abcdefghijklmnopqrstuvwxyz &nbsp; 0123456789 &nbsp; àéèêïôœç
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginTop: 32 }}>
              {[
                { w: 300, label: "Light 300" },
                { w: 400, label: "Regular 400" },
                { w: 500, label: "Medium 500" },
                { w: 600, label: "Semi 600" },
                { w: 700, label: "Bold 700" },
              ].map(s => (
                <div key={s.w}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: s.w, fontSize: 32, color: "var(--cream-50)", lineHeight: 1 }}>
                    Pépite
                  </div>
                  <div className="caption" style={{ marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Inter */}
          <div style={{
            background: "var(--ink-900)",
            border: "1px solid rgba(245,184,46,0.08)",
            borderRadius: "var(--r-lg)",
            padding: 48,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div className="caption">Famille UI</div>
                <h3 style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 36, margin: "8px 0 0" }}>
                  Inter
                </h3>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--warm-400)", letterSpacing: "0.1em" }}>
                Sans-serif · Variable · Google Fonts
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-ui)", color: "var(--cream-50)", fontWeight: 600, fontSize: "clamp(64px, 9vw, 128px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              Aa
            </div>
            <div style={{ fontSize: 18, color: "var(--cream-100)", marginTop: 24, lineHeight: 1.5, maxWidth: 560 }}>
              Pointez votre caméra vers n'importe quel objet — sac, montre, console, livre, vêtement — et obtenez une estimation en moins de cinq secondes.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginTop: 32 }}>
              {[
                { w: 400, label: "Regular 400" },
                { w: 500, label: "Medium 500" },
                { w: 600, label: "Semi 600" },
                { w: 700, label: "Bold 700" },
              ].map(s => (
                <div key={s.w}>
                  <div style={{ fontFamily: "var(--font-ui)", fontWeight: s.w, fontSize: 22, color: "var(--cream-50)", lineHeight: 1 }}>
                    Scanne, estime
                  </div>
                  <div className="caption" style={{ marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Échelle typographique */}
        <div style={{ marginTop: 64 }}>
          <span className="caption">Échelle</span>
          <div style={{ marginTop: 24, borderTop: "1px solid rgba(245,184,46,0.08)" }}>
            {[
              { label: "Display", style: { fontFamily: "var(--font-display)", fontSize: 96, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em" }, sample: "Une trouvaille", spec: "96 / 96 · Fraunces 500 · -3%" },
              { label: "H1",      style: { fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.02em" }, sample: "Tes objets valent plus", spec: "56 / 62 · Fraunces 500" },
              { label: "H2",      style: { fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500, lineHeight: 1.2 }, sample: "Vide-grenier intelligent", spec: "36 / 43 · Fraunces 500" },
              { label: "H3",      style: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, lineHeight: 1.3 }, sample: "Comment ça marche", spec: "24 / 31 · Fraunces 500" },
              { label: "Body L",  style: { fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 400, lineHeight: 1.6 }, sample: "Pointez votre caméra vers n'importe quel objet.", spec: "18 / 29 · Inter 400" },
              { label: "Body",    style: { fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 400, lineHeight: 1.6 }, sample: "On compare aux ventes réelles pour estimer un prix juste.", spec: "15 / 24 · Inter 400" },
              { label: "Caption", style: { fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" }, sample: "ESTIMATION INSTANTANÉE", spec: "11 · JetBrains Mono · +15% tracking" },
            ].map((row) => (
              <div key={row.label} style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 220px",
                alignItems: "baseline",
                padding: "28px 0",
                borderBottom: "1px solid rgba(245,184,46,0.06)",
                gap: 24,
              }}>
                <div className="caption">{row.label}</div>
                <div style={{ ...row.style, color: "var(--cream-50)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.sample}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--warm-500)", textAlign: "right" }}>
                  {row.spec}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HeroSection, LogoSection, ColorsSection, TypographySection });

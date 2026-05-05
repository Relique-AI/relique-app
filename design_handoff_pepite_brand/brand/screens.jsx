// Pépite — 3 écrans clés rendus dans iOS frame

/* Écran 1 — Home (le scanner) — recrée fidèlement le screenshot original */
function ScreenHome() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--ink-1000)",
      display: "flex", flexDirection: "column",
      padding: "20px 24px 0",
      color: "var(--cream-50)",
      fontFamily: "var(--font-ui)",
    }}>
      {/* Logo mark centré */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <PepiteMark size={100} glow />
      </div>

      {/* Wordmark */}
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: 64,
        textAlign: "center",
        color: "var(--gold-500)",
        margin: "32px 0 12px",
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        Pépite
      </h1>

      <p style={{
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        fontStyle: "italic",
        fontSize: 19,
        textAlign: "center",
        color: "var(--cream-100)",
        margin: "0 auto 40px",
        maxWidth: 280,
        lineHeight: 1.4,
      }}>
        Tes objets valent plus<br />que tu ne crois.
      </p>

      {/* 3 étapes */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 40,
        gap: 4,
      }}>
        {[
          { icon: <Icon.Camera size={16} />, label: "Scanne" },
          { icon: <Icon.Sparkle size={16} />, label: "Estime" },
          { icon: <Icon.Bag size={16} />, label: "Vends" },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: "rgba(245,184,46,0.08)",
                border: "1px solid var(--gold-700)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--gold-500)",
              }}>{s.icon}</div>
              <span style={{ fontSize: 12, color: "var(--cream-100)" }}>{s.label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: "var(--gold-800)" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* CTA principal */}
      <ButtonPrimary icon={<Icon.Camera size={18} />} size="lg" full>
        Scanner un objet
      </ButtonPrimary>

      <p style={{
        fontSize: 11,
        textAlign: "center",
        color: "var(--warm-400)",
        margin: "20px 0 0",
        fontStyle: "italic",
      }}>
        Pointez votre caméra vers n'importe quel objet
      </p>

      <div style={{ flex: 1 }} />

      {/* Tab bar */}
      <TabBar active="scanner" />
    </div>
  );
}

/* Écran 2 — Résultat de scan */
function ScreenResult() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--ink-1000)",
      display: "flex", flexDirection: "column",
      color: "var(--cream-50)",
      fontFamily: "var(--font-ui)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{
          width: 36, height: 36, borderRadius: 999,
          background: "var(--ink-800)",
          border: "1px solid var(--ink-600)",
          color: "var(--cream-50)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>←</button>
        <div className="caption" style={{ flex: 1 }}>RÉSULTAT DU SCAN</div>
      </div>

      {/* Image objet */}
      <div style={{ padding: "0 24px" }}>
        <ImgPlaceholder label="sac vintage cognac" aspect="4 / 3" />
      </div>

      {/* Détails */}
      <div style={{ padding: "24px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Pill icon={<Icon.Sparkle size={11} />}>Identifié</Pill>
          <Pill tone="solid">★ Pépite rare</Pill>
        </div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 500,
          margin: "0 0 4px",
          letterSpacing: "-0.01em",
        }}>
          Sac Lancel années 90
        </h2>
        <p style={{ fontSize: 13, color: "var(--warm-400)", margin: 0 }}>
          Cuir cognac · État très bon · Authentifié
        </p>
      </div>

      {/* Estimation card */}
      <div style={{
        margin: "0 24px",
        padding: 20,
        background: "linear-gradient(135deg, rgba(245,184,46,0.12), rgba(245,184,46,0.04))",
        border: "1px solid var(--gold-700)",
        borderRadius: "var(--r-md)",
      }}>
        <div className="caption" style={{ color: "var(--gold-600)", marginBottom: 8 }}>ESTIMATION</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: 44,
            color: "var(--gold-500)",
            lineHeight: 1,
          }}>68€</span>
          <span style={{ fontSize: 13, color: "var(--cream-200)" }}>fourchette 55–85€</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--cream-100)", opacity: 0.65, margin: "8px 0 0", fontStyle: "italic" }}>
          Basé sur 24 ventes récentes d'objets similaires.
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {/* CTA */}
      <div style={{ padding: "16px 24px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        <ButtonPrimary size="md" full>Mettre en vente à 68€</ButtonPrimary>
        <ButtonSecondary full>Ajuster le prix</ButtonSecondary>
      </div>

      <TabBar active="scanner" />
    </div>
  );
}

/* Écran 3 — Marché */
function ScreenMarket() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--ink-1000)",
      display: "flex", flexDirection: "column",
      color: "var(--cream-50)",
      fontFamily: "var(--font-ui)",
    }}>
      <div style={{ padding: "20px 24px 16px" }}>
        <div className="caption" style={{ marginBottom: 8 }}>MARCHÉ</div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 500,
          margin: 0,
          letterSpacing: "-0.01em",
        }}>
          Pépites du jour
        </h2>
      </div>

      {/* Filter pills */}
      <div style={{ padding: "0 24px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        <Pill tone="solid">Tout</Pill>
        <Pill>Vintage</Pill>
        <Pill>Tech</Pill>
        <Pill>Mode</Pill>
        <Pill>Maison</Pill>
      </div>

      {/* Grid */}
      <div style={{ padding: "0 24px", flex: 1, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ItemCard title="Sac Lancel 90s" price="68" range="55–85€" placeholder="SAC" />
          <ItemCard title="Walkman Sony" price="42" range="35–55€" placeholder="WALKMAN" />
          <ItemCard title="Vase Vallauris" price="34" range="25–45€" placeholder="VASE" />
          <ItemCard title="Polaroid 600" price="55" range="45–70€" placeholder="POLAROID" />
        </div>
      </div>

      <TabBar active="marche" />
    </div>
  );
}

function TabBar({ active }) {
  const tabs = [
    { id: "scanner", icon: <Icon.Camera size={20} />, label: "Scanner" },
    { id: "parcourir", icon: <Icon.Grid size={20} />, label: "Parcourir" },
    { id: "marche", icon: <Icon.Shop size={20} />, label: "Marché" },
    { id: "wallet", icon: <Icon.Wallet size={20} />, label: "Portefeuille" },
    { id: "profil", icon: <Icon.User size={20} />, label: "Profil" },
  ];
  return (
    <div style={{
      borderTop: "1px solid var(--ink-700)",
      padding: "10px 8px 8px",
      display: "flex",
      justifyContent: "space-around",
      background: "var(--ink-1000)",
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <div key={t.id} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: on ? "var(--gold-500)" : "var(--warm-400)",
            fontSize: 10,
            fontWeight: on ? 600 : 400,
          }}>
            {t.icon}
            <span>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Section App — assemble les 3 écrans dans le frame iOS */
function AppSection() {
  return (
    <section id="app">
      <div className="wrap">
        <span className="section-eyebrow">06 — Application</span>
        <h2 className="section-title">L'univers <em>en mouvement.</em></h2>
        <p className="section-lede">
          Trois écrans clés où l'identité s'incarne : le scanner d'accueil, le résultat d'estimation, et le marché.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 32,
          marginTop: 80,
          justifyItems: "center",
        }}>
          {[
            { label: "01 · Accueil — le scanner", screen: <ScreenHome /> },
            { label: "02 · Résultat — l'estimation", screen: <ScreenResult /> },
            { label: "03 · Marché — découvrir", screen: <ScreenMarket /> },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ transform: "scale(0.78)", transformOrigin: "top center", marginBottom: -100 }}>
                <IOSDevice dark={true}>{s.screen}</IOSDevice>
              </div>
              <div className="caption">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { ScreenHome, ScreenResult, ScreenMarket, AppSection });

// Pépite — composants UI réutilisables (boutons, badges, cards, icons)

// Pictos filaires, cohérents avec l'écran de référence
const Icon = {
  Camera: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5h3.5L8 6h8l1.5 2.5H21v11H3z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  ),
  Sparkle: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Bag: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  ),
  Grid: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Shop: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9l1-4h14l1 4" />
      <path d="M5 9v11h14V9" />
      <path d="M4 9a3 3 0 0 0 6 0 3 3 0 0 0 4 0 3 3 0 0 0 6 0" />
    </svg>
  ),
  Wallet: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M16 13h3" />
      <path d="M3 9h14a2 2 0 0 1 0 4H3" />
    </svg>
  ),
  User: ({ size = 20, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" />
    </svg>
  ),
  ArrowRight: ({ size = 16, stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Check: ({ size = 16, stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  Heart: ({ size = 18, stroke = 1.6, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </svg>
  ),
  Trend: ({ size = 18, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
};

// Bouton primaire (or plein) — comme dans l'écran de référence
function ButtonPrimary({ children, icon, size = "md", style = {}, full = false }) {
  const sizes = {
    sm: { padding: "10px 18px", fontSize: 13 },
    md: { padding: "16px 28px", fontSize: 15 },
    lg: { padding: "20px 36px", fontSize: 17 },
  };
  return (
    <button
      style={{
        background: "var(--gold-500)",
        color: "var(--ink-1000)",
        border: "none",
        borderRadius: "var(--r-pill)",
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: full ? "100%" : "auto",
        boxShadow: "0 8px 24px rgba(245,184,46,0.25)",
        transition: "transform 0.15s, box-shadow 0.2s",
        ...sizes[size],
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(245,184,46,0.35)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,184,46,0.25)"; }}
    >
      {icon}
      {children}
    </button>
  );
}

function ButtonSecondary({ children, icon, full = false, style = {} }) {
  return (
    <button
      style={{
        background: "transparent",
        color: "var(--gold-500)",
        border: "1px solid var(--gold-700)",
        borderRadius: "var(--r-pill)",
        padding: "14px 24px",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        width: full ? "100%" : "auto",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// Pill / badge
function Pill({ children, tone = "default", icon }) {
  const tones = {
    default: { bg: "rgba(245,184,46,0.1)", color: "var(--gold-300)", border: "rgba(245,184,46,0.2)" },
    success: { bg: "rgba(181,212,121,0.12)", color: "var(--success)", border: "rgba(181,212,121,0.25)" },
    danger:  { bg: "rgba(224,135,102,0.12)", color: "var(--danger)",  border: "rgba(224,135,102,0.25)" },
    info:    { bg: "rgba(201,169,219,0.12)", color: "var(--info)",    border: "rgba(201,169,219,0.25)" },
    solid:   { bg: "var(--gold-500)", color: "var(--ink-1000)", border: "var(--gold-500)" },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: "var(--r-pill)",
      background: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`,
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
    }}>
      {icon}{children}
    </span>
  );
}

// Carte d'objet (utilisée dans les écrans Marché)
function ItemCard({ title, price, range, status = "estimé", placeholder = "OBJET" }) {
  return (
    <div style={{
      background: "var(--ink-800)",
      borderRadius: "var(--r-md)",
      overflow: "hidden",
      border: "1px solid rgba(245,184,46,0.06)",
    }}>
      <div style={{
        aspectRatio: "1 / 1",
        background: `repeating-linear-gradient(45deg, var(--ink-700), var(--ink-700) 8px, var(--ink-800) 8px, var(--ink-800) 16px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "var(--warm-400)",
        }}>{placeholder}</span>
        {status === "vendu" && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            padding: "4px 8px",
            background: "var(--success)",
            color: "var(--ink-1000)",
            fontSize: 10,
            fontWeight: 600,
            borderRadius: 4,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>Vendu</div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, color: "var(--cream-50)", fontWeight: 500, marginBottom: 4 }}>{title}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--gold-500)", fontWeight: 500 }}>
          {price}€
        </div>
        {range && (
          <div style={{ fontSize: 10, color: "var(--warm-400)", fontFamily: "var(--font-mono)" }}>
            {range}
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder image stripé (pour aperçu d'objets)
function ImgPlaceholder({ label = "produit", aspect = "4 / 3", radius = "var(--r-md)" }) {
  return (
    <div style={{
      aspectRatio: aspect,
      background: `repeating-linear-gradient(45deg, var(--ink-700), var(--ink-700) 10px, var(--ink-800) 10px, var(--ink-800) 20px)`,
      borderRadius: radius,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid rgba(245,184,46,0.06)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--warm-400)",
      }}>{label}</span>
    </div>
  );
}

Object.assign(window, { Icon, ButtonPrimary, ButtonSecondary, Pill, ItemCard, ImgPlaceholder });

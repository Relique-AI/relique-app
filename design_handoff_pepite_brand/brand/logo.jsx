// Pépite — composants logo réutilisables

// Le sparkle 4 branches — repris du screenshot original
function PepiteSparkle({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
        fill={color}
      />
    </svg>
  );
}

// Symbole circulaire complet : anneau doré + sparkle au centre
function PepiteMark({ size = 96, ring = true, glow = false }) {
  const stroke = Math.max(2, size * 0.05);
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        filter: glow ? "drop-shadow(0 0 24px rgba(245,184,46,0.45))" : "none",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {ring && (
          <>
            <circle cx="50" cy="50" r="46" stroke="var(--gold-600)" strokeWidth={stroke * 0.6} />
            <circle cx="50" cy="50" r="42" fill="var(--ink-900)" />
          </>
        )}
        <path
          d="M50 22 L54.5 45.5 L78 50 L54.5 54.5 L50 78 L45.5 54.5 L22 50 L45.5 45.5 Z"
          fill="var(--gold-500)"
        />
      </svg>
    </div>
  );
}

// Wordmark (le mot "Pépite" en serif)
function PepiteWordmark({ size = 64, color = "var(--gold-500)" }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        color,
        fontVariationSettings: '"opsz" 144',
        display: "inline-block",
      }}
    >
      Pépite
    </span>
  );
}

// Lockup horizontal (symbole + wordmark côte à côte)
function PepiteLockup({ size = 56, color = "var(--gold-500)", direction = "horizontal" }) {
  if (direction === "vertical") {
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: size * 0.3 }}>
        <PepiteMark size={size * 1.6} />
        <PepiteWordmark size={size} color={color} />
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.35 }}>
      <PepiteMark size={size * 1.3} />
      <PepiteWordmark size={size} color={color} />
    </div>
  );
}

// Monogramme (un P stylisé dans un cercle, pour avatar / favicon)
function PepiteMonogram({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="var(--gold-500)" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontSize="62"
        fontWeight="500"
        fill="var(--ink-1000)"
        style={{ fontStyle: "italic" }}
      >
        P
      </text>
    </svg>
  );
}

Object.assign(window, { PepiteSparkle, PepiteMark, PepiteWordmark, PepiteLockup, PepiteMonogram });

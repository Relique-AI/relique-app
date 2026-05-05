// Pépite — point d'entrée + Tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "goldHue": 45,
  "goldChroma": 0.16,
  "goldLight": 0.78,
  "displayFont": "Fraunces",
  "radius": 16,
  "showApp": true
}/*EDITMODE-END*/;

function applyTweaks(t) {
  const root = document.documentElement;
  // Or principal recalculé en oklch
  root.style.setProperty("--gold-500", `oklch(${t.goldLight} ${t.goldChroma} ${t.goldHue})`);
  root.style.setProperty("--gold-300", `oklch(${Math.min(0.95, t.goldLight + 0.1)} ${t.goldChroma * 0.8} ${t.goldHue})`);
  root.style.setProperty("--gold-600", `oklch(${t.goldLight - 0.1} ${t.goldChroma} ${t.goldHue})`);
  root.style.setProperty("--gold-700", `oklch(${t.goldLight - 0.22} ${t.goldChroma * 0.85} ${t.goldHue})`);
  root.style.setProperty("--gold-800", `oklch(${t.goldLight - 0.38} ${t.goldChroma * 0.6} ${t.goldHue})`);

  // Police titre
  const fontMap = {
    "Fraunces": '"Fraunces", Georgia, serif',
    "Playfair Display": '"Playfair Display", Georgia, serif',
    "DM Serif Display": '"DM Serif Display", Georgia, serif',
    "Cormorant Garamond": '"Cormorant Garamond", Georgia, serif',
  };
  root.style.setProperty("--font-display", fontMap[t.displayFont] || fontMap["Fraunces"]);

  // Radius
  root.style.setProperty("--r-md", `${t.radius}px`);
  root.style.setProperty("--r-lg", `${t.radius + 8}px`);
}

// Charge dynamiquement les fonts non-Fraunces si besoin
function ensureFont(family) {
  const id = `font-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    ensureFont(tweaks.displayFont);
    applyTweaks(tweaks);
  }, [tweaks]);

  return (
    <>
      <HeroSection />
      <LogoSection />
      <ColorsSection />
      <TypographySection />
      <ComponentsSection />
      <VoiceSection />
      {tweaks.showApp && <AppSection />}

      <TweaksPanel>
        <TweakSection label="Or — la pépite" />
        <TweakSlider label="Teinte (hue)" value={tweaks.goldHue} min={20} max={90} step={1}
          onChange={(v) => setTweak("goldHue", v)} unit="°" />
        <TweakSlider label="Saturation" value={tweaks.goldChroma} min={0.05} max={0.22} step={0.01}
          onChange={(v) => setTweak("goldChroma", v)} />
        <TweakSlider label="Luminosité" value={tweaks.goldLight} min={0.6} max={0.92} step={0.01}
          onChange={(v) => setTweak("goldLight", v)} />

        <TweakSection label="Typographie" />
        <TweakSelect label="Police titre" value={tweaks.displayFont}
          options={["Fraunces", "Playfair Display", "DM Serif Display", "Cormorant Garamond"]}
          onChange={(v) => setTweak("displayFont", v)} />

        <TweakSection label="Forme" />
        <TweakSlider label="Radius cards" value={tweaks.radius} min={0} max={28} step={1}
          onChange={(v) => setTweak("radius", v)} unit="px" />

        <TweakSection label="Sections" />
        <TweakToggle label="Afficher la section App" value={tweaks.showApp}
          onChange={(v) => setTweak("showApp", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

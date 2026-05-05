// Pépite design tokens — gold palette, warm ink blacks, cream text
export const colors = {
  // ── Semantic aliases (used throughout the app) ─────────────────────────────
  background:   '#0B0907',           // ink.1000 — main app background
  surface:      '#1A1410',           // ink.800  — cards, surfaces
  surfaceDeep:  '#110D08',           // ink.900  — deeper surfaces
  surfaceRaised:'#241C16',           // ink.700  — inputs, dividers
  primary:      '#F5B82E',           // gold.500 — buttons, wordmark
  primaryDim:   '#D9A024',           // gold.600 — ring, hover
  primaryLight: 'rgba(245,184,46,0.10)', // default pill bg
  textPrimary:  '#FAF6EC',           // cream.50  — main text on ink
  textSecondary:'#F1EAD9',           // cream.100 — secondary text
  textTertiary: '#E0D4BA',           // cream.200 — tertiary text
  textDisabled: '#A99680',           // warm.400  — disabled, captions
  textMuted:    '#7E6E5C',           // warm.500  — metadata, footer
  chipBackground:'#241C16',          // ink.700
  border:       'rgba(245,184,46,0.06)',  // card borders
  borderStrong: 'rgba(245,184,46,0.18)', // tab bar, inputs
  // ── Full palette ────────────────────────────────────────────────────────────
  gold: {
    100: '#FFF4D6',
    300: '#FBD56B',
    500: '#F5B82E',
    600: '#D9A024',
    700: '#A87A1A',
    800: '#6E4F11',
    900: '#3F2D08',
  },
  ink: {
    1000: '#0B0907',
    900:  '#110D08',
    800:  '#1A1410',
    700:  '#241C16',
    600:  '#322820',
    500:  '#463930',
  },
  cream: {
    50:  '#FAF6EC',
    100: '#F1EAD9',
    200: '#E0D4BA',
  },
  warm: {
    400: '#A99680',
    500: '#7E6E5C',
  },
  // ── Semantic status ─────────────────────────────────────────────────────────
  success: '#B5D479',
  danger:  '#E08766',
  info:    '#C9A9DB',
};

export const fonts = {
  // Display — Fraunces (editorial serif)
  serif:         'Fraunces_500Medium',
  serifRegular:  'Fraunces_400Regular',
  serifItalic:   'Fraunces_400Regular_Italic',
  // UI — Inter
  body:          'Inter_400Regular',
  bodySemiBold:  'Inter_600SemiBold',
  // Captions — JetBrains Mono
  mono:          'JetBrainsMono_500Medium',
  monoRegular:   'JetBrainsMono_400Regular',
};

export const radius = {
  xs:   6,
  sm:   10,
  md:   16,   // cards
  lg:   24,   // large surfaces
  pill: 999,  // buttons, pills
};

export const spacing = {
  base:    16,
  section: 24,
};

export const shadow = {
  card:          { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 60, elevation: 20 },
  buttonPrimary: { shadowColor: '#F5B82E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 },
};

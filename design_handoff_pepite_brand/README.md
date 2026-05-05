# Handoff — Univers graphique Pépite

## Vue d'ensemble

Pépite est une app qui permet à n'importe qui de **scanner un objet, obtenir une estimation de prix juste, et le mettre en vente** — en quelques secondes. Ce dossier contient l'univers graphique complet de la marque (logo, couleurs, typographie, composants, voix) à appliquer sur l'app existante.

## À propos des fichiers de design

Les fichiers HTML inclus dans ce dossier sont des **références de design**, pas du code de production. Ils montrent l'intention visuelle, les composants, et l'application sur 3 écrans clés. Ta mission est de **recréer ce système dans le codebase existant** (React Native / Expo / SwiftUI / autre — utilise ce qui est déjà en place) en suivant les patterns et la stack du projet.

Si le codebase n'a pas encore de système de design, crée un fichier de tokens (`tokens.ts` / `theme.ts` / `colors.ts`) à partir de la section **Design Tokens** ci-dessous, puis branche-le sur les composants existants.

## Fidélité

**High-fidelity.** Les couleurs (hex exacts), la typographie (Fraunces + Inter), les radius, les paddings et les états sont définitifs. À reproduire au pixel près dans le framework cible.

## Personnalité de la marque

> **Précieux mais accessible.** La pépite n'est pas un lingot froid — c'est la trouvaille chaleureuse qu'on met en lumière. Élégance éditoriale + chaleur du tutoiement + mécanique ludique du scan.

Quatre piliers de voix :
- **Chaleureux** — tutoiement systématique, phrases courtes, jamais corporate
- **Précis** — un chiffre vaut mieux qu'un adjectif (« 68€, fourchette 55–85€ » > « ça vaut quelque chose »)
- **Modeste** — l'IA dit « on pense que » plutôt que « cet objet vaut »
- **Joueur** — clins d'œil affectifs (« t'as une pépite »), jamais lourds

## Design Tokens

### Couleurs

```ts
export const colors = {
  // Or — la pépite (couleur primaire)
  gold: {
    100: '#FFF4D6',  // halo, états très clairs
    300: '#FBD56B',  // hover, accents légers
    500: '#F5B82E',  // ★ primaire — boutons, wordmark
    600: '#D9A024',  // anneau du symbole, hover
    700: '#A87A1A',  // bordures, texte secondaire
    800: '#6E4F11',  // bronze profond
    900: '#3F2D08',
  },
  // Ink — noirs chauds (pas neutres, tirent vers le brun)
  ink: {
    1000: '#0B0907', // ★ fond principal de l'app
    900:  '#110D08', // cards, surfaces
    800:  '#1A1410', // surfaces élevées
    700:  '#241C16', // inputs, dividers
    600:  '#322820',
    500:  '#463930', // hover surfaces
  },
  // Cream — neutres chauds (texte sur fond sombre)
  cream: {
    50:  '#FAF6EC',  // ★ texte principal sur ink
    100: '#F1EAD9',  // texte secondaire
    200: '#E0D4BA',  // texte tertiaire
  },
  warm: {
    400: '#A99680',  // texte désactivé, captions
    500: '#7E6E5C',  // métadonnées, footer
  },
  // Sémantique — harmonisée avec la palette chaude
  success: '#B5D479', // vert tilleul
  danger:  '#E08766', // terracotta
  info:    '#C9A9DB', // mauve poudré
};
```

### Typographie

```ts
export const fonts = {
  display: '"Fraunces", Georgia, serif',  // titres, wordmark, italique éditorial
  ui:      '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',  // UI, body
  mono:    '"JetBrains Mono", ui-monospace, monospace', // captions, métadonnées
};

// Échelle (taille / line-height / weight)
export const text = {
  display: { size: 96, lh: 96, weight: 500, family: fonts.display, tracking: '-0.03em' },
  h1:      { size: 56, lh: 62, weight: 500, family: fonts.display, tracking: '-0.02em' },
  h2:      { size: 36, lh: 43, weight: 500, family: fonts.display },
  h3:      { size: 24, lh: 31, weight: 500, family: fonts.display },
  bodyL:   { size: 18, lh: 29, weight: 400, family: fonts.ui },
  body:    { size: 15, lh: 24, weight: 400, family: fonts.ui },
  caption: { size: 11, lh: 14, weight: 500, family: fonts.mono, tracking: '0.15em', uppercase: true },
};
```

Sources : Google Fonts — `Fraunces` (variable, opsz 9..144, weights 300..700, ital), `Inter` (300..700), `JetBrains Mono` (400, 500).

### Spacing & forme

```ts
export const radius = {
  xs: 6,
  sm: 10,
  md: 16,    // cards par défaut
  lg: 24,    // surfaces larges
  pill: 999, // boutons, pills
};

export const shadow = {
  glow: '0 0 60px rgba(245, 184, 46, 0.18)',  // halo doré derrière le logo
  card: '0 20px 60px rgba(0, 0, 0, 0.5)',
  buttonPrimary: '0 8px 24px rgba(245,184,46,0.25)',
  buttonHover: '0 12px 32px rgba(245,184,46,0.35)',
};
```

## Logo

### Anatomie

- **Symbole** : sparkle 4 branches doré (`#F5B82E`) **dans un anneau** doré (stroke `#D9A024`, 3px sur 100×100), centre `#110D08`.
- **Wordmark** : « Pépite » en **Fraunces 500**, letter-spacing -0.02em, couleur `#F5B82E` sur fond sombre, `#0B0907` sur fond clair.

### Path SVG du sparkle (à conserver tel quel)

```
M50 22 L54.5 45.5 L78 50 L54.5 54.5 L50 78 L45.5 54.5 L22 50 L45.5 45.5 Z
```
(viewBox 0 0 100 100)

### Variantes
- **Vertical** (par défaut, splash, hero) : symbole au-dessus, wordmark en dessous
- **Horizontal** : symbole + wordmark côte à côte, gap = 35% de la taille du wordmark
- **Symbole seul** : favicon, avatars
- **Wordmark seul** : titres documents
- **Monogramme** : « P » italique Fraunces sur disque doré, pour avatars

### Règles
✓ Garder un espace de respiration égal à la hauteur d'un sparkle autour du logo
✓ Sur fonds chauds (ink-1000 ou cream-50)
✗ Pas d'effet, pas de gradient, pas d'ombre portée sur le sparkle
✗ Pas de rotation ni d'étirement

## Composants UI

### Bouton primaire
- Background : `gold.500` (#F5B82E)
- Texte : `ink.1000` (#0B0907), Inter 600
- Border-radius : `pill` (999px)
- Padding : `16px 28px` (md), `20px 36px` (lg), `10px 18px` (sm)
- Box-shadow : `shadow.buttonPrimary`
- Hover : translateY(-1px) + `shadow.buttonHover`
- Icon (optionnel) : à gauche du texte, gap 10px

### Bouton secondaire
- Background : transparent
- Texte : `gold.500`, Inter 500
- Border : 1px solid `gold.700`
- Border-radius : `pill`
- Padding : `14px 24px`

### Pill / badge
- Padding : `6px 12px`
- Border-radius : `pill`
- Border : 1px solid (couleur tonale)
- Font : Inter 500, 12px
- Tonalités :
  - `default` : bg `rgba(245,184,46,0.1)`, text `gold.300`, border `rgba(245,184,46,0.2)`
  - `success` : bg `rgba(181,212,121,0.12)`, text `success`, border `rgba(181,212,121,0.25)`
  - `danger` : bg `rgba(224,135,102,0.12)`, text `danger`
  - `info` : bg `rgba(201,169,219,0.12)`, text `info`
  - `solid` : bg `gold.500`, text `ink.1000` (pour « ★ Pépite rare »)

### Carte d'objet
- Background : `ink.800`
- Border-radius : `md` (16px)
- Border : 1px solid `rgba(245,184,46,0.06)`
- Image carrée en haut (aspect 1:1), placeholder rayé diagonal
- Padding texte : 12px
- Titre : Inter 500, 13px, `cream.50`
- Prix : Fraunces 500, 18px, `gold.500`
- Fourchette : JetBrains Mono, 10px, `warm.400`
- Badge "Vendu" en overlay top-left (vert success)

### Inputs
- Background : `ink.700`
- Border : 1px solid `ink.500`
- Border-radius : `sm` (10px)
- Padding : `14px 16px`
- Texte : Inter 400, 15px, `cream.50`
- Focus : border devient `gold.500`
- Label en caption (mono uppercase) au-dessus, gap 8px

### Iconographie
- Style **filaire**, stroke 1.6px, line-cap & line-join `round`
- Pas de remplissage par défaut (sauf icônes de statut)
- Set principal : Camera, Sparkle (étoile 4 branches), Bag, Grid, Shop, Wallet, User, Heart, Trend, Check, ArrowRight
- Voir `Brand Book.html` section Composants pour les paths SVG exacts

## Écrans clés (référence)

Voir `Brand Book.html` section "Application" et `Brand Book Deck.html` slide 8.

### 01 · Accueil — le scanner
- Symbole + halo doré (filter drop-shadow 24px gold.500 à 45% opacité), centré
- Wordmark Fraunces 64px gold.500
- Tagline : « Tes objets valent plus que tu ne crois. » Fraunces italique 19px cream.100
- Indicateur 3 étapes (Scanne · Estime · Vends) avec lignes de connexion gold.800
- CTA primaire pleine largeur : « Scanner un objet » avec icône camera
- Tab bar 5 items : Scanner (actif gold.500), Parcourir, Marché, Portefeuille, Profil

### 02 · Résultat — l'estimation
- Bouton retour rond 36×36 ink.800
- Image objet 4:3 placeholder
- Pills : « Identifié » (default) + « ★ Pépite rare » (solid)
- Titre objet : Fraunces 28px
- Métadonnées : Inter 13px warm.400 (« Cuir cognac · État très bon · Authentifié »)
- **Card estimation** : background gradient `linear-gradient(135deg, rgba(245,184,46,0.12), rgba(245,184,46,0.04))`, border 1px gold.700
  - Caption "ESTIMATION" en mono gold.600
  - Prix : Fraunces 500 44px gold.500
  - Fourchette à côté : 13px cream.200
  - Note italique en dessous : 12px cream.100 60% opacité
- CTA : « Mettre en vente à 68€ » (primaire) + « Ajuster le prix » (secondaire)

### 03 · Marché — découvrir
- Header caption « MARCHÉ » + titre Fraunces 32px « Pépites du jour »
- Filter pills horizontaux scrollables (« Tout » solid actif, autres default)
- Grille 2 colonnes de cartes objet, gap 12px

## Voix & ton — exemples

| ✓ Comme ça | ✗ Pas comme ça |
|---|---|
| « On a trouvé ta pépite : un sac Lancel des années 90, plutôt rare. » | « Notre intelligence artificielle a identifié votre article comme étant un sac à main de la marque Lancel. » |
| « Entre 55 € et 85 €. On parie sur 68 €. » | « La fourchette de prix optimale a été calculée par nos algorithmes propriétaires. » |

## Imagerie

- Photographies en **lumière chaude**, fonds sombres et terreux, légère vignette
- L'objet comme pièce de musée — sans solennité
- **Placeholder en attendant** : motif rayé diagonal `repeating-linear-gradient(45deg, ink-700, ink-700 10px, ink-800 10px, ink-800 20px)` avec label en mono uppercase

## Effets globaux

- **Grain subtil** sur le fond : SVG noise turbulence, opacité 0.035, mix-blend-mode overlay (voir `Brand Book.html` `body::before`)
- **Halo doré** derrière les éléments hero : `radial-gradient(circle, rgba(245,184,46,0.18) 0%, rgba(245,184,46,0.04) 35%, transparent 60%)`
- **Selection** : background `gold.500`, color `ink.1000`

## Fichiers fournis

- `Brand Book.html` — brand book scrollable complet (référence visuelle principale, contient tweaks pour explorer variantes de teinte/typo/radius)
- `Brand Book Deck.html` — version slide-deck 1920×1080 (9 slides)
- `tokens.css` — variables CSS prêtes à l'emploi
- `tokens.json` — mêmes tokens en JSON (pour Tailwind config / theme provider)
- `brand/` — composants React JSX du brand book (logo, icons, boutons, pills, cards) qui peuvent servir de référence d'implémentation
- `ios-frame.jsx` — frame iPhone utilisé pour rendre les écrans
- Screenshot de référence original (`reference-original.jpg`)

## Stack & implémentation suggérée

Si le codebase est en **React Native / Expo** :
- Charger Fraunces et Inter via `expo-font` ou `@expo-google-fonts/fraunces` et `@expo-google-fonts/inter`
- Créer `theme.ts` avec les tokens ci-dessus
- Wrapper l'app avec un `ThemeProvider` ou consommer directement
- Recréer les composants (`PepiteButton`, `PepiteIcon`, `PepitePill`, `PepiteCard`) en suivant les specs

Si le codebase est en **SwiftUI** :
- Ajouter Color extensions pour `gold500`, `ink1000`, etc. dans `Assets.xcassets`
- Créer un `PepiteTheme.swift` avec les fonts et radius
- Recréer les composants en `View` SwiftUI

Si **web** : utiliser les `tokens.css` directement, importer les fonts depuis Google Fonts, ou config Tailwind avec `tokens.json`.

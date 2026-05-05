const sharp = require('sharp');

const SIZE = 1024;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCLE_R = 370;
const BORDER = 5;
const STAR_OUTER = 195;
const STAR_INNER = 58;

function starPath(cx, cy, outerR, innerR) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
}

const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#F0A500" stop-opacity="0.28"/>
      <stop offset="65%"  stop-color="#F0A500" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#F0A500" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
  </defs>

  <!-- Fond -->
  <rect width="${SIZE}" height="${SIZE}" fill="#0F0E0B"/>

  <!-- Halo diffus -->
  <circle cx="${CX}" cy="${CY}" r="${CIRCLE_R + 120}" fill="url(#glow)" filter="url(#blur)"/>

  <!-- Cercle flou (glow du bord) -->
  <circle cx="${CX}" cy="${CY}" r="${CIRCLE_R}" fill="none"
          stroke="#F0A500" stroke-width="14" opacity="0.25" filter="url(#blur)"/>

  <!-- Cercle principal -->
  <circle cx="${CX}" cy="${CY}" r="${CIRCLE_R}"
          fill="rgba(240,165,0,0.04)" stroke="#F0A500" stroke-width="${BORDER}"/>

  <!-- Étoile 4 branches -->
  <path d="${starPath(CX, CY, STAR_OUTER, STAR_INNER)}" fill="#F0A500"/>
</svg>`;

async function run() {
  const buf = Buffer.from(svg);
  await sharp(buf).png().toFile('assets/icon.png');
  console.log('✓ assets/icon.png');
  await sharp(buf).png().toFile('assets/adaptive-icon.png');
  console.log('✓ assets/adaptive-icon.png');
  await sharp(buf).png().toFile('assets/splash-icon.png');
  console.log('✓ assets/splash-icon.png');
  console.log('\nIcones générées. Lance: eas build --platform android --profile preview');
}

run().catch(console.error);

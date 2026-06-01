const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TARGET_W = 1320;
const TARGET_H = 2868;

const inputs = [
  'WhatsApp Image 2026-06-01 at 12.38.29.jpeg',
  'WhatsApp Image 2026-06-01 at 12.38.29 (1).jpeg',
];

const assetsDir = path.join(__dirname, '..', 'assets');
const outDir = path.join(assetsDir, 'screenshots-appstore');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (let i = 0; i < inputs.length; i++) {
    const src = path.join(assetsDir, inputs[i]);
    const dest = path.join(outDir, `screenshot_${i + 1}.png`);

    await sharp(src)
      .resize(TARGET_W, TARGET_H, {
        fit: 'contain',
        background: { r: 11, g: 9, b: 7 }, // #0B0907 — fond de l'app
      })
      .toFile(dest);

    console.log(`✓ screenshot_${i + 1}.png → ${TARGET_W}×${TARGET_H}`);
  }
  console.log(`\nFichiers dans : assets/screenshots-appstore/`);
})();

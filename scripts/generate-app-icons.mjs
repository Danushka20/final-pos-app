/**
 * Generates Android launcher icons from assets/app-icon-source.png
 * Run: node scripts/generate-app-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'app-icon-source.png');
const resRoot = path.join(root, 'android', 'app', 'src', 'main', 'res');

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function writePng(outPath, size, input) {
  await sharp(input)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(outPath);
}

async function main() {
  if (!fs.existsSync(source)) {
    console.error('Missing', source);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(resRoot, folder);
    await ensureDir(dir);
    await writePng(path.join(dir, 'ic_launcher.png'), size, source);
    await writePng(path.join(dir, 'ic_launcher_round.png'), size, source);
    console.log('Wrote', folder, size);
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = path.join(resRoot, folder);
    await ensureDir(dir);
    await writePng(path.join(dir, 'ic_launcher_foreground.png'), size, source);
    console.log('Wrote foreground', folder, size);
  }

  const anydpi = path.join(resRoot, 'mipmap-anydpi-v26');
  await ensureDir(anydpi);
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  await fs.promises.writeFile(path.join(anydpi, 'ic_launcher.xml'), adaptive);
  await fs.promises.writeFile(path.join(anydpi, 'ic_launcher_round.xml'), adaptive);

  const valuesDir = path.join(resRoot, 'values');
  await ensureDir(valuesDir);
  const colorsPath = path.join(valuesDir, 'ic_launcher_colors.xml');
  const colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0284c7</color>
</resources>
`;
  await fs.promises.writeFile(colorsPath, colors);

  console.log('Done. Android launcher icons are ready.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

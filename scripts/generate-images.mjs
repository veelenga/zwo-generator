import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateImages() {
  // Convert OG image SVG to PNG
  const ogSvg = readFileSync(join(publicDir, 'og-image.svg'));
  await sharp(ogSvg)
    .resize(1200, 630)
    .png()
    .toFile(join(publicDir, 'og-image.png'));
  console.log('Generated og-image.png');

  // Convert favicon SVG to apple-touch-icon PNG
  const faviconSvg = readFileSync(join(publicDir, 'favicon.svg'));
  await sharp(faviconSvg)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
}

generateImages().catch(console.error);

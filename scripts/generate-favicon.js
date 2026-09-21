const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="url(#treeGrad)" />
  <g transform="translate(14, 14) scale(1.5)" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
    <path d="M7 16v6"/>
    <path d="M13 19v3"/>
    <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>
  </g>
</svg>`;

async function run() {
  const root = path.resolve(__dirname, '..');
  const publicDir = path.join(root, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG icons in public
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

  // Generate PNG buffers
  const sizes = [16, 32, 48, 180, 192, 512];
  const pngBuffers = {};
  for (const s of sizes) {
    pngBuffers[s] = await sharp(Buffer.from(svgContent)).resize(s, s).png().toBuffer();
  }

  // Save apple touch icon & android icons
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffers[180]);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffers[192]);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffers[512]);

  // Build standard ICO file with 16, 32, 48
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  let headerLength = 6 + count * 16;
  let offset = headerLength;
  
  const headerBuf = Buffer.alloc(6);
  headerBuf.writeUInt16LE(0, 0); // reserved
  headerBuf.writeUInt16LE(1, 2); // 1 = ICO
  headerBuf.writeUInt16LE(count, 4);

  const entryBuffers = [];
  const dataBuffers = [];

  for (const s of icoSizes) {
    const png = pngBuffers[s];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0);
    entry.writeUInt8(s >= 256 ? 0 : s, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(png.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    
    entryBuffers.push(entry);
    dataBuffers.push(png);
    offset += png.length;
  }

  const icoBuf = Buffer.concat([headerBuf, ...entryBuffers, ...dataBuffers]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

  console.log('Successfully generated favicon files in public/!');
}

run().catch(console.error);

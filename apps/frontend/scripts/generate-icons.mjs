/**
 * Cinelog PWA icon generator — no external dependencies.
 * Produces: pwa-192x192.png, pwa-512x512.png, apple-touch-icon-180x180.png
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ── CRC32 ── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ── PNG encoding ── */
function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.allocUnsafe(4);
  lb.writeUInt32BE(data.length, 0);
  const crc = Buffer.allocUnsafe(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([lb, tb, data, crc]);
}

function encodePNG(width, height, getPixel) {
  const stride = width * 3 + 1;
  const raw = Buffer.allocUnsafe(height * stride);

  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      const off = y * stride + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 7 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Geometry helpers ── */
function distSq(x, y, cx, cy) {
  return (x - cx) ** 2 + (y - cy) ** 2;
}

function inRoundedRect(x, y, x1, y1, x2, y2, r) {
  if (x < x1 || x > x2 || y < y1 || y > y2) return false;
  if (x < x1 + r && y < y1 + r) return distSq(x, y, x1 + r, y1 + r) <= r * r;
  if (x > x2 - r && y < y1 + r) return distSq(x, y, x2 - r, y1 + r) <= r * r;
  if (x < x1 + r && y > y2 - r) return distSq(x, y, x1 + r, y2 - r) <= r * r;
  if (x > x2 - r && y > y2 - r) return distSq(x, y, x2 - r, y2 - r) <= r * r;
  return true;
}

/* 5-pointed star via ray-casting polygon test */
function buildStarPoly(cx, cy, outerR, innerR) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function inPolygon(px, py, poly) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ── Icon renderer ── */
function makeIconRenderer(size) {
  const cx = size / 2, cy = size / 2;
  const margin = size * 0.09;
  const cornerR = size * 0.17;
  const cardX1 = margin, cardY1 = margin, cardX2 = size - margin, cardY2 = size - margin;

  const starOuter = size * 0.30;
  const starInner = size * 0.12;
  const star = buildStarPoly(cx, cy, starOuter, starInner);

  // Hairline at top of card: gradient amber band
  const hlY1 = margin + 0.5;
  const hlH = Math.max(2, size * 0.012);

  // Colors (RGB)
  const BG    = [8,   8,  11];   // #08080b
  const CARD  = [24, 36,  44];   // #18242c
  const AMBER = [232, 185, 116]; // #e8b974
  const AMBER_DIM = [150, 110, 60];

  return function getPixel(x, y) {
    const inCard = inRoundedRect(x, y, cardX1, cardY1, cardX2, cardY2, cornerR);
    if (!inCard) return BG;

    // Hairline (gradient fade on left/right edges)
    if (y >= hlY1 && y < hlY1 + hlH) {
      const span = cardX2 - cardX1 - cornerR * 2;
      const tx = (x - (cardX1 + cornerR)) / span;
      const fade = Math.min(tx, 1 - tx) * 4;
      const clamp = Math.min(1, Math.max(0, fade));
      return AMBER.map((c, i) => Math.round(lerp(CARD[i], c, clamp * 0.9)));
    }

    // Star — with soft 1px glow ring
    if (inPolygon(x + 0.5, y + 0.5, star)) return AMBER;

    // Subtle glow: check nearby sub-pixels in star
    let glowCount = 0;
    const subSamples = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]];
    for (const [dx, dy] of subSamples) {
      if (inPolygon(x + dx, y + dy, star)) glowCount++;
    }
    if (glowCount > 0) {
      const t = glowCount / 4;
      return AMBER.map((c, i) => Math.round(lerp(CARD[i], c, t)));
    }

    return CARD;
  };
}

/* ── Generate and write icons ── */
const ICONS = [
  { size: 512, file: 'pwa-512x512.png' },
  { size: 192, file: 'pwa-192x192.png' },
  { size: 180, file: 'apple-touch-icon-180x180.png' },
  { size: 64,  file: 'pwa-64x64.png' },
];

const outDir = join(__dirname, '..', 'public', 'icons');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const { size, file } of ICONS) {
  const t0 = Date.now();
  const png = encodePNG(size, size, makeIconRenderer(size));
  const out = join(outDir, file);
  writeFileSync(out, png);
  console.log(`  ${file}  ${size}x${size}  ${png.length} bytes  (${Date.now() - t0}ms)`);
}

console.log('\nIcons written to public/icons/');

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'public', 'icon');
const SIZES = [16, 32, 48, 96, 128];
const STORE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'images', 'store');
const SUPERSAMPLE = 4;

const BACKGROUND = [47, 111, 235];
const FOREGROUND = [255, 255, 255];

/**
 * The Repohopper mark, on a unit square: a card with a second card tilted
 * behind it, as if dealt from a deck, and an arrow on the front card for the
 * hop to another tool.
 */
const TILE = { left: 0.02, top: 0.02, right: 0.98, bottom: 0.98, radius: 0.22 };
const BACK_CARD = { left: 0.18, top: 0.28, right: 0.54, bottom: 0.72, radius: 0.07, angle: -12 };
const BACK_CARD_OPACITY = 0.55;
const FRONT_CARD = { left: 0.34, top: 0.27, right: 0.82, bottom: 0.73, radius: 0.085 };
const ARROW_WIDTH = 0.075;
const ARROW = [
  [0.47, 0.5, 0.69, 0.5],
  [0.6, 0.41, 0.69, 0.5],
  [0.6, 0.59, 0.69, 0.5],
];

function inRoundedRect(x, y, { left, top, right, bottom, radius }) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius;
}

function inRotatedRect(x, y, rect) {
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  const turn = (-rect.angle * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return inRoundedRect(
    cx + dx * Math.cos(turn) - dy * Math.sin(turn),
    cy + dx * Math.sin(turn) + dy * Math.cos(turn),
    rect,
  );
}

function nearSegment(x, y, [x1, y1, x2, y2], width) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / (vx * vx + vy * vy)));
  return (x - (x1 + t * vx)) ** 2 + (y - (y1 + t * vy)) ** 2 <= (width / 2) ** 2;
}

/** The colour at one point, or null outside the tile. Later layers paint over earlier ones. */
function sample(x, y) {
  if (!inRoundedRect(x, y, TILE)) return null;
  let colour = BACKGROUND;
  if (inRotatedRect(x, y, BACK_CARD)) {
    colour = colour.map((c, i) => c + (FOREGROUND[i] - c) * BACK_CARD_OPACITY);
  }
  if (inRoundedRect(x, y, FRONT_CARD)) {
    colour = FOREGROUND;
    if (ARROW.some((segment) => nearSegment(x, y, segment, ARROW_WIDTH))) colour = BACKGROUND;
  }
  return colour;
}

function renderPixels(size) {
  const scale = size * SUPERSAMPLE;
  const pixels = Buffer.alloc(size * size * 4);
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let covered = 0;
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const colour = sample(
            (px * SUPERSAMPLE + sx + 0.5) / scale,
            (py * SUPERSAMPLE + sy + 0.5) / scale,
          );
          if (colour === null) continue;
          covered += 1;
          for (let channel = 0; channel < 3; channel += 1) sum[channel] += colour[channel];
        }
      }
      const offset = (py * size + px) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[offset + channel] = covered === 0 ? 0 : Math.round(sum[channel] / covered);
      }
      pixels[offset + 3] = Math.round((covered / samples) * 255);
    }
  }

  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Centres a rendered icon in a larger transparent square. */
function padded(size, artwork) {
  const pixels = Buffer.alloc(size * size * 4);
  const inner = Math.sqrt(artwork.length / 4);
  const offset = (size - inner) / 2;
  for (let y = 0; y < inner; y += 1) {
    artwork.copy(pixels, ((y + offset) * size + offset) * 4, y * inner * 4, (y + 1) * inner * 4);
  }
  return pixels;
}

function write(file, size, pixels) {
  writeFileSync(file, encodePng(size, pixels));
  console.log(`wrote ${file}`);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) write(join(OUT_DIR, `${size}.png`), size, renderPixels(size));

// Store listing art. Chrome asks for 96 px of artwork inside 16 px of transparent
// padding at 128; Edge for a 300 px logo.
mkdirSync(STORE_DIR, { recursive: true });
write(join(STORE_DIR, 'icon-128-chrome.png'), 128, padded(128, renderPixels(96)));
write(join(STORE_DIR, 'icon-300-edge.png'), 300, renderPixels(300));

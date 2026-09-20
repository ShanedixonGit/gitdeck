import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'public', 'icon');
const SIZES = [16, 32, 48, 96, 128];
const SUPERSAMPLE = 4;

const BACKGROUND = [47, 111, 235];
const FOREGROUND = [255, 255, 255];

const BARS = [
  { top: 0.28, height: 0.1, left: 0.28, right: 0.72 },
  { top: 0.45, height: 0.1, left: 0.22, right: 0.78 },
  { top: 0.62, height: 0.1, left: 0.28, right: 0.72 },
];

function roundedRectCoverage(x, y, left, top, right, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function renderPixels(size) {
  const scale = size * SUPERSAMPLE;
  const pixels = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const x = (px * SUPERSAMPLE + sx + 0.5) / scale;
          const y = (py * SUPERSAMPLE + sy + 0.5) / scale;
          if (!roundedRectCoverage(x, y, 0.02, 0.02, 0.98, 0.98, 0.22)) continue;
          bg += 1;
          for (const bar of BARS) {
            const barRadius = bar.height / 2;
            if (
              roundedRectCoverage(
                x,
                y,
                bar.left,
                bar.top,
                bar.right,
                bar.top + bar.height,
                barRadius,
              )
            ) {
              fg += 1;
              break;
            }
          }
        }
      }

      const samples = SUPERSAMPLE * SUPERSAMPLE;
      const alpha = bg / samples;
      const mix = bg === 0 ? 0 : fg / bg;
      const offset = (py * size + px) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[offset + channel] = Math.round(
          BACKGROUND[channel] * (1 - mix) + FOREGROUND[channel] * mix,
        );
      }
      pixels[offset + 3] = Math.round(alpha * 255);
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

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = join(OUT_DIR, `${size}.png`);
  writeFileSync(file, encodePng(size, renderPixels(size)));
  console.log(`wrote ${file}`);
}

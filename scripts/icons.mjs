// Renders the app icons (web, Android TV launcher and banner) from a 16×16 snowflake grid into PNGs
// (node:zlib only; no image libraries).
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const FLAKE = [
  '................',
  '.......ww.......',
  '....w..ww..w....',
  '.....w.ww.w.....',
  '......wwww......',
  '.w.....ww.....w.',
  '..w....ww....w..',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  '..w....ww....w..',
  '.w.....ww.....w.',
  '......wwww......',
  '.....w.ww.w.....',
  '....w..ww..w....',
  '.......ww.......',
  '................',
];
const BG = [0x1b, 0x2a, 0x44];
const FG = [0xe8, 0xf1, 0xfa];

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, pixel) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const i = y * stride + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function icon(size, padding) {
  const inner = size - 2 * padding;
  return png(size, size, (x, y) => {
    const gx = Math.floor(((x - padding) / inner) * 16);
    const gy = Math.floor(((y - padding) / inner) * 16);
    const row = FLAKE[gy];
    return row !== undefined && gx >= 0 && gx < 16 && row[gx] === 'w' ? FG : BG;
  });
}

// 5×7 capitals for the TV banner's name.
const GLYPHS = {
  F: ['wwwww', 'w....', 'w....', 'wwww.', 'w....', 'w....', 'w....'],
  I: ['wwwww', '..w..', '..w..', '..w..', '..w..', '..w..', 'wwwww'],
  M: ['w...w', 'ww.ww', 'w.w.w', 'w.w.w', 'w...w', 'w...w', 'w...w'],
  B: ['wwww.', 'w...w', 'w...w', 'wwww.', 'w...w', 'w...w', 'wwww.'],
  U: ['w...w', 'w...w', 'w...w', 'w...w', 'w...w', 'w...w', '.www.'],
  L: ['w....', 'w....', 'w....', 'w....', 'w....', 'w....', 'wwwww'],
  V: ['w...w', 'w...w', 'w...w', 'w...w', '.w.w.', '.w.w.', '..w..'],
  E: ['wwwww', 'w....', 'w....', 'wwww.', 'w....', 'w....', 'wwwww'],
  T: ['wwwww', '..w..', '..w..', '..w..', '..w..', '..w..', '..w..'],
  R: ['wwww.', 'w...w', 'w...w', 'wwww.', 'w.w..', 'w..w.', 'w...w'],
};

/** The Android TV banner (320×180 at xhdpi): the flake on the left, the name beside it. */
function banner() {
  const W = 320;
  const H = 180;
  const flake = { x: 20, y: 42, k: 6 };
  const text = 'FIMBULVETR';
  const k = 3;
  const tx = flake.x + 16 * flake.k + 16;
  const ty = Math.floor((H - 7 * k) / 2);
  return png(W, H, (x, y) => {
    const fx = Math.floor((x - flake.x) / flake.k);
    const fy = Math.floor((y - flake.y) / flake.k);
    if (x >= flake.x && y >= flake.y && fx < 16 && fy < 16 && FLAKE[fy][fx] === 'w') return FG;
    const gx = Math.floor((x - tx) / k);
    const gy = Math.floor((y - ty) / k);
    if (x < tx || y < ty || gy >= 7) return BG;
    const glyph = GLYPHS[text[Math.floor(gx / 6)]];
    return glyph !== undefined && glyph[gy][gx % 6] === 'w' ? FG : BG;
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192, 16));
writeFileSync('public/icons/icon-512.png', icon(512, 40));
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 104));
writeFileSync('public/icons/apple-touch-icon.png', icon(180, 20));
const res = 'android/app/src/main/res';
mkdirSync(`${res}/mipmap-xhdpi`, { recursive: true });
mkdirSync(`${res}/drawable-xhdpi`, { recursive: true });
writeFileSync(`${res}/mipmap-xhdpi/ic_launcher.png`, icon(96, 8));
writeFileSync(`${res}/drawable-xhdpi/banner.png`, banner());
console.log('icons written to public/icons and android/app/src/main/res');

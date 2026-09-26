// Renders the app icons from a 16×16 snowflake grid into PNGs (node:zlib only; no image libraries).
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

function png(size, pixel) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const i = y * stride + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
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
  return png(size, (x, y) => {
    const gx = Math.floor(((x - padding) / inner) * 16);
    const gy = Math.floor(((y - padding) / inner) * 16);
    const row = FLAKE[gy];
    return row !== undefined && gx >= 0 && gx < 16 && row[gx] === 'w' ? FG : BG;
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192, 16));
writeFileSync('public/icons/icon-512.png', icon(512, 40));
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 104));
writeFileSync('public/icons/apple-touch-icon.png', icon(180, 20));
console.log('icons written to public/icons');

// Bakes the generated art for native shells (`pnpm port:art` → dist-port/art/): sprite pages and the tile
// page as PNGs plus frames.json. Generating the art takes about 7 s in a JIT-less JSContext, so the Apple
// TV app ships these files instead of drawing them at boot. The art is deterministic, so they always
// match what the web build draws.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { buildPortArt, PORT_TILE_CELL, PORT_TILE_COLS } from '@port/art';

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = (CRC[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** An RGBA PNG (colour type 6), one filter byte of 0 per row. */
function png(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * stride + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = 'dist-port/art';
mkdirSync(out, { recursive: true });
const art = buildPortArt();
art.pages.forEach((data, i) => {
  writeFileSync(`${out}/sprites_${String(i)}.png`, png(art.pageW, art.pageHeights[i] ?? 1, data));
});
writeFileSync(`${out}/tiles.png`, png(art.tiles.w, art.tiles.h, art.tiles.data));
writeFileSync(
  `${out}/frames.json`,
  JSON.stringify({
    pages: art.pages.length,
    tileCols: PORT_TILE_COLS,
    tileCell: PORT_TILE_CELL,
    tileCount: art.tileCount,
    frames: JSON.parse(art.frames) as unknown,
  }),
);
console.log(`art baked to ${out}: ${String(art.pages.length)} sprite pages, ${String(art.tileCount)} tiles`);

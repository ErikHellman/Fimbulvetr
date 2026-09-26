const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 32-bit FNV-1a over the UTF-16 code units of a string. */
export function fnv1a(text: string): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** Order-sensitive 32-bit hash of integers, each folded in as four bytes. */
export function hashInts(...values: readonly number[]): number {
  let h = FNV_OFFSET;
  for (const value of values) {
    const n = value | 0;
    for (let shift = 0; shift < 32; shift += 8) {
      h ^= (n >>> shift) & 0xff;
      h = Math.imul(h, FNV_PRIME);
    }
  }
  return h >>> 0;
}

/** Maps a 32-bit hash to [0, 1). */
export function unitFromHash(h: number): number {
  return (h >>> 0) / 4294967296;
}

export function hex8(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}

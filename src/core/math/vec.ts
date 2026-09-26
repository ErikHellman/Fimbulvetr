export interface Vec {
  x: number;
  y: number;
}

export const vec = (x: number, y: number): Vec => ({ x, y });
export const ZERO: Readonly<Vec> = Object.freeze({ x: 0, y: 0 });

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;

/** Math.sqrt is correctly rounded everywhere; Math.hypot is not, so it is not used in the core. */
export const length = (a: Vec): number => Math.sqrt(a.x * a.x + a.y * a.y);

/** Unit vector, or the zero vector for zero input. */
export function normalize(a: Vec): Vec {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
}

export const lerp = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

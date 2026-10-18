import { describe, expect, it } from 'vitest';
import { alphaAt } from '@art/raster';
import { buildSprites } from '@art/sprites';

const frame = (name: string) => {
  const f = buildSprites().find((s) => s.name === name);
  if (f === undefined) throw new Error(`no frame ${name}`);
  return f;
};

describe('light and shadow frames', () => {
  it('the light falls off smoothly from a solid core to nothing at the rim', () => {
    const { raster: r, ox, oy } = frame('fx_light_idle_s_0');
    expect(alphaAt(r, ox, oy)).toBe(255);
    let last = 255;
    for (let x = ox; x < r.w; x++) {
      const a = alphaAt(r, x, oy);
      expect(a).toBeLessThanOrEqual(last);
      expect(last - a).toBeLessThan(40);
      last = a;
    }
    expect(alphaAt(r, r.w - 1, oy)).toBe(0);
  });

  it('the contact shadow is a soft flat ellipse standing on its centre', () => {
    const { raster: r, ox, oy } = frame('fx_contact_idle_s_0');
    expect(r.w).toBeGreaterThan(r.h * 1.8);
    expect(ox).toBe(Math.floor(r.w / 2));
    expect(oy).toBe(Math.floor(r.h / 2));
    expect(alphaAt(r, ox, oy)).toBeGreaterThan(alphaAt(r, 1, oy));
    expect(alphaAt(r, ox, oy)).toBeLessThan(150);
    expect(alphaAt(r, 0, 0)).toBe(0);
  });
});

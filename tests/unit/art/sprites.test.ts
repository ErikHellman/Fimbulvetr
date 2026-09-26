import { describe, expect, it } from 'vitest';
import { frameName } from '@art/anims';
import { countOpaque, flipX, rastersEqual } from '@art/raster';
import { ANIMS, buildSprites } from '@art/sprites';

const frames = buildSprites();
const byName = new Map(frames.map((f) => [f.name, f]));

function frame(name: string): (typeof frames)[number] {
  const f = byName.get(name);
  if (f === undefined) throw new Error(`missing ${name}`);
  return f;
}

describe('sprites', () => {
  it('has unique frame names', () => {
    expect(byName.size).toBe(frames.length);
  });

  it('draws every frame the animation table refers to', () => {
    for (const [art, anims] of Object.entries(ANIMS)) {
      for (const [anim, def] of Object.entries(anims)) {
        for (const dir of def.dirs) {
          for (let i = 0; i < def.frames; i++) {
            const name = frameName(art, anim, dir, i);
            expect(byName.has(name), name).toBe(true);
          }
        }
      }
    }
  });

  it('draws something in every frame, with the feet inside it', () => {
    for (const f of frames) {
      expect(countOpaque(f.raster), f.name).toBeGreaterThan(20);
      expect(f.ox).toBeGreaterThanOrEqual(0);
      expect(f.ox).toBeLessThanOrEqual(f.raster.w);
      expect(f.oy).toBeGreaterThanOrEqual(0);
      expect(f.oy).toBeLessThanOrEqual(f.raster.h);
    }
  });

  it('bakes east-facing frames as mirrors of west-facing ones', () => {
    expect(rastersEqual(frame('hero_walk_e_2').raster, flipX(frame('hero_walk_w_2').raster))).toBe(true);
    expect(rastersEqual(frame('hero_attack1_e_1').raster, flipX(frame('hero_attack1_w_1').raster))).toBe(
      true,
    );
  });

  it('uses 48 px frames for sword poses', () => {
    expect(frame('hero_attack2_s_0').raster.w).toBe(48);
    expect(frame('hero_walk_s_0').raster.w).toBe(32);
  });

  it('is deterministic', () => {
    const again = new Map(buildSprites().map((f) => [f.name, f]));
    for (const name of ['hero_idle_s_0', 'hero_spin_s_3', 'prop_dummy_hurt_s_1']) {
      const other = again.get(name);
      expect(other && rastersEqual(frame(name).raster, other.raster)).toBe(true);
    }
  });

  it('includes the missing-art fallback', () => {
    expect(byName.has('missing')).toBe(true);
  });
});

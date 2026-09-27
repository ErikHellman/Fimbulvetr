import { describe, expect, it } from 'vitest';
import { frameName } from '@art/anims';
import { countOpaque, flipX, getPixel, hex, rastersEqual } from '@art/raster';
import { C } from '@art/palette';
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

  it('keeps drawn pixels clear of the frame edge so outlines are never clipped', () => {
    const inkColor = hex(C.ink);
    for (const f of frames) {
      const margin = f.name.startsWith('hero_')
        ? 2
        : f.name.startsWith('prop_dummy_') || f.name.startsWith('decor_') || f.name.startsWith('fx_fish_')
          ? 1
          : 0;
      if (margin === 0) continue; // skip missing frame
      const r = f.raster;
      for (let y = 0; y < r.h; y++) {
        for (let x = 0; x < r.w; x++) {
          const pixel = getPixel(r, x, y);
          // Check if pixel is opaque and not ink
          if (
            pixel[3] > 0 &&
            !(pixel[0] === inkColor[0] && pixel[1] === inkColor[1] && pixel[2] === inkColor[2])
          ) {
            // Non-ink opaque pixel found; verify margin
            expect(x, `${f.name}: non-ink pixel at x=${x} violates left margin`).toBeGreaterThanOrEqual(
              margin,
            );
            expect(x, `${f.name}: non-ink pixel at x=${x} violates right margin`).toBeLessThan(r.w - margin);
            expect(y, `${f.name}: non-ink pixel at y=${y} violates top margin`).toBeGreaterThanOrEqual(
              margin,
            );
            expect(y, `${f.name}: non-ink pixel at y=${y} violates bottom margin`).toBeLessThan(r.h - margin);
          }
        }
      }
    }
  });
});

describe('arm swing', () => {
  /** The RGBA values inside a window of a frame, for comparing regions between phases. */
  const region = (name: string, x0: number, x1: number, y0: number, y1: number): number[] => {
    const r = frame(name).raster;
    const out: number[] = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push(...getPixel(r, x, y));
    return out;
  };

  it('swings the hero arms on alternate walk phases when facing south', () => {
    expect(region('hero_walk_s_1', 8, 9, 12, 26)).not.toEqual(region('hero_walk_s_3', 8, 9, 12, 26));
    expect(region('hero_walk_s_0', 8, 9, 12, 26)).toEqual(region('hero_walk_s_2', 8, 9, 12, 26));
  });

  it('swings the near arm forward and back when facing west', () => {
    expect(region('hero_walk_w_1', 10, 18, 16, 23)).not.toEqual(region('hero_walk_w_3', 10, 18, 16, 23));
  });

  it('keeps carried arms still', () => {
    expect(region('hero_carrywalk_s_1', 8, 9, 2, 16)).toEqual(region('hero_carrywalk_s_3', 8, 9, 2, 16));
  });

  it('mirrors the swing to the east', () => {
    for (const i of [1, 3]) {
      expect(rastersEqual(frame(`hero_walk_e_${i}`).raster, flipX(frame(`hero_walk_w_${i}`).raster))).toBe(
        true,
      );
      expect(
        rastersEqual(frame(`npc_halvar_walk_e_${i}`).raster, flipX(frame(`npc_halvar_walk_w_${i}`).raster)),
      ).toBe(true);
    }
  });

  it('swings the villagers arms too', () => {
    expect(region('npc_halvar_walk_s_1', 8, 9, 12, 27)).not.toEqual(
      region('npc_halvar_walk_s_3', 8, 9, 12, 27),
    );
    expect(region('npc_halvar_walk_w_1', 10, 18, 16, 23)).not.toEqual(
      region('npc_halvar_walk_w_3', 10, 18, 16, 23),
    );
  });
});

describe('content art', () => {
  it('has animations for every NPC, prop, critter and pickup the content names', async () => {
    const { NPCS } = await import('@content/ids');
    const { PROP_DEFS } = await import('@content/props');
    const { CRITTER_DEFS } = await import('@content/critters');
    const arts = [
      ...NPCS.map((id) => `npc_${id}`),
      ...Object.values(PROP_DEFS).map((d) => d.art),
      ...Object.values(CRITTER_DEFS).map((d) => d.art),
      'pickup_heart_piece',
      'fx_shadow',
    ];
    for (const art of arts) expect(ANIMS[art], art).toBeDefined();
    for (const d of Object.values(PROP_DEFS)) expect(ANIMS[d.art]?.['idle'], d.art).toBeDefined();
  });

  it('has an idle animation for every decor art the terrain names', async () => {
    const { TERRAIN } = await import('@content/terrain');
    const arts = Object.values(TERRAIN).flatMap((d) => ('decor' in d ? [...d.decor.art] : []));
    expect(arts.length).toBeGreaterThan(0);
    for (const art of arts) {
      expect(ANIMS[art]?.['idle'], art).toMatchObject({ dirs: ['s'] });
      expect(byName.has(`${art}_idle_s_0`), art).toBe(true);
    }
  });

  it('draws trees, wells and furniture taller than a single tile', () => {
    expect(frame('decor_tree_idle_s_0').raster.h).toBeGreaterThanOrEqual(40);
    expect(frame('decor_pine_idle_s_0').raster.h).toBeGreaterThanOrEqual(40);
    expect(frame('decor_well_idle_s_0').raster.h).toBeGreaterThanOrEqual(40);
    expect(frame('decor_hearth_idle_s_0').raster.h).toBeGreaterThanOrEqual(32);
    expect(frame('decor_bed_idle_s_0').raster.h).toBeGreaterThanOrEqual(28);
    expect(frame('decor_trough_idle_s_0').raster.w).toBeGreaterThanOrEqual(46);
  });

  it('stands decor on its bottom centre', () => {
    for (const f of frames) {
      if (!f.name.startsWith('decor_')) continue;
      expect(f.ox, f.name).toBe(Math.floor(f.raster.w / 2));
      expect(f.oy, f.name).toBe(f.raster.h - 1);
    }
  });

  it('moves the water and the fire in animated decor', () => {
    for (const art of ['decor_well', 'decor_trough', 'decor_hearth']) {
      expect(ANIMS[art]?.['idle']?.frames, art).toBe(4);
      for (let a = 0; a < 4; a++)
        for (let b = a + 1; b < 4; b++)
          expect(
            rastersEqual(frame(`${art}_idle_s_${a}`).raster, frame(`${art}_idle_s_${b}`).raster),
            `${art} ${a} vs ${b}`,
          ).toBe(false);
    }
  });

  it('has a one-shot fish jump and centred smoke puffs', () => {
    expect(ANIMS['fx_fish']?.['idle']).toMatchObject({ frames: 8, loop: false, dirs: ['s'] });
    expect(ANIMS['fx_smoke']?.['idle']).toMatchObject({ frames: 3, dirs: ['s'] });
    for (let i = 0; i < 3; i++) {
      const f = frame(`fx_smoke_idle_s_${i}`);
      expect(f.raster.w).toBe(f.raster.h);
      expect(f.ox).toBe(Math.floor(f.raster.w / 2));
      expect(f.oy).toBe(Math.floor(f.raster.h / 2));
    }
    const sizes = [0, 1, 2].map((i) => frame(`fx_smoke_idle_s_${i}`).raster.w);
    expect(sizes[0]).toBeLessThan(sizes[1] ?? 0);
    expect(sizes[1]).toBeLessThan(sizes[2] ?? 0);
  });

  it('gives the hero every carry animation', () => {
    for (const anim of ['lift', 'carry', 'carrywalk', 'throw'])
      expect(ANIMS['hero']?.[anim], anim).toBeDefined();
  });
});

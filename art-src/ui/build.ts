import { outline } from '@art/outline';
import { C } from '@art/palette';
import { blit, createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import { fade, shadowed } from '../dungeon/fx';
import { flipY, grid, mirror, rot90, type DrawnFrame } from '../lib/sprite';
import { FX, HUD, ICONS } from './grids';
import { UI_PAL } from './palette';

const INK = hex(C.ink);

const key = (table: Record<string, string>, k: string): string => {
  const text = table[k];
  if (text === undefined) throw new Error(`no grid ${k}`);
  return text;
};

const at = (name: string, raster: Raster, ox: number, oy: number): DrawnFrame => ({
  name,
  raster,
  pivot: { x: ox / raster.w, y: oy / raster.h },
});

/**
 * A grid with a 1 px margin, inked: how the placeholder icons are framed too. The UI centres its icons
 * (an image's default origin), so the pivot is the centre; the hearts and coin set their own origin.
 */
function framed(name: string, text: string): DrawnFrame {
  const g = grid(UI_PAL, text);
  const r = createRaster(g.w + 2, g.h + 2);
  blit(r, g, 1, 1);
  return { name, raster: outline(r, INK, 1), pivot: { x: 0.5, y: 0.5 } };
}

/** Every pixel's alpha scaled by `k` (0–1): a fading puff or flash. */
function dimmed(src: Raster, k: number): Raster {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const p = getPixel(src, x, y);
      if (p[3] > 0) setPixel(src, x, y, [p[0], p[1], p[2], Math.round(p[3] * k)]);
    }
  return src;
}

const rotCcw = (r: Raster): Raster => rot90(rot90(rot90(r)));
const fx = (k: string): Raster => grid(UI_PAL, key(FX, k));

/**
 * The item, gear, ring and galdr icons, the HUD hearts and coin, and the shaped effects: projectiles,
 * the fish and the float, flashes, puffs and sparks, all under their placeholder names and origins.
 * Alpha-only particles (light, contact and ground shadows, rain, drops, snow, leaves) stay generated.
 */
export function uiFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  for (const k of Object.keys(ICONS)) out.push(framed(`${k}_idle_s_0`, key(ICONS, k)));
  for (let q = 0; q <= 4; q++) out.push(framed(`ui_heart_idle_s_${q}`, key(HUD, `heart${q}`)));
  out.push(framed('ui_silver_idle_s_0', key(HUD, 'silver')));

  // Projectiles: the east frame is drawn; west mirrors it, north turns it a quarter anticlockwise.
  const turned = (
    art: string,
    anim: string,
    e: Raster,
    ox: number,
    oy: number,
    nx: number,
    ny: number,
  ): void => {
    const n = rotCcw(e);
    out.push(at(`fx_${art}_${anim}_e_0`, e, ox, oy));
    out.push(at(`fx_${art}_${anim}_w_0`, mirror(e), ox, oy));
    out.push(at(`fx_${art}_${anim}_n_0`, n, nx, ny));
    out.push(at(`fx_${art}_${anim}_s_0`, flipY(n), nx, ny));
  };
  turned('arrow', 'fly', fx('arrow'), 8, 3, 3, 8);
  const hook = fx('grapple');
  out.push(at('fx_grapple_fly_e_0', hook, 7, 7));
  out.push(at('fx_grapple_fly_s_0', rot90(hook), 7, 7));
  out.push(at('fx_grapple_fly_w_0', mirror(hook), 7, 7));
  out.push(at('fx_grapple_fly_n_0', rotCcw(hook), 7, 7));
  out.push(at('fx_chain_idle_s_0', fx('chain'), 3, 3));
  for (let i = 0; i < 4; i++) out.push(at(`fx_axe_fly_s_${i}`, fx(`axe${i}`), 9, 9));
  let boomerang = fx('boomerang');
  for (let i = 0; i < 4; i++) {
    out.push(at(`fx_boomerang_spin_s_${i}`, boomerang, 7, 10));
    boomerang = rot90(boomerang);
  }
  for (let i = 0; i < 2; i++) {
    out.push(at(`fx_spit_fly_s_${i}`, shadowed(fx(`spit${i}`)), 5, 10));
    out.push(at(`fx_bolt_fly_s_${i}`, fade(fade(fx(`bolt${i}`), C.ice, 110), C.iceLight, 230), 6, 10));
    const beam = fx(`bragd${i}`);
    const beamUp = rotCcw(beam);
    out.push(at(`fx_bragd_fly_e_${i}`, beam, 10, 5));
    out.push(at(`fx_bragd_fly_w_${i}`, mirror(beam), 10, 5));
    out.push(at(`fx_bragd_fly_n_${i}`, beamUp, 5, 10));
    out.push(at(`fx_bragd_fly_s_${i}`, flipY(beamUp), 5, 10));
    const gust = fade(fade(fade(fx(`vindr${i}`), '#dfe6ec', 200), '#ffffff', 200), C.iceLight, 120);
    const gustUp = rotCcw(gust);
    out.push(at(`fx_vindr_blow_e_${i}`, gust, 11, 10));
    out.push(at(`fx_vindr_blow_w_${i}`, mirror(gust), 11, 10));
    out.push(at(`fx_vindr_blow_n_${i}`, gustUp, 7, 14));
    out.push(at(`fx_vindr_blow_s_${i}`, flipY(gustUp), 7, 14));
  }
  for (let i = 0; i < 3; i++) {
    out.push(at(`fx_eldr_fly_s_${i}`, fx(`eldr${i}`), 7, 12));
    out.push(at(`fx_is_fly_s_${i}`, fx(`is${i}`), 7, 12));
    out.push(at(`fx_hit_idle_s_${i}`, dimmed(fx(`hit${i}`), [1, 0.9, 0.67][i] ?? 1), 8, 8));
    out.push(at(`fx_dust_idle_s_${i}`, dimmed(fx(`dust${i}`), [0.78, 0.55, 0.31][i] ?? 1), 10, 8));
    out.push(at(`fx_splash_idle_s_${i}`, dimmed(fx(`splash${i}`), [0.82, 0.59, 0.31][i] ?? 1), 4, 4));
    const puff = fade(fade(fx(`smoke${i}`), C.rock, 170), C.rockLight, 190);
    out.push(at(`fx_smoke_idle_s_${i}`, fade(puff, C.rockShade, 170), 3 + i, 3 + i));
  }
  for (let i = 0; i < 6; i++)
    out.push(
      at(
        `fx_blast_idle_s_${i}`,
        i < 3 ? fx(`blast${i}`) : dimmed(fx(`blast${i}`), [0.86, 0.63, 0.4][i - 3] ?? 1),
        24,
        30,
      ),
    );
  for (let i = 0; i < 4; i++) out.push(at(`fx_spark_idle_s_${i}`, fx(`spark${i}`), 8, 8));
  for (let f = 0; f < 8; f++) out.push(at(`fx_fish_idle_s_${f}`, fx(`fish${f}`), 12, 16));
  out.push(at('fx_float_idle_s_0', fx('float0'), 4, 8));
  out.push(at('fx_float_idle_s_1', fx('float1'), 4, 8));
  out.push(at('fx_float_nibble_s_0', fx('float2'), 4, 8));
  out.push(at('fx_float_nibble_s_1', fx('float0'), 4, 8));
  out.push(at('fx_float_bite_s_0', fx('float4'), 4, 8));
  out.push(at('fx_ghost_idle_s_0', dimmed(fx('ghost'), 0.8), 0, 0));
  return out;
}

import type { Raster } from '@art/raster';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { fade, inked, shadowed } from '../dungeon/fx';
import { CRITTERS, FIXTURES, PICKUPS, PROPS } from './grids';
import { FIX_PAL } from './palette';

const key = (table: Record<string, string>, k: string): string => {
  const text = table[k];
  if (text === undefined) throw new Error(`no grid ${k}`);
  return text;
};

/** A drawn frame standing on (ox, oy); inked unless `plain`, with its `S` shadow translucent. */
function at(name: string, raster: Raster, ox: number, oy: number): DrawnFrame {
  return { name, raster, pivot: { x: ox / raster.w, y: oy / raster.h } };
}
const fx = (k: string): Raster => inked(grid(FIX_PAL, key(FIXTURES, k)));
const plain = (k: string): Raster => shadowed(grid(FIX_PAL, key(FIXTURES, k)));

/**
 * Room fixtures (gates, cracks, chests, switches, fires, rafts), the props Ask lifts and breaks, the farm's
 * sheep and ravens, and the pickups, all under their placeholder names and feet points.
 */
export function fixtureFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  // Fixtures: 18 px wide, feet 2 px above the bottom edge.
  const fix = (name: string, k: string, outlined = true): void => {
    const r = outlined ? fx(k) : plain(k);
    out.push(at(name, r, Math.floor(r.w / 2), r.h - 3));
  };
  for (let i = 0; i < 4; i++) {
    fix(`fix_fire_burn_s_${i}`, `fire_burn${i}`);
    fix(`fix_fire_closed_s_${i}`, `fire_burn${i}`);
    fix(`fix_brazier_burn_s_${i}`, `brazier_burn${i}`);
  }
  fix('fix_fire_out_s_0', 'fire_out');
  fix('fix_fire_open_s_0', 'fire_out');
  fix('fix_brazier_out_s_0', 'brazier_out');
  const pairs: readonly (readonly [string, string, string])[] = [
    ['palisade', 'closed', 'open'],
    ['bridge', 'down', 'up'],
    ['logs', 'closed', 'open'],
    ['chest', 'closed', 'open'],
    ['lock', 'closed', 'open'],
    ['biglock', 'closed', 'open'],
    ['shutter', 'closed', 'open'],
    ['switch', 'off', 'on'],
    ['bars', 'closed', 'open'],
    ['slab', 'closed', 'open'],
    ['seal', 'dark', 'lit'],
    ['rime', 'closed', 'open'],
    ['warp', 'dormant', 'awake'],
    ['crack_floor', 'closed', 'open'],
    ['crack_rock', 'closed', 'open'],
    ['crack_stake', 'closed', 'open'],
    ['prism', 'slash', 'back'],
    ['crystal', 'lit', 'dark'],
    ['window', 'on', 'off'],
    ['eye', 'on', 'off'],
    ['wheel', 'on', 'off'],
  ];
  for (const [art, a, b] of pairs) {
    fix(`fix_${art}_${a}_s_0`, `${art}_${a}`);
    fix(`fix_${art}_${b}_s_0`, `${art}_${b}`);
  }
  fix('fix_crack_wall_closed_s_0', 'crack_wall_closed', false);
  fix('fix_crack_wall_open_s_0', 'crack_wall_open', false);
  fix('fix_post_idle_s_0', 'post');
  fix('fix_fan_off_s_0', 'fan_off');
  fix('fix_fan_on_s_0', 'fan_on0');
  fix('fix_fan_on_s_1', 'fan_on1');
  fix('fix_raft_idle_s_0', 'raft', false);
  fix('fix_sailraft_idle_s_0', 'sailraft0', false);
  fix('fix_sailraft_idle_s_1', 'sailraft1', false);
  // The web hangs down to its bottom row; the one-tile scenery and the ripples sit at (8, 14).
  out.push(at('fix_web_closed_s_0', plain('web_closed'), 9, 31));
  out.push(at('fix_web_open_s_0', plain('web_open'), 9, 31));
  for (const art of ['rubble', 'boards', 'hurdle', 'hive', 'skiff'] as const)
    out.push(at(`fix_${art}_idle_s_0`, fx(art), 8, 14));
  out.push(at('fix_scorch_idle_s_0', plain('scorch'), 8, 14));
  for (const anim of ['closed', 'idle'] as const)
    for (let i = 0; i < 2; i++) out.push(at(`fix_ripple_${anim}_s_${i}`, plain(`ripple_closed${i}`), 8, 14));
  out.push(at('fix_ripple_open_s_0', plain('ripple_open'), 8, 14));
  // Props stand on their bottom row.
  const prop = (name: string, k: string): void => {
    const r = inked(grid(FIX_PAL, key(PROPS, k)));
    out.push(at(name, r, Math.floor(r.w / 2), r.h - 1));
  };
  for (const k of [
    'pot',
    'bomb_pot',
    'arrow_pot',
    'stone',
    'rock',
    'pail',
    'crate',
    'axe',
    'log_small',
    'log_big',
    'grave_gold',
    'bramble',
    'root_block',
    'vines',
    'dummy',
  ] as const)
    prop(`prop_${k}_idle_s_0`, k);
  prop('prop_bomb_idle_s_0', 'bomb_idle');
  for (let i = 0; i < 2; i++) {
    prop(`prop_bomb_fuse_s_${i}`, `bomb_fuse${i}`);
    prop(`prop_bomb_blink_s_${i}`, `bomb_blink${i}`);
    prop(`prop_dummy_hurt_s_${i}`, `dummy_hurt${i}`);
    const ember = fade(fade(grid(FIX_PAL, key(PROPS, `wisp_ember${i}`)), '#7ab05a', 110), '#d8b85a', 210);
    out.push(at(`prop_wisp_ember_idle_s_${i}`, ember, 6, 15));
  }
  // Critters: the raven faces west, the sheep has three sides; east mirrors west.
  const critter = (name: string, k: string, ox: number, oy: number, mirrored: boolean): void => {
    const r = inked(grid(FIX_PAL, key(CRITTERS, k)));
    out.push(at(name, r, ox, oy));
    if (mirrored) out.push(at(name.replace(/_w_(\d+)$/, '_e_$1'), mirror(r), ox, oy));
  };
  const bird = (anim: string, i: number, k: string): void => {
    critter(`critter_raven_${anim}_w_${i}`, `raven_${k}`, 10, 15, true);
  };
  bird('idle', 0, 'stand');
  bird('peck', 0, 'stand');
  bird('peck', 1, 'peck');
  bird('hop', 0, 'up');
  bird('hop', 1, 'stand');
  bird('fly', 0, 'up');
  bird('fly', 1, 'down');
  for (const side of ['s', 'n', 'w'] as const) {
    const w = side === 'w' ? 26 : 22;
    for (let i = 0; i < 2; i++)
      critter(`critter_sheep_walk_${side}_${i}`, `sheep_${side}${i}`, w / 2, 19, side === 'w');
    critter(`critter_sheep_idle_${side}_0`, `sheep_${side}0`, w / 2, 19, side === 'w');
  }
  // Pickups stand on their bottom row; the heart container on the row above it.
  const pickup = (name: string, k: string, oy?: number): void => {
    const r = inked(grid(FIX_PAL, key(PICKUPS, k)));
    out.push(at(name, r, Math.floor(r.w / 2), oy ?? r.h - 1));
  };
  for (let i = 0; i < 2; i++) {
    pickup(`pickup_arrows_idle_s_${i}`, `arrows${i}`);
    pickup(`pickup_bombs_idle_s_${i}`, `bombs${i}`);
    pickup(`pickup_heart_container_idle_s_${i}`, `heart_container${i}`, 16);
    pickup(`pickup_heart_piece_idle_s_${i}`, `heart_piece${i}`);
    pickup(`pickup_seidr_idle_s_${i}`, `seidr${i}`);
    pickup(`pickup_silver_idle_s_${i}`, `silver${i}`);
  }
  pickup('pickup_heart_idle_s_0', 'heart');
  pickup('pickup_herb_fen_moss_idle_s_0', 'herb_fen_moss');
  return out;
}

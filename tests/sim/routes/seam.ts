import type { DungeonId } from '@content/ids';
import type { FlagId } from '@content/flags';
import { setMinute, setPolicy, setSeason } from '@core/clock/clock';
import type { DevPreset } from '@core/dev/query';
import { dungeonOf } from '@core/state/dungeons';
import type { FlagValue } from '@core/state/flags';
import type { DungeonState, GameState } from '@core/state/gameState';
import { tileFeet } from '@core/world/screen';

/**
 * Joins two milestone routes: the state one route ended in, carried on to where the next route's preset
 * starts. Ask walks there, rests (full health and seiðr) and waits for the preset's time and season.
 * Whatever the preset holds that the routes never earned is granted, and named in `gaps`, so the full
 * route shows exactly which stretches of the game it does not play.
 */
export function seam(from: GameState, p: DevPreset): { state: GameState; gaps: string[] } {
  const s = structuredClone(from);
  const gaps: string[] = [];
  for (const [id, v] of Object.entries(p.flags ?? {}) as [FlagId, FlagValue][]) {
    const have = s.flags[id];
    const short = typeof v === 'number' ? typeof have !== 'number' || have < v : v && have !== true;
    if (!short) continue;
    gaps.push(`flag ${id}`);
    s.flags[id] = v;
  }
  for (const [id, n] of Object.entries(p.items ?? {}) as [keyof typeof s.inv.items, number][]) {
    if ((s.inv.items[id] ?? 0) >= n) continue;
    gaps.push(`item ${id}`);
    s.inv.items = { ...s.inv.items, [id]: n };
  }
  for (const g of p.galdr ?? []) {
    if (s.inv.galdr.includes(g)) continue;
    gaps.push(`galdr ${g}`);
    s.inv.galdr = [...s.inv.galdr, g];
  }
  if (p.weapon !== s.inv.weapon) {
    gaps.push(`weapon ${p.weapon}`);
    s.inv.weapon = p.weapon;
  }
  if (p.shield && !s.inv.shield) {
    gaps.push('shield');
    s.inv.shield = true;
  }
  if (p.armor !== undefined && p.armor !== s.inv.armor) {
    gaps.push(`armor ${p.armor}`);
    s.inv.armor = p.armor;
  }
  if (p.maxHp !== undefined && p.maxHp > s.hero.maxHp) {
    gaps.push(`maxHp ${String(p.maxHp)}`);
    s.hero.maxHp = p.maxHp;
  }
  if (p.maxSeidr !== undefined && p.maxSeidr > s.hero.maxSeidr) {
    gaps.push(`maxSeidr ${String(p.maxSeidr)}`);
    s.hero.maxSeidr = p.maxSeidr;
  }
  for (const id of p.pieces ?? []) {
    if (s.world.pieces.includes(id)) continue;
    gaps.push(`piece ${id}`);
    s.world.pieces.push(id);
  }
  for (const id of p.opened ?? []) {
    if (s.world.opened.includes(id)) continue;
    gaps.push(`opened ${id}`);
    s.world.opened.push(id);
  }
  for (const r of p.warps ?? []) {
    if (s.world.warps.includes(r)) continue;
    gaps.push(`warp ${r}`);
    s.world.warps.push(r);
  }
  for (const [id, n] of Object.entries(p.vars ?? {})) {
    if (s.world.vars[id] === n) continue;
    gaps.push(`var ${id}`);
    s.world.vars[id] = n;
  }
  for (const [id, d] of Object.entries(p.dungeons ?? {}) as [DungeonId, Partial<DungeonState>][]) {
    const have = dungeonOf(s, id);
    for (const [k, v] of Object.entries(d) as [keyof DungeonState, unknown][]) {
      if (JSON.stringify(have[k]) === JSON.stringify(v)) continue;
      gaps.push(`dungeon ${id}.${k}`);
      Object.assign(have, { [k]: v });
    }
  }
  if (p.silver !== undefined && p.silver > s.hero.silver) {
    gaps.push('silver');
    s.hero.silver = p.silver;
  }
  // Ask walks on to the next start, rests and waits for its hour and season.
  const at = tileFeet({ x: p.tile[0], y: p.tile[1] });
  s.hero.screen = p.screen;
  s.hero.x = at.x;
  s.hero.y = at.y;
  if (p.facing !== undefined) s.hero.facing = p.facing;
  if (p.slots !== undefined) s.inv.slots = [p.slots[0], p.slots[1]];
  if (p.minute !== undefined) setMinute(s.clock, p.minute);
  if (p.season !== undefined) setSeason(s.clock, p.season);
  if (p.policy !== undefined) setPolicy(s.clock, p.policy);
  s.hero.hp = s.hero.maxHp;
  s.hero.seidr = s.hero.maxSeidr;
  return { state: s, gaps };
}

import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { TILE } from '@core/world/dims';
import { Harness, frameOf } from './harness';
import { buyInShop, crossTo, face, finishStory, interactNorth, talkTo, walkTo } from './walk';

/**
 * Herds every sheep into the pen the way a player does: circle round outside the sheep's flight distance to
 * a point behind it (on the far side from where it should go), then walk it toward the gate, and through.
 */
function herd(h: Harness): void {
  type V = { x: number; y: number };
  const unit = (v: V): V => {
    const l = Math.sqrt(v.x * v.x + v.y * v.y);
    return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
  };
  const hold = (d: V): ('left' | 'right' | 'up' | 'down')[] => {
    const keys: ('left' | 'right' | 'up' | 'down')[] = [];
    if (d.x < -0.38) keys.push('left');
    if (d.x > 0.38) keys.push('right');
    if (d.y < -0.38) keys.push('up');
    if (d.y > 0.38) keys.push('down');
    return keys;
  };
  const gate = { x: 15 * TILE, y: 11 * TILE };
  const inside = { x: 6 * TILE, y: 11 * TILE };
  for (let tick = 0; tick < 60000 && h.sim.state.flags.q_sheep_d1 !== true; tick++) {
    const hero = h.sim.hero.pos;
    const sheep = h.sim.actors
      .filter((a) => a.kind === 'critter' && (a.mem['penned'] ?? 0) === 0)
      .sort((a, b) => a.pos.x - b.pos.x)[0];
    if (sheep === undefined) break;
    const s = sheep.pos;
    const goal = s.x > gate.x + 8 || Math.abs(s.y - gate.y) > 40 ? gate : inside;
    const dir = unit({ x: goal.x - s.x, y: goal.y - s.y });
    const rel = { x: hero.x - s.x, y: hero.y - s.y };
    const along = rel.x * dir.x + rel.y * dir.y;
    const across = rel.x * -dir.y + rel.y * dir.x;
    let move: V;
    if (along < -10 && Math.abs(across) < 12) {
      move = dir;
    } else {
      const staging = { x: s.x - dir.x * 48, y: s.y - dir.y * 48 };
      const toStaging = { x: staging.x - hero.x, y: staging.y - hero.y };
      const dist = Math.sqrt(rel.x * rel.x + rel.y * rel.y);
      if (dist < 46 && along > -30) {
        // Too close and not behind: step away sideways before circling round.
        const side = across >= 0 ? 1 : -1;
        move = unit({ x: -dir.y * side + rel.x / dist, y: dir.x * side + rel.y / dist });
      } else move = unit(toStaging);
      if (Math.abs(toStaging.x) < 3 && Math.abs(toStaging.y) < 3) move = dir;
    }
    h.step(frameOf(hold(move)));
  }
  expect(h.sim.state.flags.q_sheep_d1).toBe(true);
}

/** Lifts the prop north of (tx, ty+1) and carries it. */
function lift(h: Harness, tx: number, ty: number): void {
  interactNorth(h, tx, ty);
  h.idle(16);
  expect(h.sim.hero.fsm.s).toBe('carry');
}

/** Scares off every raven on the field with the stones and pots along the path. */
function scareRavens(h: Harness): void {
  for (let round = 0; round < 12 && Number(h.sim.state.flags.q_ravens ?? 0) < 5; round++) {
    const raven = h.sim.actors.find((a) => a.kind === 'critter' && a.def === 'raven' && a.fsm.s !== 'fly');
    const rock = h.sim.actors.find((a) => a.kind === 'prop' && (a.mem['carried'] ?? 0) === 0);
    if (raven === undefined || rock === undefined) {
      // Out of stones or birds on screen: step out and back in to reset the field.
      walkTo(h, 19, 1);
      crossTo(h, 'n', 'ask_farmyard');
      walkTo(h, 19, 20);
      crossTo(h, 's', 'ask_field');
      continue;
    }
    lift(h, Math.floor(rock.pos.x / TILE), Math.floor((rock.pos.y - 1) / TILE));
    const rx = Math.floor(raven.pos.x / TILE);
    const ry = Math.floor((raven.pos.y - 1) / TILE);
    walkTo(h, rx, Math.min(19, ry + 3));
    face(h, 'n');
    h.step({ ...frameOf(['up']), pressed: 1 << 10 }).idle(80);
  }
  expect(h.sim.state.flags.q_ravens).toBeGreaterThanOrEqual(5);
}

/** Splits every log by the chopping block: small ones with a swing, big ones with a spin. */
function splitLogs(h: Harness): void {
  for (let i = 0; i < 12 && Number(h.sim.state.flags.q_logs ?? 0) < 5; i++) {
    const log = h.sim.actors.find((a) => a.kind === 'prop' && a.def.startsWith('log_'));
    if (log === undefined) break;
    const lx = Math.floor(log.pos.x / TILE);
    const ly = Math.floor((log.pos.y - 1) / TILE);
    walkTo(h, lx, ly + 1);
    face(h, 'n');
    if (log.def === 'log_big') h.hold(['sword'], 70).idle(30);
    else h.press(['sword']).idle(20);
  }
  expect(h.sim.state.flags.q_logs).toBeGreaterThanOrEqual(5);
}

/** Evening: into the longhouse (Embla's scene plays on entry), then to bed. */
function eveningAndSleep(h: Harness): void {
  walkTo(h, 9, 8);
  crossTo(h, 'n', 'ask_int_longhouse');
  h.until((s) => s.mode === 'story', 60);
  finishStory(h);
  interactNorth(h, 10, 7);
  finishStory(h);
}

function playPrologue(seed: number): Harness {
  const h = new Harness({ start: NEW_GAME, seed });
  expect(h.sim.screen.id).toBe('ask_int_longhouse');

  // Day 1.
  walkTo(h, 19, 19);
  crossTo(h, 's', 'ask_farmyard');
  talkTo(h, 'halvar');
  expect(h.sim.state.flags.st_intro_seen).toBe(true);
  lift(h, 26, 9);
  walkTo(h, 24, 14);
  face(h, 'n');
  h.step(frameOf([], ['interact'])).idle(20);
  expect(h.sim.state.flags.q_water_d1).toBe(true);
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'ask_pasture');
  herd(h);
  walkTo(h, 38, 10);
  crossTo(h, 'e', 'ask_farmyard');
  talkTo(h, 'halvar');
  expect(h.sim.state.flags.q_paid_d1).toBe(true);
  eveningAndSleep(h);
  expect(h.sim.state.flags.st_farm_day).toBe(2);

  // Day 2.
  walkTo(h, 19, 19);
  crossTo(h, 's', 'ask_farmyard');
  splitLogs(h);
  talkTo(h, 'halvar');
  expect(h.sim.state.flags.q_paid_d2).toBe(true);
  eveningAndSleep(h);
  expect(h.sim.state.flags.st_farm_day).toBe(3);

  // Day 3: the ravens, then a lantern from Sigrún.
  walkTo(h, 19, 19);
  crossTo(h, 's', 'ask_farmyard');
  walkTo(h, 19, 20);
  crossTo(h, 's', 'ask_field');
  scareRavens(h);
  walkTo(h, 19, 1);
  crossTo(h, 'n', 'ask_farmyard');
  talkTo(h, 'halvar');
  expect(h.sim.state.flags.q_paid_d3).toBe(true);
  walkTo(h, 38, 10);
  crossTo(h, 'e', 'ask_village');
  walkTo(h, 8, 6);
  crossTo(h, 'n', 'ask_int_trader');
  interactNorth(h, 19, 11);
  buyInShop(h, 0);
  expect(h.sim.state.inv.items.lantern).toBe(1);
  walkTo(h, 19, 17);
  crossTo(h, 's', 'ask_village');
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'ask_farmyard');
  eveningAndSleep(h);
  return h;
}

describe('M1a route', () => {
  it('plays the prologue from New Game to the raid with real inputs', () => {
    const h = playPrologue(7);
    expect(h.sim.state.flags.st_raid_begun).toBe(true);
    expect(h.sim.state.clock.season).toBe('autumn');
    expect(h.sim.state.inv.weapon).toBe('pitchfork');
    expect(h.sim.screen.id).toBe('ask_int_longhouse');
    expect(h.sim.enemies.map((e) => e.def)).toEqual(['draugr']);
    expect(h.sim.state.hero.silver).toBe(5);
    expect(h.sim.state.inv.slots).toContain('lantern');
  }, 60_000);

  it('replays identically', () => {
    expect(playPrologue(11).sim.hash()).toBe(playPrologue(11).sim.hash());
  }, 120_000);
});

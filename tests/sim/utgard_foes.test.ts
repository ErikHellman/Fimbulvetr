import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { JOTUNVORDR } from '@core/actors/enemies/jotunvordr';
import { KOLBEINN } from '@core/actors/enemies/kolbeinn';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

function hall(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '▣'.repeat(40) : '▣' + '□'.repeat(38) + '▣',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function foe(h: Harness, id: string): Entity {
  const e = h.sim.enemies.find((a) => a.def === id);
  if (e === undefined) throw new Error(`no ${id}`);
  return e;
}

describe('Jötunvörðr, the warden of the master key', () => {
  function vault(): { h: Harness; j: Entity } {
    const h = new Harness({
      db: hall([{ k: 'enemy', id: 'jotunvordr', at: { x: 20, y: 5 } }]),
      tile: [20, 9],
    });
    h.sim.god = true;
    h.sim.hero.facing = 'n';
    h.idle(2);
    return { h, j: foe(h, 'jotunvordr') };
  }

  it('raises a knee (the tell) and stomps a ring around him when Ask comes close', () => {
    const { h, j } = vault();
    h.until(() => j.fsm.s === 'raise', 600);
    h.until(() => j.fsm.s === 'stomp', JOTUNVORDR.raiseTicks + 2);
    expect(j.fsm.s).toBe('stomp');
  });

  it('turns every blow while frozen; Eldr thaws him open to the sword, and he freezes again', () => {
    const { h, j } = vault();
    const hp = j.hp;
    h.sim.hero.pos = { x: j.pos.x, y: j.pos.y + 20 };
    h.press(['sword']).idle(20);
    expect(j.hp).toBe(hp);
    h.sim.state.inv.galdr = ['eldr'];
    h.sim.state.hero.seidr = 10;
    h.sim.hero.pos = { x: j.pos.x, y: j.pos.y + 60 };
    h.sim.hero.facing = 'n';
    h.press(['galdr']).idle(40);
    expect(j.fsm.s).toBe('thawed');
    const thawed = j.hp;
    h.sim.hero.pos = { x: j.pos.x, y: j.pos.y + 20 };
    h.sim.hero.facing = 'n';
    h.press(['sword']).idle(20);
    expect(j.hp).toBeLessThan(thawed);
    h.idle(JOTUNVORDR.thawTicks);
    expect(j.fsm.s).not.toBe('thawed');
    expect(j.mem['cracked'] ?? 0).toBe(0);
  });
});

describe('Kolbeinn in his hall', () => {
  function duel(god = true): { h: Harness; k: Entity } {
    const h = new Harness({
      db: hall([{ k: 'enemy', id: 'kolbeinn_boss', at: { x: 20, y: 5 } }]),
      tile: [20, 8],
      facing: 'n',
    });
    // God mode turns every blow before the shield sees it, so the parry is tried mortal.
    h.sim.god = god;
    h.sim.state.inv.shield = true;
    h.sim.state.flags.t_parry = true;
    h.idle(2);
    return { h, k: foe(h, 'kolbeinn_boss') };
  }

  it('turns the sword from the front while he stalks', () => {
    const { h, k } = duel();
    h.until(() => k.fsm.s === 'stalk', 200);
    const hp = k.hp;
    h.sim.hero.pos = { x: k.pos.x, y: k.pos.y + 18 };
    h.sim.hero.facing = 'n';
    h.press(['sword']).idle(14);
    expect(k.hp).toBe(hp);
  });

  it('draws his staff back (the tell), and a parry as it falls leaves him staggered and open', () => {
    const { h, k } = duel(false);
    h.until(() => k.fsm.s === 'draw' && k.fsm.t >= KOLBEINN.drawTicks - 4, 900);
    for (let i = 0; i < 12; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
    h.step(frameOf([], [], ['shield']));
    expect(k.mem['stun'] ?? 0).toBeGreaterThan(0);
    const hp = k.hp;
    h.sim.hero.facing = 'n';
    h.press(['sword']).idle(14);
    expect(k.hp).toBeLessThan(hp);
  });

  it('at half health casts rime bolts, and at a quarter calls two draugr, once', () => {
    const { h, k } = duel();
    k.hp = Math.floor(k.maxHp / 2);
    h.until(() => h.sim.actors.some((a) => a.kind === 'projectile' && a.def === 'bolt'), 1500);
    expect(h.sim.actors.some((a) => a.kind === 'projectile' && a.def === 'bolt')).toBe(true);
    k.hp = Math.floor(k.maxHp / 4);
    h.until(() => h.sim.enemies.filter((e) => e.def === 'draugr').length === 2, 1500);
    expect(h.sim.enemies.filter((e) => e.def === 'draugr')).toHaveLength(2);
    h.idle(900);
    expect(h.sim.enemies.filter((e) => e.def === 'draugr').length).toBeLessThanOrEqual(2);
  });
});

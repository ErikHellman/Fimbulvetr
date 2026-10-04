import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a with the dummy at (24,9), plus props around (12..16, 14). */
function propDb(extra: Thing[] = []): ContentDb {
  const things: Thing[] = [
    { k: 'enemy', id: 'dummy', at: { x: 24, y: 9 } },
    { k: 'prop', id: 'pot', at: { x: 12, y: 14 } },
    { k: 'prop', id: 'pail', at: { x: 16, y: 14 } },
    {
      k: 'drop',
      at: { x: 16, y: 17 },
      w: 2,
      h: 2,
      accepts: 'pail',
      do: [{ k: 'set', flag: 'q_water_d1', value: true }],
    },
    { k: 'prop', id: 'log_small', at: { x: 8, y: 14 }, onBreak: [{ k: 'add', flag: 'q_logs', n: 1 }] },
    { k: 'prop', id: 'log_big', at: { x: 5, y: 14 }, onBreak: [{ k: 'add', flag: 'q_logs', n: 2 }] },
    ...extra,
  ];
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

const props = (h: Harness, id: string) => h.sim.actors.filter((a) => a.kind === 'prop' && a.def === id);

describe('lifting', () => {
  it('raises a prop overhead, which then follows the hero', () => {
    const h = new Harness({ db: propDb(), tile: [12, 13], facing: 's' });
    h.press(['interact']);
    expect(h.sim.hero.fsm.s).toBe('lift');
    h.idle(20);
    expect(h.sim.hero.fsm.s).toBe('carry');
    h.hold(['left'], 20);
    const pot = props(h, 'pot')[0];
    expect(pot?.pos.x).toBeCloseTo(h.sim.hero.pos.x);
    expect(pot?.mem['z']).toBeGreaterThan(10);
  });

  it('disables the sword while carrying', () => {
    const h = new Harness({ db: propDb(), tile: [12, 13], facing: 's' });
    h.press(['interact']).idle(20).press(['sword']);
    expect(h.sim.hero.fsm.s).toBe('carry');
  });
});

describe('throwing', () => {
  it('flies in the facing direction and shatters a fragile prop', () => {
    const h = new Harness({ db: propDb(), tile: [12, 13], facing: 's' });
    h.press(['interact']).idle(20);
    h.step(h.frame(['right'])).step({ ...h.frame(['right']), pressed: 1 << 10 });
    expect(h.sim.hero.fsm.s).toBe('throw');
    h.idle(40);
    expect(props(h, 'pot')).toHaveLength(0);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_break' });
  });

  it('hits what it flies into', () => {
    const h = new Harness({
      db: propDb([{ k: 'prop', id: 'stone', at: { x: 19, y: 8 } }]),
      tile: [19, 9],
      facing: 'n',
    });
    h.press(['interact']).idle(20);
    h.step(h.frame(['right'])).step({ ...h.frame(['right']), pressed: 1 << 10 });
    h.idle(30);
    expect(h.count('hit')).toBe(1);
  });

  it('is lost when the hero is warped off the screen', () => {
    const h = new Harness({ db: propDb(), tile: [12, 13], facing: 's' });
    h.press(['interact']).idle(20);
    h.sim.command({ t: 'warp', screen: 'test_b', x: 100, y: 100 });
    h.idle(2);
    expect(h.sim.hero.fsm.s).toBe('move');
    expect(h.sim.hero.mem['carrying'] ?? 0).toBe(0);
  });
});

describe('setting down', () => {
  it('puts the pail in its drop zone, which uses it up', () => {
    const h = new Harness({ db: propDb(), tile: [16, 13], facing: 's' });
    h.press(['interact']).idle(20);
    h.hold(['down'], 30);
    h.press(['interact']);
    h.idle(15);
    expect(h.sim.state.flags.q_water_d1).toBe(true);
    expect(props(h, 'pail')).toHaveLength(0);
  });

  it('leaves the pail where it is set outside the zone', () => {
    const h = new Harness({ db: propDb(), tile: [16, 13], facing: 's' });
    h.press(['interact']).idle(20).press(['interact']).idle(15);
    expect(props(h, 'pail')).toHaveLength(1);
    expect(h.sim.state.flags.q_water_d1).toBeUndefined();
  });
});

describe('logs', () => {
  it('split: small ones with any swing, big ones only with the spin', () => {
    const h = new Harness({ db: propDb(), tile: [8, 13], facing: 's' });
    h.press(['sword']).idle(20);
    expect(props(h, 'log_small')).toHaveLength(0);
    expect(h.sim.state.flags.q_logs).toBe(1);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 5 * 16 + 8, y: 13 * 16 + 14 });
    h.idle(1);
    h.sim.hero.facing = 's';
    h.press(['sword']).idle(20);
    expect(props(h, 'log_big')).toHaveLength(1);
    h.hold(['sword'], 60).idle(30);
    expect(props(h, 'log_big')).toHaveLength(0);
    expect(h.sim.state.flags.q_logs).toBe(3);
  });
});

import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { actorCtx } from '@core/sim/systems/enemies';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { walkTo } from './walk';

/** test_a opened up, with a wall across column 20 except rows 9–12, where `things` sit. */
function arena(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const row = '#' + '.'.repeat(38) + '#';
    return y >= 9 && y <= 12 ? row : row.slice(0, 20) + '#' + row.slice(21);
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const GATE: Thing = {
  k: 'gate',
  at: { x: 20, y: 9 },
  w: 1,
  h: 4,
  art: 'palisade',
  closed: { k: 'not', c: { k: 'flag', id: 'st_raid_begun' } },
};

const fixtures = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'fixture');

describe('gates', () => {
  it('spawn one closed fixture per tile and block the way', () => {
    const h = new Harness({ db: arena([GATE]), tile: [17, 10], facing: 'e' });
    expect(fixtures(h)).toHaveLength(4);
    expect(fixtures(h).every((f) => f.anim === 'closed')).toBe(true);
    h.hold(['right'], 80);
    expect(h.sim.hero.pos.x).toBeLessThan(20 * 16);
    expect(() => walkTo(h, 24, 10, 600)).toThrow(/no path/);
  });

  it('open the same tick their flag flips, and the way is free', () => {
    const h = new Harness({ db: arena([GATE]), tile: [17, 10], facing: 'e' });
    h.sim.state.flags.st_raid_begun = true;
    h.idle(1);
    expect(fixtures(h).every((f) => f.anim === 'open')).toBe(true);
    walkTo(h, 24, 10, 600);
    expect(h.sim.hero.pos.x).toBeGreaterThan(23 * 16);
  });

  it('open during a cutscene too', () => {
    const h = new Harness({ db: arena([GATE]), tile: [17, 10] });
    h.sim.mode = 'story';
    h.sim.story = {
      queue: [{ k: 'wait', ticks: 30 }],
      cur: null,
      t: 0,
      dlg: null,
      fade: 0,
      talker: null,
      shop: null,
    };
    h.sim.state.flags.st_raid_begun = true;
    h.idle(1);
    expect(h.sim.mode).toBe('story');
    expect(fixtures(h).every((f) => f.anim === 'open')).toBe(true);
  });

  it('block enemies as walls', () => {
    const h = new Harness({ db: arena([GATE]), tile: [17, 10] });
    expect(actorCtx(h.sim).solidAt(20, 10)).toBe(true);
    h.sim.state.flags.st_raid_begun = true;
    h.idle(1);
    expect(actorCtx(h.sim).solidAt(20, 10)).toBe(false);
  });
});

describe('fire', () => {
  const FIRE: Thing = {
    k: 'fire',
    at: { x: 20, y: 9 },
    w: 1,
    h: 4,
    when: { k: 'flag', id: 'st_raid_begun' },
  };

  it('burns through a raised shield and knocks back, but is not solid', () => {
    const h = new Harness({ db: arena([FIRE]), tile: [18, 10], facing: 'e' });
    h.sim.state.flags.st_raid_begun = true;
    h.idle(1);
    expect(fixtures(h).every((f) => f.anim === 'burn')).toBe(true);
    const hp = h.sim.hero.hp;
    h.hold(['shield', 'right'], 60);
    expect(h.sim.hero.hp).toBe(hp - 2);
    expect(h.sim.hero.pos.x).toBeLessThan(20 * 16);
    expect(h.sim.screen.collision.flags[10 * 40 + 20]).toBe(0);
  });

  it('is harmless once out', () => {
    const h = new Harness({ db: arena([FIRE]), tile: [18, 10], facing: 'e' });
    const hp = h.sim.hero.hp;
    h.hold(['right'], 60);
    expect(fixtures(h).every((f) => f.anim === 'out')).toBe(true);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.sim.hero.pos.x).toBeGreaterThan(20 * 16);
  });
});

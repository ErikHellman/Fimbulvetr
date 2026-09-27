import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { buyRow, type ShopDef } from '@core/story/shop';
import { startScript } from '@core/sim/systems/story';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

const SHOP: ShopDef = {
  id: 'dev_shop',
  name: { en: 'Stall', sv: 'Stånd' },
  stock: [
    { item: 'lantern', price: 30 },
    { item: 'flatbread', price: 5, n: 2 },
    { item: 'cheese', price: 1, when: { k: 'flag', id: 'st_raid_begun' } },
  ],
};

function shopDb(things: Thing[] = []): ContentDb {
  return {
    ...DB,
    shops: { dev_shop: SHOP },
    scripts: { dev_script: { steps: [{ k: 'shop', id: 'dev_shop' }] } },
    screens: {
      ...DB.screens,
      test_a: {
        ...DB.screens.test_a,
        things: [{ k: 'use', at: { x: 12, y: 8 }, script: 'dev_script' }, ...things],
      },
    },
  };
}

describe('buying', () => {
  it('spends silver, gives the item and refuses when poor or already owned', () => {
    const h = new Harness({ db: shopDb() });
    h.sim.command({ t: 'buy', shop: 'dev_shop', item: 'lantern' });
    h.idle(1);
    expect(h.sim.state.inv.items.lantern).toBeUndefined();
    h.sim.state.hero.silver = 40;
    h.sim.command({ t: 'buy', shop: 'dev_shop', item: 'lantern' });
    h.sim.command({ t: 'buy', shop: 'dev_shop', item: 'lantern' });
    h.sim.command({ t: 'buy', shop: 'dev_shop', item: 'cheese' });
    h.idle(1);
    expect(h.sim.state.inv.items.lantern).toBe(1);
    expect(h.sim.state.inv.slots[0]).toBe('lantern');
    expect(h.sim.state.hero.silver).toBe(10);
    expect(h.sim.state.inv.items.cheese).toBeUndefined();
  });

  it('works through the shop screen: move, buy, see the result, leave', () => {
    const h = new Harness({ db: shopDb(), tile: [12, 9], facing: 'n' });
    h.sim.state.hero.silver = 12;
    h.press(['interact']);
    expect(h.sim.storyUi()).toMatchObject({
      k: 'shop',
      cursor: 0,
      rows: [{ item: 'lantern' }, { item: 'flatbread' }],
    });
    h.press(['confirm']);
    expect(h.sim.storyUi()).toMatchObject({ last: 'poor' });
    h.press(['down']).press(['confirm']);
    expect(h.sim.storyUi()).toMatchObject({ cursor: 1, last: 'ok' });
    expect(h.sim.state.inv.items.flatbread).toBe(2);
    expect(h.sim.state.hero.silver).toBe(7);
    h.press(['down']).press(['confirm']);
    expect(h.sim.mode).toBe('play');
  });

  it('spends the press that closes the keeper’s last line on the line, not on the first row', () => {
    const db = shopDb();
    const talkFirst: ContentDb = {
      ...db,
      scripts: {
        dev_script: {
          steps: [
            { k: 'say', who: null, text: { en: 'Hello.', sv: 'Hej.' } },
            { k: 'shop', id: 'dev_shop' },
          ],
        },
      },
    };
    const h = new Harness({ db: talkFirst, tile: [12, 9], facing: 'n' });
    h.sim.state.hero.silver = 40;
    h.press(['interact']);
    for (let i = 0; i < 20 && h.sim.storyUi()?.k !== 'shop'; i++) h.press(['confirm']);
    expect(h.sim.storyUi()).toMatchObject({ k: 'shop', last: null });
    expect(h.sim.state.hero.silver).toBe(40);
    expect(h.sim.state.inv.items.lantern).toBeUndefined();
  });

  it('leaves on cancel', () => {
    const h = new Harness({ db: shopDb(), tile: [12, 9], facing: 'n' });
    h.press(['interact']).press(['cancel']);
    expect(h.sim.mode).toBe('play');
  });
});

describe('the hand-axe', () => {
  const swing = (weapon: 'seax' | 'handaxe' | 'none', x: number): Harness => {
    const h = new Harness({ tile: [22, 9], facing: 'e' });
    h.sim.state.inv.weapon = weapon;
    h.sim.hero.pos = { x, y: h.sim.hero.pos.y };
    return h.press(['sword']).idle(20);
  };
  const dealt = (h: Harness): number[] => h.events.flatMap((e) => (e.t === 'hit' ? [e.dealt] : []));

  it('reaches less far than the seax and hits lighter', () => {
    expect(dealt(swing('seax', 365))).toEqual([2]);
    expect(dealt(swing('handaxe', 365))).toEqual([]);
    expect(dealt(swing('handaxe', 376))).toEqual([1]);
  });

  it('cannot be swung bare-handed', () => {
    const h = new Harness({ tile: [22, 9], facing: 'e' });
    h.sim.state.inv.weapon = 'none';
    h.press(['sword']);
    expect(h.sim.hero.fsm.s).toBe('move');
  });
});

describe('heart pieces', () => {
  it('are collected once, and every fourth adds a heart', () => {
    const things: Thing[] = [{ k: 'piece', id: 'p_dev', at: { x: 12, y: 13 } }];
    const h = new Harness({ db: shopDb(things), tile: [10, 13] });
    h.sim.state.world.pieces.push('a', 'b', 'c');
    const max = h.sim.hero.maxHp;
    h.hold(['right'], 40);
    expect(h.sim.state.world.pieces).toContain('p_dev');
    expect(h.sim.hero.maxHp).toBe(max + 4);
    expect(h.sim.state.hero.maxHp).toBe(max + 4);
    expect(h.sim.actors.some((a) => a.kind === 'pickup')).toBe(false);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 10 * 16 + 8, y: 13 * 16 + 14 });
    h.idle(2);
    expect(h.sim.actors.some((a) => a.kind === 'pickup')).toBe(false);
  });
});

describe('wares that are not items', () => {
  const SMITH: ShopDef = {
    id: 'dev_shop',
    name: { en: 'Smithy', sv: 'Smedja' },
    stock: [
      { weapon: 'uppvik_sword', price: 80 },
      { armor: 'byrnie', price: 100 },
      { galdr: 'eldr', price: 10 },
      { item: 'mead_red', price: 20 },
    ],
  };
  const smithDb = (): ContentDb => ({ ...DB, shops: { dev_shop: SMITH } });

  it('sells a sword into the hand, a byrnie onto the back and a galdr into the head, once each', () => {
    const h = new Harness({ db: smithDb() });
    h.sim.state.hero.silver = 100;
    expect(buyRow(h.sim, 'dev_shop', 0)).toBe('ok');
    expect(h.sim.state.inv.weapon).toBe('uppvik_sword');
    expect(buyRow(h.sim, 'dev_shop', 0)).toBe('owned');
    expect(buyRow(h.sim, 'dev_shop', 1)).toBe('poor');
    h.sim.state.hero.silver = 100;
    expect(buyRow(h.sim, 'dev_shop', 1)).toBe('ok');
    expect(h.sim.state.inv.armor).toBe('byrnie');
    expect(buyRow(h.sim, 'dev_shop', 1)).toBe('owned');
    h.sim.state.hero.silver = 50;
    expect(buyRow(h.sim, 'dev_shop', 2)).toBe('ok');
    expect(h.sim.state.inv.galdr).toEqual(['eldr']);
    expect(buyRow(h.sim, 'dev_shop', 2)).toBe('owned');
  });

  it('counts better armour as owned, and mead as full without an empty horn', () => {
    const h = new Harness({ db: smithDb() });
    h.sim.state.hero.silver = 200;
    h.sim.state.inv.armor = 'ember_byrnie';
    expect(buyRow(h.sim, 'dev_shop', 1)).toBe('owned');
    expect(buyRow(h.sim, 'dev_shop', 3)).toBe('full');
    h.sim.state.inv.items.horn = 1;
    expect(buyRow(h.sim, 'dev_shop', 3)).toBe('ok');
    expect(buyRow(h.sim, 'dev_shop', 3)).toBe('full');
    expect(h.sim.state.hero.silver).toBe(180);
  });

  it('shows every ware on the shop screen', () => {
    const h = new Harness({
      db: { ...smithDb(), scripts: { dev_script: { steps: [{ k: 'shop', id: 'dev_shop' }] } } },
    });
    h.sim.command({ t: 'setFlag', flag: 'st_intro_seen', value: true });
    h.idle(1);
    startScript(h.sim, 'dev_script');
    h.idle(1);
    expect(h.sim.storyUi()).toMatchObject({
      k: 'shop',
      rows: [
        { ware: { weapon: 'uppvik_sword' }, price: 80 },
        { ware: { armor: 'byrnie' } },
        { ware: { galdr: 'eldr' } },
        { item: 'mead_red', ware: { item: 'mead_red' } },
      ],
    });
  });
});

import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { itemMax } from '@core/items/defs';
import { evalCond } from '@core/story/cond';
import { applyEffect, giveItem } from '@core/story/effects';
import { buyRow, type ShopDef } from '@core/story/shop';
import { equip } from '@core/sim/systems/items';
import { spillDrop } from '@core/sim/systems/pickups';
import { condCtx } from '@core/sim/systems/story';
import { Harness } from './harness';

const bombs = (h: Harness): number | undefined => h.sim.state.inv.items.bombs;

describe('bombs as ammunition', () => {
  it('carry ten, and ten more with each larger bag', () => {
    const h = new Harness({ tile: [5, 5] });
    expect(itemMax(DB.items, h.sim.state.inv.items, 'bombs')).toBe(10);
    giveItem(h.sim, 'bombs', 30);
    expect(bombs(h)).toBe(10);
    giveItem(h.sim, 'bomb_bag', 1);
    giveItem(h.sim, 'bombs', 30);
    expect(bombs(h)).toBe(20);
    giveItem(h.sim, 'bomb_bag', 1);
    giveItem(h.sim, 'bombs', 30);
    expect(bombs(h)).toBe(30);
  });

  it('stay owned at 0, in their slot, and can still be slotted', () => {
    const h = new Harness({ tile: [5, 5] });
    giveItem(h.sim, 'bombs', 2);
    expect(h.sim.state.inv.slots).toContain('bombs');
    applyEffect({ k: 'take', item: 'bombs', n: 2 }, h.sim);
    expect(bombs(h)).toBe(0);
    expect(h.sim.state.inv.slots).toContain('bombs');
    expect(evalCond({ k: 'owns', id: 'bombs' }, condCtx(h.sim))).toBe(true);
    expect(evalCond({ k: 'item', id: 'bombs' }, condCtx(h.sim))).toBe(false);
    expect(equip(h.sim, 1, 'bombs')).toBe(true);
    // Anything else must be in hand.
    expect(equip(h.sim, 0, 'lantern')).toBe(false);
  });

  it('refill in a shop, capped by the bag, and are refused when full', () => {
    const shop: ShopDef = {
      id: 'dev_shop',
      name: { en: 'S', sv: 'S' },
      stock: [{ item: 'bombs', n: 5, price: 20 }],
    };
    const db: ContentDb = { ...DB, shops: { dev_shop: shop } };
    const h = new Harness({ db, tile: [5, 5] });
    h.sim.state.hero.silver = 100;
    giveItem(h.sim, 'bombs', 7);
    expect(buyRow(h.sim, 'dev_shop', 0)).toBe('ok');
    expect(bombs(h)).toBe(10);
    expect(buyRow(h.sim, 'dev_shop', 0)).toBe('full');
    expect(h.sim.state.hero.silver).toBe(80);
  });

  it('drop only while owned, and a bundle gives four', () => {
    const h = new Harness({ tile: [5, 5] });
    const at = { x: 5 * 16 + 8, y: 5 * 16 + 14 };
    spillDrop(h.sim, 'bombs', at);
    expect(h.sim.actors.some((a) => a.kind === 'pickup' && a.def === 'bombs')).toBe(false);
    giveItem(h.sim, 'bombs', 1);
    spillDrop(h.sim, 'bombs', at);
    h.idle(2);
    expect(bombs(h)).toBe(5);
  });
});

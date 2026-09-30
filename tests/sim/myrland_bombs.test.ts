import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { blast } from '@core/sim/systems/bombs';
import { condCtx } from '@core/sim/systems/story';
import { visibleStock } from '@core/story/shop';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { walkTo } from './walk';

describe('Mýrland’s bomb secrets', () => {
  it('opens the springs’ rock pile onto a cave, where the bomb bag lies', () => {
    const h = new Harness({
      preset: DEV_PRESETS.mylbombs,
      screen: 'myl_springs',
      tile: [35, 6],
      facing: 'n',
    });
    h.idle(1);
    blast(h.sim, tileFeet({ x: 35, y: 4 }));
    h.idle(1);
    expect(h.sim.state.world.opened).toContain('myl_k_springs');
    walkTo(h, 35, 4);
    h.until(() => h.sim.screen.id === 'myl_int_cave', 120, h.frame(['up']));
    expect(DB.screens.myl_int_cave.things).toContainEqual(
      expect.objectContaining({ k: 'chest', id: 'myl_c_bombbag', gives: { item: 'bomb_bag' } }),
    );
  });

  it('hides a piece of heart behind the peat bank’s crack', () => {
    const h = new Harness({ preset: DEV_PRESETS.mylbombs, screen: 'myl_peat', tile: [35, 6], facing: 'n' });
    h.idle(1);
    blast(h.sim, tileFeet({ x: 35, y: 5 }));
    h.idle(1);
    expect(h.sim.state.world.opened).toContain('myl_k_peat');
    walkTo(h, 35, 3);
    expect(h.sim.state.world.pieces).toContain('hp_myl_peat');
  });

  it('has Hrafnkell sell bombs once Ask owns them', () => {
    const shop = DB.shops.hrafnkell;
    if (shop === undefined) throw new Error('no shop');
    const h = new Harness({ preset: DEV_PRESETS.myl });
    const bombs = () => visibleStock(shop, condCtx(h.sim)).find((s) => 'item' in s && s.item === 'bombs');
    expect(bombs()).toBeUndefined();
    h.sim.state.inv.items.bombs = 0;
    expect(bombs()).toMatchObject({ n: 5, price: 20 });
  });
});

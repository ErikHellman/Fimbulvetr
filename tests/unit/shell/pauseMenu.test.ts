import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { Action } from '@core/input/actions';
import { newGame } from '@core/state/gameState';
import { TEST_START } from '@content/start';
import { menuItems, openMenu, stepMenu, type MenuItem, type MenuState } from '@shell/ui/pauseMenu';
import { frameOf } from '../../sim/harness';

const press = (...a: Action[]) => frameOf([], a);

function inventory() {
  const s = newGame(1, TEST_START);
  s.inv.items = { flatbread: 2, boomerang: 1, lantern: 1 };
  s.inv.slots = ['lantern', null];
  return s.inv;
}

function run(state: MenuState, items: readonly MenuItem[], ...frames: Action[][]) {
  let st: MenuState | null = state;
  const actions = [];
  for (const f of frames) {
    if (st === null) break;
    const r = stepMenu(st, press(...f), items);
    st = r.state;
    actions.push(...r.actions);
  }
  return { state: st, actions };
}

describe('pause menu', () => {
  it('lists owned sub-items (with their slot) before food', () => {
    const items = menuItems(inventory(), DB.items);
    expect(items.map((i) => [i.id, i.kind, i.slot, i.count])).toEqual([
      ['lantern', 'sub', 0, 1],
      ['boomerang', 'sub', null, 1],
      ['flatbread', 'food', null, 2],
    ]);
  });

  it('lists mead to drink, green mead too', () => {
    const inv = inventory();
    inv.items = { ...inv.items, horn: 2, mead_green: 1 };
    expect(menuItems(inv, DB.items).map((i) => i.id)).toEqual([
      'lantern',
      'boomerang',
      'mead_green',
      'flatbread',
    ]);
  });

  it('moves between tabs with left and right, wrapping, and M jumps to the map', () => {
    const items = menuItems(inventory(), DB.items);
    expect(run(openMenu(), items, ['right']).state?.tab).toBe('map');
    expect(run(openMenu(), items, ['left']).state?.tab).toBe('system');
    expect(run(openMenu(), items, ['map']).state?.tab).toBe('map');
    expect(run(openMenu('map'), items, ['map']).state).toBeNull();
  });

  it('closes on cancel or the menu key', () => {
    const items = menuItems(inventory(), DB.items);
    expect(run(openMenu(), items, ['cancel'])).toEqual({ state: null, actions: [{ k: 'close' }] });
    expect(run(openMenu('quests'), items, ['menu']).state).toBeNull();
  });

  it('puts the chosen sub-item in K or L, and eats food', () => {
    const items = menuItems(inventory(), DB.items);
    expect(run(openMenu(), items, ['down'], ['item2']).actions).toEqual([
      { k: 'equip', slot: 1, item: 'boomerang' },
    ]);
    expect(run(openMenu(), items, ['down'], ['confirm']).actions).toEqual([
      { k: 'equip', slot: 0, item: 'boomerang' },
    ]);
    expect(run(openMenu(), items, ['up'], ['confirm']).actions).toEqual([{ k: 'eat', item: 'flatbread' }]);
  });

  it('asks before starting over, and a second yes starts over', () => {
    const items = menuItems(inventory(), DB.items);
    expect(run(openMenu('system'), items, ['confirm']).state).toBeNull();
    const asked = run(openMenu('system'), items, ['down'], ['down'], ['confirm']);
    expect(asked.state?.confirm).toBe(true);
    expect(run(openMenu('system'), items, ['down'], ['down'], ['confirm'], ['cancel']).state?.confirm).toBe(
      false,
    );
    expect(run(openMenu('system'), items, ['down'], ['down'], ['confirm'], ['confirm']).actions).toEqual([
      { k: 'startOver' },
    ]);
  });

  it('opens the settings from the game tab', () => {
    const items = menuItems(inventory(), DB.items);
    const r = run(openMenu('system'), items, ['down'], ['confirm']);
    expect(r.actions).toEqual([{ k: 'settings' }]);
    expect(r.state?.tab).toBe('system');
  });

  it('does nothing on an empty items tab', () => {
    expect(run(openMenu(), [], ['down'], ['confirm'], ['item1']).actions).toEqual([]);
  });
});

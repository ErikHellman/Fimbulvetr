import { ITEMS, type ItemId } from '@content/ids';
import { wasPressed, type Action, type InputFrame } from '@core/input/actions';
import type { ItemDef } from '@core/items/defs';
import type { InventoryState } from '@core/state/gameState';

/** The pause menu: pure state and input handling, drawn by the UI scene. The sim does not run meanwhile. */

export const MENU_TABS = ['items', 'map', 'quests', 'system'] as const;
export type MenuTab = (typeof MENU_TABS)[number];

/** Rows of the system tab. */
export const SYSTEM_ROWS = ['resume', 'settings', 'start_over'] as const;

export interface MenuState {
  readonly tab: MenuTab;
  readonly cursor: number;
  /** The system tab is asking "start a new game?". */
  readonly confirm: boolean;
}

/** One line of the items tab: an owned sub-item (for the K/L slots) or food (to eat). */
export interface MenuItem {
  readonly id: ItemId;
  readonly count: number;
  readonly kind: 'sub' | 'food';
  /** The slot it sits in, if any. */
  readonly slot: 0 | 1 | null;
}

export type MenuAction =
  | { readonly k: 'close' }
  | { readonly k: 'equip'; readonly slot: 0 | 1; readonly item: ItemId }
  | { readonly k: 'eat'; readonly item: ItemId }
  /** Open the settings menu (the scene runs it over the system tab). */
  | { readonly k: 'settings' }
  | { readonly k: 'startOver' };

export function openMenu(tab: MenuTab = 'items'): MenuState {
  return { tab, cursor: 0, confirm: false };
}

/** What the items tab lists: owned sub-items, then food, both in registry order. */
export function menuItems(inv: InventoryState, defs: Readonly<Record<ItemId, ItemDef>>): MenuItem[] {
  const owned = ITEMS.filter((id) => (inv.items[id] ?? 0) > 0);
  const slotOf = (id: ItemId): 0 | 1 | null => (inv.slots[0] === id ? 0 : inv.slots[1] === id ? 1 : null);
  const subs = owned.filter((id) => defs[id].slot);
  const food = owned.filter((id) => defs[id].heal !== undefined);
  return [
    ...subs.map((id) => ({ id, count: inv.items[id] ?? 0, kind: 'sub' as const, slot: slotOf(id) })),
    ...food.map((id) => ({ id, count: inv.items[id] ?? 0, kind: 'food' as const, slot: null })),
  ];
}

function rows(state: MenuState, items: readonly MenuItem[]): number {
  if (state.tab === 'items') return items.length;
  if (state.tab === 'system') return SYSTEM_ROWS.length;
  return 0;
}

const any = (frame: InputFrame, actions: readonly Action[]): boolean =>
  actions.some((a) => wasPressed(frame, a));

/** One frame of menu input. A null state means the menu closed. */
export function stepMenu(
  state: MenuState,
  frame: InputFrame,
  items: readonly MenuItem[],
): { state: MenuState | null; actions: MenuAction[] } {
  const close = { state: null, actions: [{ k: 'close' } as const] };
  if (state.confirm) {
    if (any(frame, ['confirm', 'interact'])) return { state: null, actions: [{ k: 'startOver' }] };
    if (any(frame, ['cancel', 'menu', 'up', 'down', 'left', 'right']))
      return { state: { ...state, confirm: false }, actions: [] };
    return { state, actions: [] };
  }
  if (any(frame, ['cancel', 'menu'])) return close;
  if (wasPressed(frame, 'map')) return state.tab === 'map' ? close : { state: openMenu('map'), actions: [] };
  const tabIndex = MENU_TABS.indexOf(state.tab);
  if (wasPressed(frame, 'left') || wasPressed(frame, 'right')) {
    const step = wasPressed(frame, 'right') ? 1 : MENU_TABS.length - 1;
    return { state: openMenu(MENU_TABS[(tabIndex + step) % MENU_TABS.length]), actions: [] };
  }
  const n = rows(state, items);
  if (n > 0 && (wasPressed(frame, 'up') || wasPressed(frame, 'down'))) {
    const cursor = (state.cursor + (wasPressed(frame, 'down') ? 1 : n - 1)) % n;
    return { state: { ...state, cursor }, actions: [] };
  }
  if (state.tab === 'items') {
    const item = items[Math.min(state.cursor, items.length - 1)];
    if (item === undefined) return { state, actions: [] };
    if (item.kind === 'sub') {
      if (wasPressed(frame, 'item2')) return { state, actions: [{ k: 'equip', slot: 1, item: item.id }] };
      if (any(frame, ['item1', 'confirm', 'interact']))
        return { state, actions: [{ k: 'equip', slot: 0, item: item.id }] };
    } else if (any(frame, ['confirm', 'interact'])) return { state, actions: [{ k: 'eat', item: item.id }] };
  }
  if (state.tab === 'system' && any(frame, ['confirm', 'interact'])) {
    const row = SYSTEM_ROWS[state.cursor];
    if (row === 'resume') return close;
    if (row === 'settings') return { state, actions: [{ k: 'settings' }] };
    return { state: { ...state, confirm: true }, actions: [] };
  }
  return { state, actions: [] };
}

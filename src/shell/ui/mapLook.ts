import { wasPressed, type InputFrame } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import { lookStep, type MapModel } from '@core/world/mapModel';
import type { MenuState } from './pauseMenu';

const STEPS: readonly (readonly ['up' | 'down' | 'left' | 'right', Dir4])[] = [
  ['up', 'n'],
  ['down', 's'],
  ['left', 'w'],
  ['right', 'e'],
];

/**
 * The map tab's look-around frame: confirm puts it on the hero's screen, the arrows move it over the screens
 * seen, and cancel or confirm put it away again (the map and menu keys still close the menu). Null when the
 * frame is not out and the press is the pause menu's to handle; `map` is null in a dungeon.
 */
export function stepMapLook(
  state: MenuState,
  frame: InputFrame,
  map: MapModel | null,
): { state: MenuState | null; moved: boolean } | null {
  if (state.tab !== 'map' || map === null) return null;
  const look = state.look ?? null;
  if (look === null) {
    if (!wasPressed(frame, 'confirm') && !wasPressed(frame, 'interact')) return null;
    const here = map.cells.find((c) => c.here);
    return here === undefined ? null : { state: { ...state, look: here.id }, moved: true };
  }
  if (wasPressed(frame, 'map') || wasPressed(frame, 'menu')) return { state: null, moved: false };
  if (wasPressed(frame, 'cancel') || wasPressed(frame, 'confirm') || wasPressed(frame, 'interact'))
    return { state: { ...state, look: null }, moved: false };
  for (const [action, dir] of STEPS) {
    if (!wasPressed(frame, action)) continue;
    const next = lookStep(map, look, dir);
    return { state: { ...state, look: next }, moved: next !== look };
  }
  return { state, moved: false };
}

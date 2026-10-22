import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { Action } from '@core/input/actions';
import { overworldMap } from '@core/world/mapModel';
import { stepMapLook } from '@shell/ui/mapLook';
import { openMenu } from '@shell/ui/pauseMenu';
import { frameOf } from '../../sim/harness';

const press = (...a: Action[]) => frameOf([], a);
const m = overworldMap(DB.layout, DB.screens, ['ask_gate', 'ask_farmyard', 'ask_village'], 'ask_farmyard');

describe('looking around the map tab', () => {
  it('leaves other tabs, and the map at rest but for confirm, to the menu', () => {
    expect(stepMapLook(openMenu('items'), press('interact'), m)).toBeNull();
    expect(stepMapLook(openMenu('map'), press('right'), m)).toBeNull();
    expect(stepMapLook(openMenu('map'), press('interact'), null)).toBeNull();
  });

  it('starts on the hero’s screen and moves over seen screens', () => {
    const start = stepMapLook(openMenu('map'), press('interact'), m);
    expect(start?.state?.look).toBe('ask_farmyard');
    const east = stepMapLook(start?.state ?? openMenu('map'), press('right'), m);
    expect(east).toMatchObject({ state: { tab: 'map', look: 'ask_village' }, moved: true });
    const stuck = stepMapLook(east?.state ?? openMenu('map'), press('right'), m);
    expect(stuck?.moved).toBe(false);
    expect(stuck?.state?.look).toBe('ask_village');
  });

  it('puts the frame away on cancel or confirm, and closes the menu on the map key', () => {
    const looking = { ...openMenu('map'), look: 'ask_village' as const };
    expect(stepMapLook(looking, press('cancel'), m)?.state).toEqual({ ...looking, look: null });
    expect(stepMapLook(looking, press('interact'), m)?.state?.look).toBeNull();
    expect(stepMapLook(looking, press('map'), m)).toEqual({ state: null, moved: false });
    expect(stepMapLook(looking, press('menu'), m)).toEqual({ state: null, moved: false });
  });
});

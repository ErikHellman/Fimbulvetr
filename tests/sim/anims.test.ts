import { describe, expect, it } from 'vitest';
import { ANIMS } from '@art/sprites';
import type { InputFrame } from '@core/input/actions';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/**
 * Every entity's `anim` must always name a real animation for its `art`. This is what stands
 * between a core state-machine typo (e.g. `attak2`) and a magenta "missing frame" placeholder
 * showing up only much later, in the shell. Drives the hero through the full move set — walking,
 * a full 3-hit combo, charge into a spin, a roll, shield-walking, and a screen transition — and
 * checks every entity, every tick.
 */
describe('anims', () => {
  it('always resolves to a real animation, for every entity, every tick', () => {
    const h = new Harness({ screen: 'test_a', tile: [13, 11] });
    const seenHeroAnims = new Set<string>();

    function tick(frame: InputFrame = frameOf([])): void {
      h.step(frame);
      for (const e of h.sim.entities) {
        const table = ANIMS[e.art];
        expect(table, `entity ${e.id} has unknown art '${e.art}'`).toBeDefined();
        expect(Object.keys(table ?? {}), `unknown anim '${e.anim}' for art '${e.art}'`).toContain(e.anim);
      }
      seenHeroAnims.add(h.sim.hero.anim);
    }

    // Walking.
    for (let i = 0; i < 10; i++) tick(frameOf(['right']));

    // A full combo (attack1 -> attack2 -> attack3): mash sword every tick so each chain window
    // (opens once fsm.t reaches attackTicks - comboWindow) is always caught, then keep holding to
    // roll straight into charge once the finisher ends.
    for (let i = 0; i < 90; i++) tick(frameOf(['sword'], ['sword']));

    // Release the sword once fully charged to fire the spin, then let it play out.
    tick(frameOf([]));
    for (let i = 0; i < 26; i++) tick(frameOf([]));

    // A roll, then let it finish and settle back to idle.
    tick(frameOf(['down'], ['roll']));
    for (let i = 0; i < 20; i++) tick(frameOf([]));

    // Shield, walking.
    for (let i = 0; i < 15; i++) tick(frameOf(['shield', 'right']));
    tick(frameOf([]));

    // A screen transition: warp next to the test_b seam, then walk across it.
    const near = tileFeet({ x: 37, y: 11 });
    h.sim.command({ t: 'warp', screen: 'test_a', x: near.x, y: near.y });
    tick(frameOf([]));
    let guard = 0;
    while (!(h.sim.mode === 'play' && h.sim.screen.id === 'test_b')) {
      tick(frameOf(['right']));
      guard += 1;
      if (guard > 200) throw new Error('never reached test_b');
    }

    for (const anim of [
      'idle',
      'walk',
      'attack1',
      'attack2',
      'attack3',
      'charge',
      'spin',
      'roll',
      'shieldwalk',
    ]) {
      expect(seenHeroAnims, `hero never played '${anim}'`).toContain(anim);
    }
  });
});

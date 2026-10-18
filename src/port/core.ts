import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { InputLatch } from '@core/input/actions';
import type { Command } from '@core/sim/commands';
import { Sim } from '@core/sim/sim';
import { newGame } from '@core/state/gameState';
import { canonicalJson, loadSave, makeSave } from '@core/state/save';

/**
 * The game rules for a native shell (the Apple TV app): the pure core and content behind a small API of
 * strings and numbers, so it crosses a JavaScriptCore bridge without shared types. The host owns time
 * (it calls `step` 60 times a second), input, drawing, sound and storage.
 */
export interface PortCore {
  /** Loads a save's JSON text, or starts a new game from `seed` when it is null. '' or why it failed. */
  boot(saveJson: string | null, seed: number): string;
  /** One 1/60 s tick. `held`: action bits (`ACTIONS` order); `mx`, `my`: the stick in [-1, 1]. */
  step(held: number, mx: number, my: number): void;
  /** A sim command as JSON, applied on the next tick (warps for tools and benchmarks). */
  command(json: string): void;
  /** The sim's state hash, for determinism checks against the web build. */
  hash(): number;
  /** JSON: the screen, the mode and the hero's place and health. */
  status(): string;
  /** The running game as save-file text. The host passes the build name and an ISO time. */
  save(build: string, savedAt: string): string;
}

export function createPort(): PortCore {
  let sim: Sim | null = null;
  let latch = new InputLatch();
  const known = new Set<string>(SCREEN_IDS);
  const running = (): Sim => {
    if (sim === null) throw new Error('port: call boot() first');
    return sim;
  };
  return {
    boot(saveJson, seed) {
      let state = newGame(seed, NEW_GAME);
      if (saveJson !== null) {
        let raw: unknown;
        try {
          raw = JSON.parse(saveJson);
        } catch {
          return 'the save is not JSON';
        }
        const loaded = loadSave(raw, known);
        if (!loaded.ok) return loaded.error.detail;
        state = loaded.state;
      }
      sim = new Sim(DB, state);
      latch = new InputLatch();
      return '';
    },
    step(held, mx, my) {
      const s = running();
      latch.report(held, mx, my);
      s.step(latch.consume());
      s.drainEvents();
    },
    command(json) {
      running().command(JSON.parse(json) as Command);
    },
    hash() {
      return running().hash();
    },
    status() {
      const s = running();
      const h = s.hero;
      return canonicalJson({
        screen: s.screen.id,
        mode: s.mode,
        hero: { x: h.pos.x, y: h.pos.y, hp: s.state.hero.hp },
      });
    },
    save(build, savedAt) {
      return JSON.stringify(makeSave(running().snapshot(), build, savedAt));
    },
  };
}

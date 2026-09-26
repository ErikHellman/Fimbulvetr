import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import type { EnemyCtx } from './defs';

export type DummyState = 'idle' | 'hurt';

const WOBBLE_TICKS = 12;

export const DUMMY_MACHINE: Machine<DummyState, EnemyCtx> = {
  idle: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      return e.flash > 0 ? 'hurt' : undefined;
    },
  },
  hurt: {
    enter(e) {
      setAnim(e, 'hurt');
    },
    tick(e) {
      return e.fsm.t >= WOBBLE_TICKS - 1 ? 'idle' : undefined;
    },
  },
};

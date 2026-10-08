import { evalCond } from '../../story/cond';
import type { SimRt } from '../rt';
import { condCtx, startScript } from './story';

/**
 * One tick of play under a trial: won the tick its goal holds, lost when the sand runs out or Ask has
 * left the screen it began on. Either way the trial ends and its script runs.
 */
export function stepTrial(rt: SimRt): void {
  const trial = rt.sand;
  if (trial === undefined) return;
  if (rt.screen.id === trial.screen && evalCond(trial.done, condCtx(rt))) {
    delete rt.sand;
    startScript(rt, trial.win);
    return;
  }
  trial.left -= 1;
  if (trial.left > 0 && rt.screen.id === trial.screen) return;
  delete rt.sand;
  startScript(rt, trial.fail);
}

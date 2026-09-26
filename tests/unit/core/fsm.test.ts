import { describe, expect, it } from 'vitest';
import { createEntity } from '@core/actors/entity';
import { changeState, runFsm, type Machine } from '@core/actors/fsm';

type S = 'a' | 'b';
const log: string[] = [];
const machine: Machine<S, null> = {
  a: {
    enter: () => log.push('enter a'),
    tick: (e) => (e.fsm.t >= 1 ? 'b' : undefined),
    exit: () => log.push('exit a'),
  },
  b: { enter: () => log.push('enter b'), tick: () => undefined },
};

const entity = (state: string) =>
  createEntity({
    id: 1,
    kind: 'enemy',
    def: 'probe',
    art: 'probe',
    pos: { x: 0, y: 0 },
    facing: 's',
    body: { x: 0, y: 1, w: 1, h: 1 },
    hurt: { x: 0, y: 1, w: 1, h: 1 },
    faction: 'enemy',
    hp: 1,
    maxHp: 1,
    state,
  });

describe('state machines', () => {
  it('counts ticks in a state and switches with exit/enter', () => {
    log.length = 0;
    const e = entity('a');
    runFsm(machine, e, null);
    expect(e.fsm).toEqual({ s: 'a', t: 1 });
    runFsm(machine, e, null);
    expect(e.fsm).toEqual({ s: 'b', t: 0 });
    expect(log).toEqual(['exit a', 'enter b']);
  });

  it('can be switched from outside', () => {
    log.length = 0;
    const e = entity('b');
    changeState(machine, e, 'a', null);
    expect(e.fsm.s).toBe('a');
    expect(log).toEqual(['enter a']);
  });

  it('throws on an unknown state', () => {
    expect(() => {
      runFsm(machine, entity('zzz'), null);
    }).toThrow("probe: unknown state 'zzz'");
  });
});

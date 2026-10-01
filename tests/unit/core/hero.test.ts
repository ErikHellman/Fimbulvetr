import { describe, expect, it } from 'vitest';
import { TUNING } from '@content/tuning';
import { mem, type Entity } from '@core/actors/entity';
import { runFsm } from '@core/actors/fsm';
import { HERO_MACHINE, createHero, heroPreTick, heroSwordBox } from '@core/actors/hero';
import { bitsOf, type Action, type InputFrame } from '@core/input/actions';
import { length } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';

function frame(held: Action[] = [], pressed: Action[] = []): InputFrame {
  const all = [...held, ...pressed];
  const has = (a: Action): boolean => all.includes(a);
  return {
    held: bitsOf(all),
    pressed: bitsOf(pressed),
    released: 0,
    mx: (has('right') ? 1 : 0) - (has('left') ? 1 : 0),
    my: (has('down') ? 1 : 0) - (has('up') ? 1 : 0),
  };
}

function setup(hasShield = true): {
  e: Entity;
  events: SimEvent[];
  run: (frames: InputFrame[]) => void;
  idle: (n: number) => void;
} {
  const e = createHero(1, { x: 100, y: 100, facing: 's', hp: 12, maxHp: 12 }, TUNING);
  const events: SimEvent[] = [];
  const run = (frames: InputFrame[]): void => {
    for (const input of frames) {
      heroPreTick(e);
      runFsm(HERO_MACHINE, e, {
        input,
        tuning: TUNING,
        hasShield,
        armed: true,
        dash: false,
        ledgeHop: () => null,
        emit: (ev) => events.push(ev),
      });
    }
  };
  const idle = (n: number): void => {
    run(Array.from({ length: n }, () => frame()));
  };
  return { e, events, run, idle };
}

const sfx = (events: SimEvent[], id: string): number =>
  events.filter((ev) => ev.t === 'sfx' && ev.id === id).length;

describe('hero movement', () => {
  it('walks and faces the direction of travel', () => {
    const { e, run } = setup();
    run([frame(['right'])]);
    expect(e.vel).toEqual({ x: TUNING.hero.walkSpeed, y: 0 });
    expect(e.facing).toBe('e');
    expect(e.anim).toBe('walk');
  });

  it('is not faster diagonally', () => {
    const { e, run } = setup();
    run([frame(['right', 'down'])]);
    expect(length(e.vel)).toBeCloseTo(TUNING.hero.walkSpeed);
  });
});

describe('sword', () => {
  it('swings with an active window, then returns to moving', () => {
    const { e, events, run, idle } = setup();
    run([frame([], ['sword'])]);
    expect(e.fsm.s).toBe('attack');
    expect(sfx(events, 'sfx_swing')).toBe(1);
    idle(3);
    expect(mem(e, 'swordOn')).toBe(1);
    expect(heroSwordBox(e, TUNING)).not.toBeNull();
    idle(11);
    expect(e.fsm.s).toBe('move');
    expect(heroSwordBox(e, TUNING)).toBeNull();
  });

  it('chains a three-hit combo when pressed inside the window', () => {
    const { e, run, idle } = setup();
    run([frame([], ['sword'])]);
    idle(6);
    run([frame([], ['sword'])]);
    expect(mem(e, 'combo')).toBe(2);
    expect(e.anim).toBe('attack2');
    idle(6);
    run([frame([], ['sword'])]);
    expect(mem(e, 'combo')).toBe(3);
    expect(e.anim).toBe('attack3');
    expect(mem(e, 'swing')).toBe(3);
  });

  it('ignores a press before the combo window opens', () => {
    const { e, run, idle } = setup();
    run([frame([], ['sword'])]);
    idle(2);
    run([frame([], ['sword'])]);
    expect(mem(e, 'combo')).toBe(1);
  });

  it('charges while held and spins on release', () => {
    const { e, events, run } = setup();
    run([frame(['sword'], ['sword'])]);
    run(Array.from({ length: 14 }, () => frame(['sword'])));
    expect(e.fsm.s).toBe('charge');
    run(Array.from({ length: TUNING.hero.chargeTicks }, () => frame(['sword'])));
    expect(sfx(events, 'sfx_charge')).toBe(1);
    run([frame()]);
    expect(e.fsm.s).toBe('spin');
    expect(mem(e, 'spinOn')).toBe(1);
    run(Array.from({ length: TUNING.hero.spinTicks }, () => frame()));
    expect(e.fsm.s).toBe('move');
  });

  it('does not spin when released before fully charged', () => {
    const { e, run } = setup();
    run([frame(['sword'], ['sword'])]);
    run(Array.from({ length: 20 }, () => frame(['sword'])));
    run([frame()]);
    expect(e.fsm.s).toBe('move');
  });
});

describe('roll', () => {
  it('rolls in the facing direction with i-frames, then cools down', () => {
    const { e, run, idle } = setup();
    run([frame([], ['roll'])]);
    expect(e.fsm.s).toBe('roll');
    expect(e.iframes).toBe(TUNING.hero.rollIframes);
    idle(1);
    expect(e.vel).toEqual({ x: 0, y: TUNING.hero.rollSpeed });
    idle(TUNING.hero.rollTicks - 1);
    expect(e.fsm.s).toBe('move');
    run([frame([], ['roll'])]);
    expect(e.fsm.s).toBe('move');
    idle(TUNING.hero.rollCooldown);
    run([frame([], ['roll'])]);
    expect(e.fsm.s).toBe('roll');
  });
});

describe('shield', () => {
  it('slows the hero and locks facing while held', () => {
    const { e, run } = setup();
    run([frame(['shield'])]);
    expect(e.fsm.s).toBe('shield');
    run([frame(['shield', 'left'])]);
    expect(mem(e, 'shielding')).toBe(1);
    expect(e.facing).toBe('s');
    expect(e.vel.x).toBe(-TUNING.hero.shieldSpeed);
    run([frame()]);
    expect(e.fsm.s).toBe('move');
    expect(mem(e, 'shielding')).toBe(0);
  });

  it('cannot shield without a shield', () => {
    const { e, run } = setup(false);
    run([frame(['shield'])]);
    expect(e.fsm.s).toBe('move');
  });
});

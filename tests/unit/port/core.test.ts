import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { bit } from '@core/input/actions';
import { Sim } from '@core/sim/sim';
import { newGame } from '@core/state/gameState';
import { createPort } from '@port/core';

const fixture = readFileSync(new URL('../../fixtures/saves/v1-m10a.json', import.meta.url), 'utf8');

describe('port core (the game rules for native shells)', () => {
  it('starts a new game from a seed and steps exactly like the Sim', () => {
    const port = createPort();
    expect(port.boot(null, 7)).toBe('');
    const sim = new Sim(DB, newGame(7, NEW_GAME));
    for (let i = 0; i < 120; i++) {
      port.step(bit('down'), 0, 1);
      sim.step({ held: bit('down'), pressed: i === 0 ? bit('down') : 0, released: 0, mx: 0, my: 1 });
    }
    expect(port.hash()).toBe(sim.hash());
  });

  it('boots from a save and reports where the hero is', () => {
    const port = createPort();
    expect(port.boot(fixture, 1)).toBe('');
    const status = JSON.parse(port.status()) as { screen: string; mode: string; hero: { hp: number } };
    expect(status.mode).toBe('play');
    expect(typeof status.screen).toBe('string');
    expect(status.hero.hp).toBeGreaterThan(0);
  });

  it('refuses a broken save with a reason, and needs a boot before anything else', () => {
    const port = createPort();
    expect(port.boot('{"nope":1}', 1)).toMatch(/fimbulvetr/);
    expect(() => {
      port.step(0, 0, 0);
    }).toThrow(/boot/);
  });

  it('saves the running game as text that boots again to the same state', () => {
    const a = createPort();
    a.boot(null, 3);
    for (let i = 0; i < 30; i++) a.step(bit('right'), 1, 0);
    const text = a.save('port', '2026-10-18T00:00:00.000Z');
    const b = createPort();
    expect(b.boot(text, 99)).toBe('');
    expect(JSON.parse(b.status())).toEqual(JSON.parse(a.status()));
  });

  it('returns the tick’s events as JSON, and nothing on a quiet tick', () => {
    const port = createPort();
    port.boot(null, 1);
    port.command(JSON.stringify({ t: 'warp', screen: 'test_a', x: 40, y: 40 }));
    const seen: { t: string }[] = [];
    for (let i = 0; i < 90; i++) {
      const e = port.step(0, 0, 0);
      if (e !== '') seen.push(...(JSON.parse(e) as { t: string }[]));
    }
    expect(seen.map((e) => e.t)).toContain('screenEntered');
    expect(port.step(0, 0, 0)).toBe('');
  });

  it('applies commands given as JSON (warps, for tools and benchmarks)', () => {
    const port = createPort();
    port.boot(null, 1);
    port.command(JSON.stringify({ t: 'warp', screen: 'test_a', x: 40, y: 40 }));
    port.step(0, 0, 0);
    port.step(0, 0, 0);
    expect((JSON.parse(port.status()) as { screen: string }).screen).toBe('test_a');
  });
});

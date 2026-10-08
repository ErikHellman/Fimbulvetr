import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { HRONN } from '@core/actors/enemies/hronn';
import { parseTextMap } from '@core/world/textmap';

const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd5');

const cell = (id: ScreenId, x: number, y: number): string | undefined => {
  const g = parseTextMap(SCREENS[id].map, DB.legend);
  return g.cells[y * g.cols + x];
};

describe('Sökkva Hof', () => {
  it('has twenty-four rooms, all under one water level', () => {
    expect(rooms).toHaveLength(24);
    for (const id of rooms) expect(SCREENS[id].water, id).toBe('w_d5_level');
  });

  it('is dived into at the spire, and dived out of again', () => {
    const down = SCREENS.sae_drowned.things.find((t) => t.k === 'door' && t.to === 'd5_r01');
    expect(down?.k === 'door' && down.dive).toBe(true);
    if (down?.k === 'door') expect(cell('sae_drowned', down.at.x, down.at.y)).toBe('water');
    const up = SCREENS.d5_r01.things.find((t) => t.k === 'door' && t.to === 'sae_drowned');
    expect(up?.k === 'door' && up.dive).toBe(true);
    if (up?.k === 'door') expect(cell('d5_r01', up.at.x, up.at.y)).toBe('water');
  });

  it('stands every chest, wheel and fan on floor that never floods', () => {
    for (const id of rooms)
      for (const t of SCREENS[id].things)
        if (t.k === 'chest' || t.k === 'wheel' || t.k === 'switch')
          expect(cell(id, t.at.x, t.at.y), `${id} ${t.k} ${String(t.at.x)},${String(t.at.y)}`).toBe(
            'crypt_floor',
          );
  });

  it('turns the water to every level somewhere', () => {
    const levels = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'wheel' ? [t.level] : [])),
    );
    expect(new Set(levels)).toEqual(new Set([0, 1, 2]));
  });

  it("raises Hrönn's four grates on dry floor round its pool", () => {
    const eel = SCREENS.d5_r15.things.find((t) => t.k === 'enemy' && t.id === 'hronn');
    if (eel === undefined) throw new Error('no Hrönn');
    for (const g of HRONN.grates) {
      const x = eel.at.x + g.x / 16;
      const y = eel.at.y + g.y / 16;
      expect(cell('d5_r15', x, y), `grate ${String(x)},${String(y)}`).toBe('crypt_floor');
    }
  });

  it('floats its sailing raft on the race at each stop, beside a bank', () => {
    const rafts = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'raft' ? [[id, t] as const] : [])),
    );
    expect(rafts).toHaveLength(1);
    for (const [id, t] of rafts) {
      expect(t.sail).toBe(true);
      for (const stop of [t.at, ...t.path]) {
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ] as const)
          expect(cell(id, stop.x + dx, stop.y + dy)).toBe('rapids');
        const ring = [
          [-1, 0],
          [2, 0],
        ].map(([dx = 0, dy = 0]) => cell(id, stop.x + dx, stop.y + dy));
        expect(ring).toContain('crypt_floor');
      }
    }
  });

  it('keeps Oddr and Hallbera in its cells, behind bars, until Nykr falls', () => {
    const places = (id: 'oddr' | 'hallbera') => DB.npcs[id]?.places ?? [];
    expect(places('oddr').map((p) => p.screen)).toContain('d5_r18');
    expect(places('hallbera').map((p) => p.screen)).toContain('d5_r21');
    const bars = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'gate' && t.art === 'bars' ? [id] : [])),
    );
    expect(bars.sort()).toEqual(['d5_r18', 'd5_r21']);
  });

  it('has three wind fans and a sunken arch to dive under', () => {
    const fans = rooms.flatMap((id) => SCREENS[id].things.filter((t) => t.k === 'switch' && t.fan === true));
    expect(fans).toHaveLength(3);
    expect(rooms.some((id) => SCREENS[id].map.some((row) => row.includes('(')))).toBe(true);
  });
});

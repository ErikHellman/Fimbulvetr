import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { parseTextMap } from '@core/world/textmap';

const cell = (id: ScreenId, x: number, y: number): string | undefined => {
  const g = parseTextMap(SCREENS[id].map, DB.legend);
  return g.cells[y * g.cols + x];
};

const threads = SCREEN_IDS.flatMap((id) =>
  SCREENS[id].things.flatMap((t) =>
    t.k === 'chest' && 'item' in t.gives && t.gives.item === 'norn_thread' ? [[id, t] as const] : [],
  ),
);

describe("the Norns' three threads", () => {
  it('lie in Myrkviðr, Mýrland and Haugar, one each', () => {
    expect(threads.map(([id]) => SCREENS[id].region).sort()).toEqual(['haugar', 'myrkvidr', 'myrland']);
  });

  it("puts Myrkviðr's behind a web only Vindr tears", () => {
    const web = SCREENS.myr_road.things.find((t) => t.k === 'gate' && t.art === 'web');
    expect(web?.k === 'gate' && web.blows).toBe('w_myr_web');
  });

  it("sinks Mýrland's on the bottom of water, for a diver", () => {
    const [id, t] = threads.find(([s]) => s === 'myl_ferry') ?? [];
    if (id === undefined || t === undefined) throw new Error('no Mýrland thread');
    expect(t.sunk).toBe(true);
    expect(cell(id, t.at.x, t.at.y)).toBe('water');
  });

  it("shows Haugar's only at night, to one who knows Ljós", () => {
    const [, t] = threads.find(([s]) => s === 'hau_barrows') ?? [];
    expect(JSON.stringify(t?.when)).toContain('ljos');
    expect(JSON.stringify(t?.when)).toContain('night');
  });

  it('seats the three Norns at the loom under the well', () => {
    for (const n of ['urdr', 'verdandi', 'skuld'] as const)
      expect(DB.npcs[n]?.places.map((p) => p.screen)).toContain('sae_int_well');
  });
});

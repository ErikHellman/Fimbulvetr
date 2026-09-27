import { describe, expect, it } from 'vitest';
import type { TileAnim } from '@art/tiles/tileset';
import { animateTiles, tileData, type TileAnimation } from '@shell/gfx/tileAnims';

const water: TileAnim[] = Array.from({ length: 47 }, (_, i) => ({
  tile: 10 + i,
  frames: [10 + i, 57 + i, 104 + i, 151 + i],
  frameMs: 150,
}));

describe('tileData', () => {
  it('turns each tile animation into a Phaser animation keyed by its frame-0 tile', () => {
    const data = tileData(water);
    expect(
      Object.keys(data)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual(water.map((a) => a.tile));
    expect(data[10]).toEqual({
      animation: [
        { tileid: 10, duration: 150, startTime: 0 },
        { tileid: 57, duration: 150, startTime: 150 },
        { tileid: 104, duration: 150, startTime: 300 },
        { tileid: 151, duration: 150, startTime: 450 },
      ],
      animationDuration: 600,
    });
  });

  it('tiles the whole cycle so no time falls between frames', () => {
    for (const anim of Object.values(tileData(water))) {
      let t = 0;
      for (const f of anim.animation) {
        expect(f.startTime).toBe(t);
        t += f.duration;
      }
      expect(t).toBe(anim.animationDuration);
    }
  });
});

describe('animateTiles', () => {
  it('writes the animations into a tileset and reports how many', () => {
    const target = { tileData: {} as Record<number, unknown> };
    expect(animateTiles(target, water)).toBe(47);
    const last = target.tileData[56] as TileAnimation;
    expect(last.animation.map((f) => f.tileid)).toEqual([56, 103, 150, 197]);
  });
});

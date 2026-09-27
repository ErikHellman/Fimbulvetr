import type * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { TerrainId } from '@content/terrain';
import type { Vec } from '@core/math/vec';
import { fishJump, openWaterCells } from '@core/world/ambient';
import { TILE } from '@core/world/dims';
import { tileFeet, type TilePos } from '@core/world/screen';
import type { TerrainGrid } from '@core/world/textmap';
import type { FrameIndex } from '@shell/gfx/frameIndex';

/** Above everything in the world (y reaches ~4900 in the interior pockets), below the fade rectangle. */
const SMOKE_DEPTH = 100_000;
const FISH_ART = 'fx_fish';
/** Sim ticks per fish-jump slot: one roll per second of play. */
const SLOT_TICKS = 60;

export interface AmbientStats {
  readonly emitters: number;
  readonly openWater: number;
  readonly fishAlive: number;
  readonly fishJumps: number;
}

export interface AmbientViewOptions {
  readonly origin: Vec;
  readonly grid: TerrainGrid;
  readonly salt: number;
  readonly frames: FrameIndex;
  readonly anims: AnimTable;
  /** Which terrains count as water when looking for open water (the ford, a jetty). */
  readonly isWater: (t: TerrainId) => boolean;
}

interface Fish {
  readonly image: Phaser.GameObjects.Image;
  readonly start: number;
  frame: string;
}

/** A screen's ambient life: smoke from every chimney and the odd fish jumping in open water. */
export class AmbientView {
  private readonly emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private readonly cells: readonly TilePos[];
  private readonly fish: Fish[] = [];
  private readonly fishTicks: number;
  private lastSlot = -1;
  private lastTick = 0;
  private jumps = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly o: AmbientViewOptions,
  ) {
    this.cells = openWaterCells(o.grid, o.isWater);
    const def = o.anims[FISH_ART]?.['idle'];
    this.fishTicks = def === undefined ? 0 : Math.ceil((def.frames * 60) / def.fps);
    this.addSmoke();
  }

  /** Advances to sim tick `t`: rolls for a fish once per slot and steps the fish already in the air. */
  tick(t: number): void {
    this.lastTick = t;
    const slot = Math.floor(t / SLOT_TICKS);
    if (slot !== this.lastSlot) {
      this.lastSlot = slot;
      const i = fishJump(this.o.salt, slot, this.cells.length);
      if (i !== null) this.jump(i);
    }
    for (let k = this.fish.length - 1; k >= 0; k--) {
      const f = this.fish[k];
      if (f === undefined) continue;
      const age = t - f.start;
      if (age >= this.fishTicks) {
        f.image.destroy();
        this.fish.splice(k, 1);
        continue;
      }
      const frame = frameFor(this.o.anims, FISH_ART, 'idle', 's', age);
      if (frame === f.frame) continue;
      const ref = this.o.frames.get(frame);
      f.image.setTexture(ref.key, ref.frame).setOrigin(ref.ox, ref.oy);
      f.frame = frame;
    }
  }

  /** Starts a fish jump in open-water cell `i` now (dev tools call it with the default). */
  jump(i = 0): void {
    const cell = this.cells[i];
    if (cell === undefined) return;
    const feet = tileFeet(cell);
    const x = this.o.origin.x + feet.x;
    const y = this.o.origin.y + feet.y;
    const frame = frameFor(this.o.anims, FISH_ART, 'idle', 's', 0);
    const ref = this.o.frames.get(frame);
    const image = this.scene.add.image(x, y, ref.key, ref.frame).setOrigin(ref.ox, ref.oy).setDepth(y);
    this.fish.push({ image, start: this.lastTick, frame });
    this.jumps++;
  }

  stats(): AmbientStats {
    return {
      emitters: this.emitters.length,
      openWater: this.cells.length,
      fishAlive: this.fish.length,
      fishJumps: this.jumps,
    };
  }

  /** The pause menu freezes the smoke in the air. */
  setPaused(paused: boolean): void {
    for (const e of this.emitters) e.active = !paused;
  }

  destroy(): void {
    for (const e of this.emitters) e.destroy();
    for (const f of this.fish) f.image.destroy();
    this.fish.length = 0;
  }

  /**
   * One slow grey emitter at the top of every chimney stack and on every charcoal kiln's vent (the middle
   * of its top row), already smoking when the screen appears.
   */
  private addSmoke(): void {
    const { o } = this;
    const refs = [0, 1, 2].map((i) => o.frames.get(`fx_smoke_idle_s_${i}`));
    const first = refs[0];
    if (first === undefined) return;
    // An emitter draws frames from one texture, so every puff must share the first frame's page.
    const names = refs.filter((r) => r.key === first.key).map((r) => r.frame);
    if (names.length !== refs.length) console.error('[art] smoke frames span texture pages');
    for (let y = 0; y < o.grid.rows; y++) {
      for (let x = 0; x < o.grid.cols; x++) {
        const at = (dx: number, dy: number): string | undefined =>
          o.grid.cells[(y + dy) * o.grid.cols + x + dx];
        const vent =
          at(0, 0) === 'kiln' && at(0, -1) !== 'kiln' && at(-1, 0) === 'kiln' && at(1, 0) === 'kiln';
        if (at(0, 0) !== 'chimney' && !vent) continue;
        const emitter = this.scene.add
          .particles(o.origin.x + x * TILE + TILE / 2, o.origin.y + y * TILE + (vent ? 4 : 2), first.key, {
            frame: names,
            frequency: 400,
            quantity: 1,
            lifespan: 2400,
            x: { min: -1, max: 1 },
            speedX: { min: 2, max: 5 },
            speedY: { min: -14, max: -8 },
            alpha: { start: 0.7, end: 0 },
            maxAliveParticles: 8,
            advance: 2400,
          })
          .setDepth(SMOKE_DEPTH);
        this.emitters.push(emitter);
      }
    }
  }
}

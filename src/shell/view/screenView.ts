import type * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { TileAnim } from '@art/tiles/tileset';
import { add, type Vec } from '@core/math/vec';
import { decorFeet, type DecorPlacement } from '@core/world/decor';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { TILESET_KEY } from '@shell/gfx/textures';
import { animateTiles } from '@shell/gfx/tileAnims';
import { overlapsRect, type Bounds } from './bounds';

/** How far decor fades when it stands between the camera and the hero. */
const BEHIND_ALPHA = 0.6;
/** The contact shadow frame is 24 px wide; a decor block's shadow spans its footprint plus a little. */
const CONTACT_W = 24;
const CONTACT_PAD = 6;
const CONTACT_ALPHA = 0.55;

export interface DecorItem extends DecorPlacement {
  readonly art: string;
}

export interface ScreenViewOptions {
  readonly origin: Vec;
  readonly indices: readonly number[];
  readonly cover: readonly number[];
  /** The shade overlay per cell (-1 for none): where raised ground throws shade on flat ground. */
  readonly shade: readonly number[];
  /** The fringe overlay per cell (-1 for none): soft ground spilling over harder ground next to it. */
  readonly fringe: readonly number[];
  readonly tileAnims: readonly TileAnim[];
  readonly decor: readonly DecorItem[];
  readonly frames: FrameIndex;
  readonly anims: AnimTable;
}

export interface ScreenViewStats {
  readonly decor: number;
  readonly animatedDecor: number;
  readonly animatedTiles: number;
}

interface DecorSprite {
  readonly image: Phaser.GameObjects.Image;
  readonly art: string;
  readonly animated: boolean;
  frame: string;
}

function rowsOf(indices: readonly number[]): number[][] {
  const rows: number[][] = [];
  for (let y = 0; y < SCREEN_ROWS; y++) rows.push(indices.slice(y * SCREEN_COLS, (y + 1) * SCREEN_COLS));
  return rows;
}

/**
 * One screen as drawn: the ground layer (with animated water), the fringe and ground-cover layers above it, and one
 * y-sorted sprite per decor block (trees, the well, furniture).
 */
export class ScreenView {
  private readonly map: Phaser.Tilemaps.Tilemap;
  private readonly tileset: Phaser.Tilemaps.Tileset;
  private readonly ground: Phaser.Tilemaps.TilemapLayer;
  private readonly cover: Phaser.Tilemaps.TilemapLayer;
  private readonly shade: Phaser.Tilemaps.TilemapLayer;
  private readonly fringe: Phaser.Tilemaps.TilemapLayer;
  private readonly decor: DecorSprite[] = [];
  private readonly shadows: Phaser.GameObjects.Image[] = [];
  private readonly animatedTiles: number;
  private readonly frames: FrameIndex;
  private readonly anims: AnimTable;

  constructor(scene: Phaser.Scene, o: ScreenViewOptions) {
    this.frames = o.frames;
    this.anims = o.anims;
    this.map = scene.make.tilemap({
      width: SCREEN_COLS,
      height: SCREEN_ROWS,
      tileWidth: TILE,
      tileHeight: TILE,
    });
    const tileset = this.map.addTilesetImage('tiles', TILESET_KEY, TILE, TILE, 1, 2);
    if (tileset === null) throw new Error('tileset texture missing');
    this.animatedTiles = animateTiles(tileset, o.tileAnims);
    const ground = this.map.createBlankLayer('ground', tileset, o.origin.x, o.origin.y);
    const coverLayer = this.map.createBlankLayer('cover', tileset, o.origin.x, o.origin.y);
    const shadeLayer = this.map.createBlankLayer('shade', tileset, o.origin.x, o.origin.y);
    const fringeLayer = this.map.createBlankLayer('fringe', tileset, o.origin.x, o.origin.y);
    if (ground === null || coverLayer === null || shadeLayer === null || fringeLayer === null)
      throw new Error('could not create the tile layers');
    ground.putTilesAt(rowsOf(o.indices), 0, 0);
    ground.setDepth(-2);
    fringeLayer.putTilesAt(rowsOf(o.fringe), 0, 0);
    fringeLayer.setDepth(-1.75);
    coverLayer.setDepth(-1);
    shadeLayer.putTilesAt(rowsOf(o.shade), 0, 0);
    shadeLayer.setDepth(-0.5);
    this.tileset = tileset;
    this.ground = ground;
    this.cover = coverLayer;
    this.shade = shadeLayer;
    this.fringe = fringeLayer;
    this.setCover(o.cover);
    const contact = o.frames.get('fx_contact_idle_s_0');
    for (const item of o.decor) {
      const feet = add(o.origin, decorFeet(item));
      const frame = frameFor(o.anims, item.art, 'idle', 's', 0);
      const ref = o.frames.get(frame);
      // A soft shadow on the ground under the block, just above the shade overlay.
      this.shadows.push(
        scene.add
          .image(feet.x, feet.y, contact.key, contact.frame)
          .setOrigin(contact.ox, contact.oy)
          .setScale((item.w * TILE + CONTACT_PAD) / CONTACT_W, 1)
          .setAlpha(CONTACT_ALPHA)
          .setDepth(feet.y - 0.3),
      );
      // A hair behind the row's entities, so whoever stands on the same row draws in front.
      const image = scene.add
        .image(feet.x, feet.y, ref.key, ref.frame)
        .setOrigin(ref.ox, ref.oy)
        .setDepth(feet.y - 0.25);
      const animated = (o.anims[item.art]?.['idle']?.frames ?? 1) > 1;
      this.decor.push({ image, art: item.art, animated, frame });
    }
  }

  /** The tile index drawn at a cell right now: animated water cycles through its frames. Dev tools only. */
  /** The cover layer's tile at a cell (ground cover or the water level's overlay), or -1 when bare. */
  coverTile(x: number, y: number): number {
    return this.cover.getTileAt(x, y, true).index;
  }

  displayedTile(x: number, y: number): number {
    const tile = this.ground.getTileAt(x, y, true);
    // Phaser 4.2.1 has getAnimatedTileId (the renderer uses it) but the typings omit it.
    const tileset = this.tileset as unknown as {
      getAnimatedTileId(index: number, ms: number): number | null;
    };
    return tileset.getAnimatedTileId(tile.index, this.ground.timeElapsed) ?? -1;
  }

  /** Redraws the cover layer; -1 leaves a cell empty. */
  setCover(indices: readonly number[]): void {
    this.cover.putTilesAt(rowsOf(indices), 0, 0);
  }

  /** Advances animated decor to sim tick `t` (so pausing the sim freezes it). */
  tick(t: number): void {
    for (const d of this.decor) {
      if (!d.animated) continue;
      const frame = frameFor(this.anims, d.art, 'idle', 's', t);
      if (frame === d.frame) continue;
      const ref = this.frames.get(frame);
      d.image.setTexture(ref.key, ref.frame).setOrigin(ref.ox, ref.oy);
      d.frame = frame;
    }
  }

  /** Fades any decor that covers the hero's body from in front, so the hero never vanishes behind a canopy. */
  fadeBehind(hero: Bounds | null): void {
    for (const d of this.decor) {
      const img = d.image;
      const behind =
        hero !== null &&
        img.depth > hero.depth &&
        overlapsRect(img.x - img.displayOriginX, img.y - img.displayOriginY, img.width, img.height, hero);
      img.setAlpha(behind ? BEHIND_ALPHA : 1);
    }
  }

  stats(): ScreenViewStats {
    return {
      decor: this.decor.length,
      animatedDecor: this.decor.filter((d) => d.animated).length,
      animatedTiles: this.animatedTiles,
    };
  }

  /** The pause menu stops the water flowing (tile animations run on their own clock). */
  setPaused(paused: boolean): void {
    this.ground.setTimerPaused(paused);
    this.cover.setTimerPaused(paused);
    this.shade.setTimerPaused(paused);
    this.fringe.setTimerPaused(paused);
  }

  destroy(): void {
    for (const d of this.decor) d.image.destroy();
    for (const s of this.shadows) s.destroy();
    this.map.destroy();
  }
}

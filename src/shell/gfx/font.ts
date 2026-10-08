import * as Phaser from 'phaser';
import { FONT_SIZES, type FontSize, fontHeight, glyphsAt, lineHeight } from '@art/font';

export const FONT_KEY = 'fimbul';
const COLS = 16;

/** The bitmap font drawn at a size (the normal one is `FONT_KEY`). */
export const fontKey = (size: FontSize): string => (size === 'normal' ? FONT_KEY : `${FONT_KEY}_${size}`);

/** Registers the font at every drawn size. */
export function registerFont(scene: Phaser.Scene): void {
  for (const size of FONT_SIZES) registerFontAt(scene, size);
}

/**
 * Packs the code-drawn glyphs at one size into one canvas texture and registers it as a bitmap font. The
 * metrics go through a generated BMFont XML document and Phaser's own parser, so UVs match whatever a
 * loaded font would get.
 */
function registerFontAt(scene: Phaser.Scene, size: FontSize): void {
  const key = fontKey(size);
  const height = fontHeight(size);
  const line = lineHeight(size);
  const all = glyphsAt(size);
  const cellW = Math.max(...all.map((g) => g.raster.w)) + 1;
  const cellH = height + 1;
  const page = document.createElement('canvas');
  page.width = COLS * cellW;
  page.height = Math.ceil(all.length / COLS) * cellH;
  const ctx = page.getContext('2d');
  if (ctx === null) throw new Error('2D canvas unavailable');
  const chars: string[] = [];
  all.forEach((g, i) => {
    const x = (i % COLS) * cellW;
    const y = Math.floor(i / COLS) * cellH;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(g.raster.data), g.raster.w, g.raster.h), x, y);
    const w = g.ch === ' ' ? 0 : g.raster.w;
    chars.push(
      `<char id="${String(g.ch.charCodeAt(0))}" x="${String(x)}" y="${String(y)}" width="${String(w)}" height="${String(height)}" xoffset="0" yoffset="0" xadvance="${String(g.advance)}"/>`,
    );
  });
  const texture = scene.textures.addCanvas(key, page);
  if (texture === null) throw new Error('could not add the font texture');
  const xml = new DOMParser().parseFromString(
    `<font><info face="${key}" size="${String(height)}"/><common lineHeight="${String(line)}"/><chars>${chars.join('')}</chars></font>`,
    'text/xml',
  );
  // The typings omit the texture argument the file loader passes (it adds a frame per glyph).
  const parse = Phaser.GameObjects.BitmapText.ParseXMLBitmapFont.bind(null) as unknown as (
    xml: Document,
    frame: Phaser.Textures.Frame,
    xSpacing: number,
    ySpacing: number,
    texture: Phaser.Textures.Texture,
  ) => Phaser.Types.GameObjects.BitmapText.BitmapFontData;
  const data = parse(xml, texture.get(), 0, 0, texture);
  scene.cache.bitmapFont.add(key, { data, texture: key, frame: null });
}

import type { NpcId } from '@content/ids';
import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** How a placeholder person looks: colours plus a few part choices. */
export interface Look {
  readonly skin: string;
  readonly hair: string;
  readonly hairStyle: 'short' | 'long' | 'braid' | 'bald' | 'kerchief';
  /** Kerchief or hood colour for `kerchief`. */
  readonly scarf?: string;
  readonly beard?: string;
  readonly top: string;
  readonly legs: 'pants' | 'skirt';
  readonly bottom: string;
  readonly apron?: string;
  readonly child?: boolean;
}

const SKIN = C.skin;
const TAN = '#c98f6a';

/** Everyone in Askdalr. Real art replaces these frames by name (`npc_<id>_<anim>_<dir>_<n>`). */
export const LOOKS: Readonly<Record<NpcId, Look>> = {
  halvar: {
    skin: TAN,
    hair: '#8a8580',
    hairStyle: 'short',
    beard: '#a39d96',
    top: '#7a5a3a',
    legs: 'pants',
    bottom: '#4b4940',
  },
  embla: {
    skin: SKIN,
    hair: '#b0522d',
    hairStyle: 'braid',
    top: '#4f8a5b',
    legs: 'skirt',
    bottom: '#3d6e48',
  },
  gyda: {
    skin: SKIN,
    hair: '#c9c4bb',
    hairStyle: 'kerchief',
    scarf: '#3f5f8f',
    top: '#e6dcc4',
    legs: 'skirt',
    bottom: '#cfc2a3',
  },
  sigrun: {
    skin: SKIN,
    hair: '#e2c46e',
    hairStyle: 'braid',
    top: '#b0453a',
    legs: 'skirt',
    bottom: '#8f3730',
    apron: '#e8dfc8',
  },
  grimr: {
    skin: TAN,
    hair: '#2b2622',
    hairStyle: 'bald',
    beard: '#2b2622',
    top: '#5a5f66',
    legs: 'pants',
    bottom: '#3b3d42',
  },
  asa: {
    skin: SKIN,
    hair: '#efece6',
    hairStyle: 'kerchief',
    scarf: '#d8d2c4',
    top: '#6d4f86',
    legs: 'skirt',
    bottom: '#57406b',
  },
  bjarni: {
    skin: TAN,
    hair: '#b85c2e',
    hairStyle: 'short',
    beard: '#b85c2e',
    top: '#3f6c9c',
    legs: 'pants',
    bottom: '#5d5a52',
  },
  ulf: {
    skin: SKIN,
    hair: '#e8d27a',
    hairStyle: 'short',
    top: '#6aa84f',
    legs: 'pants',
    bottom: '#6d6a5f',
    child: true,
  },
  tofa: {
    skin: SKIN,
    hair: '#7a4a2a',
    hairStyle: 'braid',
    top: '#d8b85a',
    legs: 'skirt',
    bottom: '#b89a42',
    child: true,
  },
  oddr: {
    skin: SKIN,
    hair: '#3b2b22',
    hairStyle: 'short',
    top: '#4f7fbf',
    legs: 'pants',
    bottom: '#5d5a52',
    child: true,
  },
  hallbera: {
    skin: SKIN,
    hair: '#1f1a1a',
    hairStyle: 'long',
    top: '#8a5a33',
    legs: 'skirt',
    bottom: '#6b4428',
    apron: '#d9ccb0',
  },
  thorkell: {
    skin: TAN,
    hair: '#6b4a2f',
    hairStyle: 'short',
    beard: '#6b4a2f',
    top: '#b8943f',
    legs: 'pants',
    bottom: '#5e4a33',
  },
  rannveig: {
    skin: SKIN,
    hair: '#c4462d',
    hairStyle: 'long',
    top: '#2f8a86',
    legs: 'skirt',
    bottom: '#256d6a',
  },
};

type Side = 's' | 'n' | 'w';
const SIZE = 32;
const INK = hex(C.ink);

/** A darker shade of a colour for the cel shadow side. */
function shade(colour: string, f = 0.72): Rgba {
  const [r, g, b] = hex(colour);
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f), 255];
}

function drawPerson(look: Look, side: Side, phase: number): Raster {
  const r = createRaster(SIZE, SIZE);
  const drop = look.child === true ? 5 : 0;
  const bob = phase === 1 || phase === 3 ? 1 : 0;
  const b = drop + bob;
  const top = hex(look.top);
  const topS = shade(look.top);
  const bottom = hex(look.bottom);
  const bottomS = shade(look.bottom);
  const skin = hex(look.skin);
  const skinS = shade(look.skin, 0.8);
  const hair = hex(look.hair);
  const hairS = shade(look.hair);
  const boot = hex(C.boot);

  // Legs or skirt, feet on row 29.
  const legTop = 24 + (look.child === true ? 2 : 0);
  if (look.legs === 'skirt') {
    const sway = side === 'w' ? ([0, 1, 0, -1][phase] ?? 0) : 0;
    rect(r, 10 + sway, legTop - 2, 12, 30 - legTop, bottom);
    rect(r, 18 + sway, legTop - 2, 4, 30 - legTop, bottomS);
    rect(r, 12, 28, 3, 2, boot);
    rect(r, 17, 28, 3, 2, boot);
  } else if (side === 'w') {
    const swing = [0, 1, 0, -1][phase] ?? 0;
    rect(r, 16 - swing, legTop, 3, 28 - legTop, bottomS);
    rect(r, 16 - swing, 28, 4, 2, boot);
    rect(r, 13 + swing, legTop, 3, 28 - legTop, bottom);
    rect(r, 12 + swing, 28, 4, 2, boot);
  } else {
    const liftL = phase === 1 ? 1 : 0;
    const liftR = phase === 3 ? 1 : 0;
    rect(r, 12, legTop, 3, 28 - legTop - liftL, bottom);
    rect(r, 11, 28 - liftL, 4, 2, boot);
    rect(r, 17, legTop, 3, 28 - legTop - liftR, bottomS);
    rect(r, 17, 28 - liftR, 4, 2, boot);
  }

  // Torso and arms.
  const torsoH = look.child === true ? 7 : 9;
  if (side === 'w') {
    rect(r, 11, b + 15, 10, torsoH, top);
    rect(r, 18, b + 15, 3, torsoH, topS);
    rect(r, 13, b + 16, 3, torsoH - 3, topS);
    rect(r, 13, b + 13 + torsoH, 3, 2, skin);
  } else {
    rect(r, 10, b + 15, 12, torsoH, top);
    rect(r, 19, b + 15, 3, torsoH, topS);
    rect(r, 8, b + 16, 2, torsoH - 3, top);
    rect(r, 8, b + 13 + torsoH, 2, 2, skin);
    rect(r, 22, b + 16, 2, torsoH - 3, topS);
    rect(r, 22, b + 13 + torsoH, 2, 2, skinS);
    if (look.apron !== undefined && side === 's') rect(r, 12, b + 18, 8, torsoH + 2, hex(look.apron));
  }

  // Head.
  const cx = 16;
  const cy = b + 8.5;
  const bald = look.hairStyle === 'bald';
  const scarf = look.hairStyle === 'kerchief' && look.scarf !== undefined ? hex(look.scarf) : null;
  const scarfS = look.hairStyle === 'kerchief' && look.scarf !== undefined ? shade(look.scarf) : null;
  ellipse(r, cx, cy, 6.5, 6.5, (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const capH = scarf ?? hair;
    const capS = scarfS ?? hairS;
    if (side === 'n') return bald ? skinS : dx > 2.5 ? capS : capH;
    const cap = bald
      ? dy < -4.5
      : dy < -1.5 || (side === 's' && Math.abs(dx) > 5) || (side === 'w' && dx > 0.5);
    if (cap) return dx > 3 ? capS : capH;
    return dx > 2.5 ? skinS : skin;
  });
  if (side === 's') {
    rect(r, 13, b + 9, 1, 2, INK);
    rect(r, 18, b + 9, 1, 2, INK);
  }
  if (side === 'w') rect(r, 11, b + 9, 1, 2, INK);
  if (look.beard !== undefined && side !== 'n') {
    const beard = hex(look.beard);
    if (side === 's') rect(r, 12, b + 12, 8, 4, beard);
    else rect(r, 10, b + 12, 5, 4, beard);
  }
  if (look.hairStyle === 'long') {
    if (side === 'n') rect(r, 11, b + 10, 10, 8, hair);
    else if (side === 's') {
      rect(r, 9, b + 8, 2, 9, hair);
      rect(r, 21, b + 8, 2, 9, hairS);
    } else rect(r, 17, b + 8, 4, 9, hairS);
  }
  if (look.hairStyle === 'braid') {
    if (side === 'n') rect(r, 15, b + 12, 2, 9, hair);
    else if (side === 'w') rect(r, 19, b + 12, 2, 7, hairS);
  }
  return outline(r, INK, 2);
}

const frame = (name: string, raster: Raster): SpriteFrame => ({ name, raster, ox: 16, oy: 30 });

export function peopleFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  for (const [id, look] of Object.entries(LOOKS)) {
    const add = (anim: string, side: Side, i: number, raster: Raster): void => {
      out.push(frame(`npc_${id}_${anim}_${side}_${i}`, raster));
      if (side === 'w') out.push(frame(`npc_${id}_${anim}_e_${i}`, flipX(raster)));
    };
    for (const side of ['s', 'n', 'w'] as const) {
      add('idle', side, 0, drawPerson(look, side, 0));
      for (let i = 0; i < 4; i++) add('walk', side, i, drawPerson(look, side, i));
    }
  }
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];

const PERSON_ANIMS = {
  idle: { frames: 1, fps: 1, loop: true, dirs: ALL },
  walk: { frames: 4, fps: 6, loop: true, dirs: ALL },
} satisfies Record<string, AnimDef>;

export const PEOPLE_ANIMS: Readonly<Record<string, typeof PERSON_ANIMS>> = Object.fromEntries(
  Object.keys(LOOKS).map((id) => [`npc_${id}`, PERSON_ANIMS]),
);

import type { NpcId } from '@content/ids';
import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import { ARM_SWING_LEFT, ARM_SWING_RIGHT, ARM_SWING_SIDE } from './hero';
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
  /** A cow's tail from under the skirt, seen from behind and the side (the huldra). */
  readonly tail?: string;
}

const SKIN = C.skin;
const TAN = '#c98f6a';

/**
 * Everyone in Askdalr, Myrkviðr and Uppvík. Real art replaces these frames by name
 * (`npc_<id>_<anim>_<dir>_<n>`).
 */
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
  /** The woodcutter: big, red-bearded, in a work shirt. */
  onundr: {
    skin: TAN,
    hair: '#8a4a2a',
    hairStyle: 'short',
    beard: '#9a5a32',
    top: '#8a3b2a',
    legs: 'pants',
    bottom: '#4a3b2a',
  },
  /** The huntress: dark braid, leathers. */
  dagny: {
    skin: SKIN,
    hair: '#2a2024',
    hairStyle: 'braid',
    top: '#6b5a3a',
    legs: 'pants',
    bottom: '#4a4030',
  },
  /** The charcoal-burner, soot to the elbows. */
  skeggi: {
    skin: '#b8957a',
    hair: '#6a6a6a',
    hairStyle: 'short',
    beard: '#7a7a7a',
    top: '#3f3f3f',
    legs: 'pants',
    bottom: '#2f2f2f',
    apron: '#5a4a3a',
  },
  /** An old pilgrim woman in a grey hood. */
  arnbjorg: {
    skin: SKIN,
    hair: '#d8d8d0',
    hairStyle: 'kerchief',
    scarf: '#8a8a7a',
    top: '#7a6a5a',
    legs: 'skirt',
    bottom: '#5a4a3a',
  },
  /** Uppvík. The mead-hall keeper: stout, grey-blonde braid, a green dress and a white apron. */
  thordis: {
    skin: SKIN,
    hair: '#cdb98a',
    hairStyle: 'braid',
    top: '#4a7a4a',
    legs: 'skirt',
    bottom: '#3a5f3a',
    apron: '#ece4d0',
  },
  /** The trader: sleek black hair and beard, a rich blue coat. */
  hrafnkell: {
    skin: SKIN,
    hair: '#1c1c24',
    hairStyle: 'short',
    beard: '#1c1c24',
    top: '#2f4f9a',
    legs: 'pants',
    bottom: '#3a3a48',
  },
  /** The smith: bald, sooty, a leather apron over bare arms. */
  ketill: {
    skin: TAN,
    hair: '#4a3a2a',
    hairStyle: 'bald',
    beard: '#5a3a22',
    top: '#7a6048',
    legs: 'pants',
    bottom: '#3a3028',
    apron: '#4a3422',
  },
  /** The rune-carver: long white hair, a red-brown robe. */
  solvi: {
    skin: '#d8c0a8',
    hair: '#e0ddd4',
    hairStyle: 'long',
    beard: '#d4d0c6',
    top: '#8a3a2a',
    legs: 'skirt',
    bottom: '#6a2c22',
  },
  /** The hof keeper: a white kerchief, a deep red dress. */
  gunnhildr: {
    skin: SKIN,
    hair: '#8a6a4a',
    hairStyle: 'kerchief',
    scarf: '#f0ece0',
    top: '#9a2a2a',
    legs: 'skirt',
    bottom: '#7a2222',
  },
  /** The gate warden: broad, yellow-bearded, in a mail-grey coat. */
  bersi: {
    skin: TAN,
    hair: '#c8a040',
    hairStyle: 'short',
    beard: '#d0a848',
    top: '#6a7078',
    legs: 'pants',
    bottom: '#4a4a3a',
  },
  /** The weaver: auburn hair loose, a saffron dress. */
  jorunn: {
    skin: SKIN,
    hair: '#8a3a22',
    hairStyle: 'long',
    top: '#d09a2a',
    legs: 'skirt',
    bottom: '#a07a22',
  },
  /** The fisher: weathered, a grey hood against the spray. */
  eyvindr: {
    skin: '#b88a68',
    hair: '#6a6258',
    hairStyle: 'kerchief',
    scarf: '#5a6a72',
    beard: '#7a7268',
    top: '#4a5a62',
    legs: 'pants',
    bottom: '#3a4048',
  },
  /** A town boy, fair and quick. */
  hjalti: {
    skin: SKIN,
    hair: '#f0dc9a',
    hairStyle: 'short',
    top: '#c2542a',
    legs: 'pants',
    bottom: '#5a5448',
    child: true,
  },
  /** The drinker: a drooping moustache-beard, a stained green tunic. */
  glumr: {
    skin: '#d49a82',
    hair: '#6a4a2a',
    hairStyle: 'short',
    beard: '#7a5430',
    top: '#5a6a2a',
    legs: 'pants',
    bottom: '#4a3a2a',
  },
  /** The ship's captain from the south: dark skin, black braid, a sea-blue cloak. */
  ragna: {
    skin: '#8a5a3a',
    hair: '#1a1414',
    hairStyle: 'braid',
    top: '#2a6a8a',
    legs: 'pants',
    bottom: '#3a3a3a',
  },
  /** The old huscarl: white-bearded, in faded red. */
  steinn: {
    skin: TAN,
    hair: '#c8c4bc',
    hairStyle: 'bald',
    beard: '#e0dcd4',
    top: '#7a3a3a',
    legs: 'pants',
    bottom: '#4a4038',
  },
  /** Heiðr the völva: white hair under a deep blue hood, a long mantle. */
  heidr: {
    skin: '#e0c8b0',
    hair: '#e8e4dc',
    hairStyle: 'kerchief',
    scarf: '#2a3a6a',
    top: '#34487a',
    legs: 'skirt',
    bottom: '#222e52',
  },
  /** The huldra: fair, long golden hair, a moss-green dress, and a cow's tail she cannot hide from behind. */
  huldra: {
    skin: '#f0d4bc',
    hair: '#f0cc6a',
    hairStyle: 'long',
    top: '#4f8a4a',
    legs: 'skirt',
    bottom: '#3d6e3a',
    tail: '#c8a878',
  },
  /** Kári the fisherman: old, white-bearded, in a salt-grey smock and a blue cap. */
  kari: {
    skin: '#c89a78',
    hair: '#e4e0d6',
    hairStyle: 'kerchief',
    scarf: '#3a5a8a',
    beard: '#eeeae2',
    top: '#7a8288',
    legs: 'pants',
    bottom: '#4a4a48',
  },
  /** Bárðr the ferryman: broad, black-bearded, in oiled brown leather. */
  bardr: {
    skin: TAN,
    hair: '#2a221e',
    hairStyle: 'short',
    beard: '#2a221e',
    top: '#6a4a2a',
    legs: 'pants',
    bottom: '#3e2e20',
  },
  /** Þuríðr, the miller's widow: grey braid, mourning black, a floury apron she still wears. */
  thuridr: {
    skin: '#e0c4aa',
    hair: '#a8a49c',
    hairStyle: 'braid',
    top: '#2a2630',
    legs: 'skirt',
    bottom: '#1f1c24',
    apron: '#e6e0d0',
  },
  /** Ljótr the peat-cutter: stained brown to the elbows, a sour face. */
  ljotr: {
    skin: '#b88c6a',
    hair: '#5a4630',
    hairStyle: 'short',
    beard: '#5a4630',
    top: '#5a4a34',
    legs: 'pants',
    bottom: '#3a2e20',
  },
  /** Auðr, a reed-cutter's girl: a straw-fair braid and a green dress hitched up for the wet. */
  audr: {
    skin: SKIN,
    hair: '#e8d08a',
    hairStyle: 'braid',
    top: '#5a8a4a',
    legs: 'skirt',
    bottom: '#4a6a3a',
    child: true,
  },
  /** Styrr, the old huscarl: grey braid-less hair, a grey beard to his belt, an old red tunic. */
  styrr: {
    skin: TAN,
    hair: '#b8b8b0',
    hairStyle: 'long',
    beard: '#c8c8c0',
    top: '#8a3a32',
    legs: 'pants',
    bottom: '#4a4038',
  },
  /** Hildr the shepherd: a brown hood against the wind, a sheepskin over a blue dress. */
  hildr: {
    skin: SKIN,
    hair: '#7a5a3a',
    hairStyle: 'kerchief',
    scarf: '#6b4a2f',
    top: '#d8d0bc',
    legs: 'skirt',
    bottom: '#4a5a8a',
  },
  /** Geirmundr the grave-robber: black-haired, sly, in a dirty green cloak with earth on his knees. */
  geirmundr: {
    skin: '#d8b090',
    hair: '#2a2420',
    hairStyle: 'short',
    beard: '#2a2420',
    top: '#4a5a34',
    legs: 'pants',
    bottom: '#5a4630',
  },
  /** Hallsteinn, warden of the pass: a big man in grey wool, a wolfskin over his shoulders. */
  hallsteinn: {
    skin: TAN,
    hair: '#8a7a5a',
    hairStyle: 'short',
    beard: '#8a7a5a',
    top: '#6a6a6a',
    legs: 'pants',
    bottom: '#3a3a3a',
    apron: '#8a8070',
  },
  /** A thrall bled almost to nothing at the drained camp: grey-white skin, rags, a chain at the ankle. */
  thrall: {
    skin: '#b8beb6',
    hair: '#6a6a62',
    hairStyle: 'long',
    beard: '#7a7a70',
    top: '#5a564a',
    legs: 'pants',
    bottom: '#45423a',
  },
  /** Bragi, the wandering skald: weathered, grey-bearded, a blue cloak and a harp-bag on his back. */
  bragi: {
    skin: TAN,
    hair: '#9a9a90',
    hairStyle: 'long',
    beard: '#9a9a90',
    top: '#2e4a6a',
    legs: 'pants',
    bottom: '#4a3a2a',
    apron: '#6a4a2a',
  },
  /** Hrafn the seal-hunter: wind-burnt, black-haired, in sealskin and oiled leather. */
  hrafn: {
    skin: TAN,
    hair: '#1f1c1a',
    hairStyle: 'short',
    beard: '#1f1c1a',
    top: '#5a5048',
    legs: 'pants',
    bottom: '#3a332c',
  },
  /** A seiðmaðr: pale, black-bearded, hooded, in a long dark robe. */
  kolbeinn: {
    skin: '#d8c8b8',
    hair: '#1f1a24',
    hairStyle: 'kerchief',
    scarf: '#2c2338',
    beard: '#1f1a24',
    top: '#3a2e4a',
    legs: 'skirt',
    bottom: '#2c2338',
  },
};

export type Side = 's' | 'n' | 'w';
const SIZE = 32;

/** Extra pose options for people-shaped sprites (draugr, Kolbeinn's cutscene poses). */
export interface PersonPose {
  /** `up`: both arms raised above the head; `forward`: reaching out in front. */
  readonly arms?: 'down' | 'up' | 'forward';
  /** Rows sunk into the ground (rising from a grave); the sunk part is cut off. */
  readonly sink?: number;
  /** Eye colour instead of ink (the dead have pale, glowing eyes). */
  readonly eyes?: string;
}
const INK = hex(C.ink);

/** A darker shade of a colour for the cel shadow side. */
function shade(colour: string, f = 0.72): Rgba {
  const [r, g, b] = hex(colour);
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f), 255];
}

export function drawPerson(look: Look, side: Side, phase: number, pose: PersonPose = {}): Raster {
  const r = createRaster(SIZE, SIZE);
  const arms = pose.arms ?? 'down';
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
  if (arms !== 'down') {
    rect(r, side === 'w' ? 11 : 10, b + 15, side === 'w' ? 10 : 12, torsoH, top);
    rect(r, side === 'w' ? 18 : 19, b + 15, 3, torsoH, topS);
  } else if (side === 'w') {
    const swing = ARM_SWING_SIDE[phase] ?? 0;
    rect(r, 11, b + 15, 10, torsoH, top);
    rect(r, 18, b + 15, 3, torsoH, topS);
    rect(r, 13 + swing, b + 16, 3, torsoH - 3, topS);
    rect(r, 13 + swing, b + 13 + torsoH, 3, 2, skin);
  } else {
    const dl = ARM_SWING_LEFT[phase] ?? 0;
    const dr = ARM_SWING_RIGHT[phase] ?? 0;
    rect(r, 10, b + 15, 12, torsoH, top);
    rect(r, 19, b + 15, 3, torsoH, topS);
    rect(r, 8, b + 16 + dl, 2, torsoH - 3, top);
    rect(r, 8, b + 13 + torsoH + dl, 2, 2, skin);
    rect(r, 22, b + 16 + dr, 2, torsoH - 3, topS);
    rect(r, 22, b + 13 + torsoH + dr, 2, 2, skinS);
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
  const eye = pose.eyes === undefined ? INK : hex(pose.eyes);
  if (side === 's') {
    rect(r, 13, b + 9, 1, 2, eye);
    rect(r, 18, b + 9, 1, 2, eye);
  }
  if (side === 'w') rect(r, 11, b + 9, 1, 2, eye);
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
  if (arms === 'up') {
    // Both arms raised over the head, hands at the top.
    if (side === 'w') {
      rect(r, 13, b + 4, 3, 12, topS);
      rect(r, 13, b + 2, 3, 2, skin);
    } else {
      rect(r, 8, b + 4, 2, 12, top);
      rect(r, 22, b + 4, 2, 12, topS);
      rect(r, 8, b + 2, 2, 2, skin);
      rect(r, 22, b + 2, 2, 2, skinS);
    }
  } else if (arms === 'forward') {
    // Reaching out: toward the viewer (hands low and wide), or ahead to the west.
    if (side === 'w') {
      rect(r, 6, b + 17, 9, 3, topS);
      rect(r, 4, b + 17, 2, 3, skin);
    } else if (side === 's') {
      rect(r, 7, b + 18, 3, 8, top);
      rect(r, 22, b + 18, 3, 8, topS);
      rect(r, 7, b + 26, 3, 2, skin);
      rect(r, 22, b + 26, 3, 2, skinS);
    }
  }
  if (look.tail !== undefined && side !== 's') {
    // Hanging from under the hem at the back, with a dark tuft at its end.
    const tail = hex(look.tail);
    const tuft = shade(look.tail, 0.55);
    if (side === 'n') {
      rect(r, 15, 20, 2, 6, tail);
      rect(r, 16, 25, 2, 2, tail);
      rect(r, 15, 27, 4, 3, tuft);
      rect(r, 17, 21, 1, 4, shade(look.tail, 0.8));
    } else {
      rect(r, 22, 21, 2, 1, tail);
      rect(r, 23, 22, 1, 5, tail);
      rect(r, 22, 27, 3, 2, tuft);
    }
  }
  const sink = pose.sink ?? 0;
  if (sink > 0) {
    // Shift the figure down into the ground and cut off what is below it.
    const sunk = createRaster(SIZE, SIZE);
    for (let y = 0; y + sink < 30; y++)
      for (let x = 0; x < SIZE; x++) {
        const i = (y * SIZE + x) * 4;
        const j = ((y + sink) * SIZE + x) * 4;
        for (let k = 0; k < 4; k++) sunk.data[j + k] = r.data[i + k] ?? 0;
      }
    return outline(sunk, INK, 2);
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

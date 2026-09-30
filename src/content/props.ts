import type { PropDef } from '@core/actors/prop';
import type { PropId } from './ids';

const SMALL = { x: -6, y: -8, w: 12, h: 8 };
const SMALL_HURT = { x: -7, y: -14, w: 14, h: 14 };
const LARGE = { x: -7, y: -10, w: 14, h: 10 };
const LARGE_HURT = { x: -8, y: -16, w: 16, h: 16 };
/** Exactly one tile. */
const TILE_BOX = { x: -8, y: -14, w: 16, h: 16 };

export const PROP_DEFS = {
  pot: {
    id: 'pot',
    art: 'prop_pot',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 4,
    blast: true,
  },
  stone: {
    id: 'stone',
    art: 'prop_stone',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 4,
    blast: true,
  },
  rock: {
    id: 'rock',
    art: 'prop_rock',
    body: LARGE,
    hurt: LARGE_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 6,
    blast: true,
  },
  pail: {
    id: 'pail',
    art: 'prop_pail',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: false,
    throwDamage: 2,
  },
  log_small: {
    id: 'log_small',
    art: 'prop_log_small',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: false,
    fragile: false,
    breakBy: 'sword',
    throwDamage: 0,
  },
  log_big: {
    id: 'log_big',
    art: 'prop_log_big',
    body: LARGE,
    hurt: LARGE_HURT,
    liftable: false,
    fragile: false,
    breakBy: 'spin',
    throwDamage: 0,
  },
  /** A knot of root in Rótarhellir: pushed, it slides a tile. */
  root_block: {
    id: 'root_block',
    art: 'prop_root_block',
    body: TILE_BOX,
    hurt: TILE_BOX,
    liftable: false,
    fragile: false,
    throwDamage: 0,
    wall: true,
    pushable: true,
  },
  /** A curtain of vines across a passage; any swing cuts it. */
  vines: {
    id: 'vines',
    art: 'prop_vines',
    body: TILE_BOX,
    hurt: TILE_BOX,
    liftable: false,
    fragile: false,
    breakBy: 'sword',
    throwDamage: 0,
    wall: true,
  },
  /** A troll the sunrise caught: heavy grey stone, and whatever it had in its fists spills when it breaks. */
  troll_stone: {
    id: 'troll_stone',
    art: 'prop_troll_stone',
    body: { x: -11, y: -12, w: 22, h: 12 },
    hurt: { x: -12, y: -30, w: 24, h: 30 },
    liftable: true,
    fragile: true,
    throwDamage: 8,
    loot: ['silver', 'silver', 'silver', 'silver', 'silver', 'heart'],
  },
  /** A thicket of thorns across a way: the blade only tangles in it; fire burns it off. */
  bramble: {
    id: 'bramble',
    art: 'prop_bramble',
    body: TILE_BOX,
    hurt: TILE_BOX,
    liftable: false,
    fragile: false,
    throwDamage: 0,
    wall: true,
    burns: true,
  },
  /** A lit bomb: set down, lifted and thrown like a pail, until its fuse burns out (systems/bombs.ts). */
  bomb: {
    id: 'bomb',
    art: 'prop_bomb',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: false,
    throwDamage: 0,
    fuse: 96,
  },
  /** A stoppered pot of bombs: breaks like a pot, in a blast too, and spills a bundle once bombs are owned. */
  bomb_pot: {
    id: 'bomb_pot',
    art: 'prop_bomb_pot',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 4,
    blast: true,
    loot: ['bombs'],
  },
  /** A pot stuffed with old arrows: breaks to a blade, and spills a bundle once the bow is owned. */
  arrow_pot: {
    id: 'arrow_pot',
    art: 'prop_arrow_pot',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: true,
    breakBy: 'sword',
    throwDamage: 4,
    blast: true,
    loot: ['arrows'],
  },
} as const satisfies Record<PropId, PropDef>;

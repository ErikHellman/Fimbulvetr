import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** Heiðr across her brewing table: a word, then the brews. */
const shopHeidr: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'heidr', with: 'heidr' },
    { k: 'shop', id: 'heidr' },
  ],
};

/** Scripts of the deep wood: the fen, the glade and the troll wood. */
export const DEEPWOOD_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  shop_heidr: shopHeidr,
};

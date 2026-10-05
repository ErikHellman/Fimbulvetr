import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** Over the chasm: Ask has come into the dwarf country. */
const dvgArrive: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_dvg_reached', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Past the chasm the mountain is hollow. Smoke leaks from the cliffs, the ground is warm underfoot, and somewhere deep inside it something is beating iron.',
        sv: 'Bortom klyftan är berget ihåligt. Rök sipprar ur klipporna, marken är varm under fötterna, och någonstans djupt därinne slår något på järn.',
      },
    },
  ],
};

/** Dvergagröf (M8): the way in, and what happens there. */
export const DVERGAGROF_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  dvg_arrive: dvgArrive,
};

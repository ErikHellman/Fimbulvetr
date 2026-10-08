import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** Out of the gorge: Ask has come into Niflmýrr. */
const nifArrive: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_niflmyrr_reached', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The gorge opens and the cold goes grey. Fog lies on the marsh like wool, and nothing in it moves. Niflmýrr, where the dead do not lie still.',
        sv: 'Klyftan öppnar sig och kylan blir grå. Dimman ligger på myren som ull, och ingenting i den rör sig. Niflmýrr, där de döda inte ligger stilla.',
      },
    },
  ],
};

/** Niflmýrr (M6): the way in, and what happens there. */
export const NIFLMYRR_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  nif_arrive: nifArrive,
};

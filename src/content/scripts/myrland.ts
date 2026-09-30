import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** Over the weir's bridge for the first time. */
const mylArrive: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_myrland_reached', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The air smells of peat and slow water. Reeds hiss in the wind. Mýrland.',
        sv: 'Luften luktar torv och långsamt vatten. Vassen väser i vinden. Mýrland.',
      },
    },
  ],
};

/** The end of Kári's jetty: fish with his rod once he has lent it. Every catch is counted. */
const fishJetty: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: { k: 'flag', id: 'n_kari_met' },
      then: [{ k: 'fish', float: { x: 20, y: 0 }, each: [{ k: 'add', flag: 'q_fish_caught', n: 1 }] }],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'A rod lies across the end of the jetty, its line neatly wound. It is somebody’s. Better ask first.',
            sv: 'Ett spö ligger tvärs över bryggans ände, linan prydligt upplindad. Det är någons. Bäst att fråga först.',
          },
        },
      ],
    },
  ],
};

/** Þuríðr's spare bed: health back, and the save slots. */
const widowRest: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'thuridr',
      text: {
        en: 'Lie down, lie down. The bed was my son’s. He would not mind; he never minded anything.',
        sv: 'Lägg dig, lägg dig. Sängen var min sons. Han skulle inte ha något emot det; han hade aldrig något emot något.',
      },
    },
    { k: 'do', effects: [{ k: 'heal', n: 0 }] },
    { k: 'save' },
  ],
};

/** Scripts of Mýrland. */
export const MYRLAND_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  myl_arrive: mylArrive,
  fish_jetty: fishJetty,
  widow_rest: widowRest,
};

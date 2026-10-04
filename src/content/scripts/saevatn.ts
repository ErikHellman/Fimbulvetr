import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** At Bárðr's boat on `myl_ferry`: once his fare is paid (`ev_ferry`), he rows Ask to Sævatn's far landing. */
const ferryOut: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'bardr_ferry', with: 'bardr' },
    {
      k: 'if',
      when: { k: 'flag', id: 'ev_ferry' },
      then: [
        { k: 'do', effects: [{ k: 'set', flag: 'ev_ferry', value: false }] },
        { k: 'fade', out: true },
        { k: 'wait', ticks: 40 },
        { k: 'warp', screen: 'sae_landing', at: { x: 17, y: 10 }, facing: 'e' },
        { k: 'fade', out: false },
        {
          k: 'say',
          who: null,
          text: {
            en: 'The oars knock, the reeds part, and the boat noses up to a jetty on the far side. Bárðr is already pulling away again.',
            sv: 'Årorna knackar, vassen delar sig och båten lägger till vid en brygga på andra sidan. Bárðr ror redan tillbaka.',
          },
        },
      ],
    },
  ],
};

/** At the end of the far landing's jetty: Bárðr comes for Ask's wave, except over the ice. */
const ferryBack: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_pass_open' },
          { k: 'not', c: { k: 'season', is: 'winter' } },
        ],
      },
      then: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Ask waves from the end of the jetty. Before long Bárðr’s boat comes nosing out of the reeds.',
            sv: 'Ask vinkar från bryggans ände. Snart kommer Bárðrs båt glidande ut ur vassen.',
          },
        },
        { k: 'fade', out: true },
        { k: 'wait', ticks: 40 },
        { k: 'warp', screen: 'myl_ferry', at: { x: 20, y: 6 }, facing: 's' },
        { k: 'fade', out: false },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Ask waves from the end of the jetty. Nothing moves on the lake, and no boat comes.',
            sv: 'Ask vinkar från bryggans ände. Ingenting rör sig på sjön, och ingen båt kommer.',
          },
        },
      ],
    },
  ],
};

/** Sævatn (M7): Bárðr's ferry. */
export const SAEVATN_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  ferry_out: ferryOut,
  ferry_back: ferryBack,
};

import type { L10n } from '@core/i18n/t';
import type { Step, ScriptDef } from '@core/story/script';
import type { FlagId } from '../flags';
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

/** Ask lands on Holmr for the first time: Embla is waiting on the shore. */
const emblaFound: ScriptDef = { steps: [{ k: 'talk', dialogue: 'embla', with: 'embla' }] };

/** Vala's brews and Hreggviðr's ore-trade, across their tables in the Refuge's longhouse. */
const shopVala: ScriptDef = { steps: [{ k: 'shop', id: 'vala' }] };
const shopHreggvidr: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'hreggvidr', with: 'hreggvidr' },
    { k: 'shop', id: 'hreggvidr' },
  ],
};

const say = (en: string, sv: string): Step => ({ k: 'say', who: null, text: { en, sv } });

/** One line of the table per count `0…max` of an int flag, read out as "<label>: n of max". */
function tally(id: FlagId, max: number, label: L10n): Step[] {
  return Array.from({ length: max + 1 }, (_, n) => ({
    k: 'if' as const,
    when:
      n === 0
        ? { k: 'not' as const, c: { k: 'flag' as const, id, gte: 1 } }
        : { k: 'flag' as const, id, eq: n },
    then: [
      say(`${label.en}: ${String(n)} of ${String(max)}.`, `${label.sv}: ${String(n)} av ${String(max)}.`),
    ],
  }));
}

/** A line shown only once `id` is set. */
const once = (id: FlagId, en: string, sv: string): Step => ({
  k: 'if',
  when: { k: 'flag', id },
  then: [say(en, sv)],
});

/**
 * Embla's war table in the Refuge: the thanes fallen (of four) and each by name, the captives freed (of
 * eight) and each by name.
 */
const warTable: ScriptDef = {
  steps: [
    say(
      'The war table: the north drawn in charcoal on a plank, a pebble for each of the Rime King’s halls, a knot of wool for each one taken.',
      'Krigsbordet: norden ritat med kol på en planka, en sten för var och en av Rimkungens salar, en ullknut för var och en som förts bort.',
    ),
    ...tally('q_thanes', 4, { en: 'Thanes fallen', sv: 'Fallna hövdingar' }),
    once(
      'st_thane_nastrond',
      'Náströnd of Helgrind: his pebble is turned over.',
      'Náströnd i Helgrind: hans sten är vänd.',
    ),
    once(
      'st_thane_nykr',
      'Nykr of the drowned hof: his pebble is turned over.',
      'Nykr i det drunknade hovet: hans sten är vänd.',
    ),
    ...tally('q_captives', 8, { en: 'Freed', sv: 'Befriade' }),
    once(
      'st_freed_ulf',
      'Ulf, home with his sheep: his knot is untied.',
      'Ulf, hemma hos sina får: hans knut är upplöst.',
    ),
    once(
      'st_freed_tofa',
      'Tófa, home at her field: her knot is untied.',
      'Tófa, hemma vid sin åker: hennes knut är upplöst.',
    ),
  ],
};

/** Sævatn (M7): Bárðr's ferry and the Refuge. */
export const SAEVATN_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  ferry_out: ferryOut,
  ferry_back: ferryBack,
  embla_found: emblaFound,
  shop_vala: shopVala,
  shop_hreggvidr: shopHreggvidr,
  war_table: warTable,
};

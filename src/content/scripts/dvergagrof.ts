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

/** Sindri at his anvil: a word, then his forging for ore. */
const shopSindri: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'sindri', with: 'sindri' },
    { k: 'shop', id: 'sindri' },
  ],
};

/** Past the cave-in for the first time: the way into the old workings is open (`q_foreman` 2). */
const dvgMineOpen: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'q_foreman', value: 2 }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Beyond the fall the old workings run crooked into the dark. Somewhere down there the foreman’s crew is waiting. Dvalinn should hear the way is open.',
        sv: 'Bortom raset slingrar sig de gamla gångarna in i mörkret. Någonstans därnere väntar förmannens lag. Dvalinn borde få höra att vägen är öppen.',
      },
    },
  ],
};

/** Hekla fell on the way: she runs back to the mine mouth, and the escort starts again from there. */
const escortLost: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'escort', npc: null }] },
    {
      k: 'say',
      who: 'hekla',
      text: {
        en: 'I can’t, not with them on me! I am going back to the light. Find me at the mine mouth.',
        sv: 'Jag klarar det inte, inte med dem efter mig! Jag springer tillbaka mot ljuset. Möt mig vid gruvmynningen.',
      },
    },
  ],
};

/** Hekla brought to the lamp-room: the crew comes out (`q_foreman` 4). */
const escortDone: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'hekla',
      text: {
        en: 'Nýr! Náli! Up, all of you, the long-legs broke the fall! Lamps in hand, and follow me out.',
        sv: 'Nýr! Náli! Upp, allihop, långbenet har sprängt raset! Lampor i hand, och följ mig ut.',
      },
    },
    { k: 'talk', dialogue: 'nyr', with: 'nyr' },
    {
      k: 'do',
      effects: [
        { k: 'escort', npc: null },
        { k: 'set', flag: 'q_foreman', value: 4 },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'One by one the miners file out behind Hekla, their lamps bobbing up the gallery towards the camp. Dvalinn will want to see Ask.',
        sv: 'En efter en går gruvarbetarna ut bakom Hekla, med lamporna guppande uppför gången mot lägret. Dvalinn vill nog träffa Ask.',
      },
    },
  ],
};

/** The cairn on Haugar's tarn, where Embla and Ask once hid from Halvar: her second letter leads here. */
const letter2Cairn: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_letters', gte: 2 },
          { k: 'not', c: { k: 'flag', id: 'st_letter2_found' } },
        ],
      },
      then: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'The top stone of the cairn lifts, as it did when two children hid their things from Halvar. Under it, wrapped in birch bark, lies a piece of a heart.',
            sv: 'Röset översta sten går att lyfta, som den gjorde när två barn gömde sina saker för Halvar. Under den, insvept i näver, ligger en bit av ett hjärta.',
          },
        },
        {
          k: 'do',
          effects: [
            { k: 'piece', id: 'hp_hau_tarn_letter' },
            { k: 'set', flag: 'st_letter2_found', value: true },
          ],
        },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'A small cairn by the tarn, its top stone loose.',
            sv: 'Ett litet röse vid tjärnen, med lös översta sten.',
          },
        },
      ],
    },
  ],
};

/** Dvergagröf (M8): the way in, and what happens there. */
export const DVERGAGROF_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  dvg_arrive: dvgArrive,
  shop_sindri: shopSindri,
  dvg_mine_open: dvgMineOpen,
  escort_lost: escortLost,
  escort_done: escortDone,
  letter2_cairn: letter2Cairn,
};

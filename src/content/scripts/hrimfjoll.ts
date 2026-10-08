import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** Over the frost line in the ember byrnie: Ask has reached Hrímfjöll. */
const hrfArrive: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_hrf_reached', value: true }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Past the frost line the air itself bites, and the snow squeaks underfoot. The cold claws at the ember byrnie and finds no way in. Far above, a tower of ice catches the light.',
        sv: 'Bortom frostgränsen biter själva luften, och snön gnisslar under fötterna. Kylan klöser på glödbrynjan och hittar ingen väg in. Högt ovanför fångar ett torn av is ljuset.',
      },
    },
  ],
};

/** Over the frost line without warm armour: the cold warns Ask off. */
const hrfTurnedBack: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'The cold goes through wool and mail as if they were not there. A few breaths of this and Ask’s heart will freeze. Only a smith’s ember-mail could keep it out.',
        sv: 'Kylan går genom ull och brynja som om de inte fanns. Några andetag av det här och Asks hjärta fryser. Bara en smeds glödbrynja kunde hålla den ute.',
      },
    },
  ],
};

/** Embla's third letter followed to the cairn at the top of the world: the last seiðr vessel. */
const hrfLetter3: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_letters', gte: 3 },
          { k: 'not', c: { k: 'flag', id: 'st_letter3_found' } },
        ],
      },
      then: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Between the cairn’s stones, out of the wind, lies a carved box like the one in the split pine. Inside is a seiðr vessel, and a strip of birch bark: “For when you are higher than I ever climbed.”',
            sv: 'Mellan rösets stenar, i lä för vinden, ligger en snidad ask som den i den kluvna tallen. I den ligger ett seiðkärl, och en näverremsa: ”Till när du är högre upp än jag någonsin klättrade.”',
          },
        },
        {
          k: 'do',
          effects: [
            { k: 'give', item: 'seidr_upgrade' },
            { k: 'set', flag: 'st_letter3_found', value: true },
            { k: 'sfx', id: 'sfx_itemget' },
          ],
        },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'A cairn at the top of the world. The whole valley lies below it, white to the sea.',
            sv: 'Ett röse på världens tak. Hela dalen ligger nedanför, vit ända till havet.',
          },
        },
      ],
    },
  ],
};

/** Hrímturn's door, while three thanes still hold their oaths. */
const hrfSealed: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'The rime over the door is hard as iron, and it hums. Four oaths hold the King; while three still hold, the tower stays shut.',
        sv: 'Rimfrosten över dörren är hård som järn, och den surrar. Fyra eder håller Kungen; så länge tre håller förblir tornet stängt.',
      },
    },
  ],
};

/** Hrímfjöll (M9a): the frost line, the cairn and the tower's door. */
export const HRIMFJOLL_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  hrf_arrive: hrfArrive,
  hrf_turned_back: hrfTurnedBack,
  hrf_letter3: hrfLetter3,
  hrf_sealed: hrfSealed,
};

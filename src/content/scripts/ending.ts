import type { ScriptId } from '@content/ids';
import type { ScriptDef } from '@core/story/script';

/** Ask steps into the binding hall: Embla, come up behind him, takes the binding in hand (M10b). */
const d8Embla: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'The great rune in the floor is cracked right across. Under the ice something vast turns over, and the whole hall groans.',
        sv: 'Den stora runan i golvet är sprucken tvärs över. Under isen vänder sig något väldigt, och hela salen stönar.',
      },
    },
    {
      k: 'say',
      who: 'embla',
      text: {
        en: 'Ask! Wait. I followed the boat up the mountain. Father told me the words too. The binding was sworn on our blood, so our blood can hold it, for a while.',
        sv: 'Ask! Vänta. Jag följde efter båten upp på berget. Far lärde mig orden också. Bindningen svors på vårt blod, så vårt blod kan hålla den, en stund.',
      },
    },
    {
      k: 'say',
      who: 'embla',
      text: {
        en: 'I will keep a ring of it burning round you. Stay inside it, or his cold will take you. When it closes, he breathes. Hit his hand, turn his breath back on him, and strike at the rune on his heart.',
        sv: 'Jag håller en ring av den brinnande runt dig. Håll dig innanför, annars tar hans köld dig. När den sluter sig andas han. Slå mot hans hand, vänd hans andedräkt tillbaka mot honom, och hugg mot runan på hans hjärta.',
      },
    },
    { k: 'do', effects: [{ k: 'set', flag: 'st_d8_embla', value: true }] },
  ],
};

/** Hrímnir falls: the binding closes for good, and the winter breaks (M10b). Then the epilogues. */
const d8Ending: ScriptDef = {
  steps: [
    { k: 'wait', ticks: 60 },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The Rime King sinks back into the floor, and the ice closes over him like water. Embla speaks the last of the words, and the great rune heals shut from end to end.',
        sv: 'Rimkungen sjunker tillbaka ner i golvet, och isen sluter sig över honom som vatten. Embla talar de sista orden, och den stora runan läks igen från ände till ände.',
      },
    },
    {
      k: 'say',
      who: 'embla',
      text: {
        en: 'Not with Askdalr’s blood this time. With his own name. He will sleep now, and nobody will have to keep him.',
        sv: 'Inte med Askdalrs blod den här gången. Med hans eget namn. Nu sover han, och ingen behöver hålla honom.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Somewhere far above, ice cracks. Then water, running.',
        sv: 'Någonstans högt ovanför spricker is. Sedan vatten, som rinner.',
      },
    },
    { k: 'fade', out: true },
    {
      k: 'do',
      effects: [
        { k: 'setSeason', season: 'spring' },
        { k: 'setMinute', minute: 9 * 60 },
      ],
    },
    { k: 'warp', screen: 'ask_farmyard', at: { x: 20, y: 14 }, facing: 's' },
    { k: 'fade', out: false },
    { k: 'run', script: 'end_home' },
    { k: 'run', script: 'end_shore' },
    { k: 'fade', out: true },
    { k: 'credits', roll: 'end' },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_game_done', value: true },
        { k: 'setMinute', minute: 6 * 60 },
      ],
    },
    { k: 'warp', screen: 'ask_farmyard', at: { x: 20, y: 14 }, facing: 's' },
    { k: 'fade', out: false },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Spring in Askdalr. The sheep are out, the brook is loud, and the whole valley smells of wet earth.',
        sv: 'Vår i Askdalr. Fåren är ute, bäcken brusar, och hela dalen luktar våt jord.',
      },
    },
  ],
};

/** The epilogues: the valley thaws, the people home, the farm, and Kolbeinn's end. */
const endHome: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'The snow goes in a week. The brook runs brown and high, and the fields come up green under it as if they had only been waiting.',
        sv: 'Snön försvinner på en vecka. Bäcken rinner brun och hög, och åkrarna kommer fram gröna under den, som om de bara hade väntat.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Everyone taken in the raid comes home down the north road, one by one and then all at once. Hallbera opens the mead hall, and nobody sleeps for two nights.',
        sv: 'Alla som togs i räden kommer hem längs norra vägen, en och en och sedan alla på en gång. Hallbera öppnar mjödhallen, och ingen sover på två nätter.',
      },
    },
    {
      k: 'if',
      when: { k: 'flag', id: 'q_farm', gte: 2 },
      then: [
        {
          k: 'say',
          who: 'halvar',
          text: {
            en: 'A roof, a fold and a byre, all with your own hands. Your father would not know the place. Neither do I, and I live here.',
            sv: 'Ett tak, en fålla och en ladugård, allt med dina egna händer. Din far skulle inte känna igen stället. Inte jag heller, och jag bor här.',
          },
        },
      ],
      else: [
        {
          k: 'say',
          who: 'halvar',
          text: {
            en: 'The roof still lets the rain in. Well. We have the whole summer now, and a summer is a long time.',
            sv: 'Taket släpper fortfarande in regnet. Nåja. Vi har hela sommaren nu, och en sommar är lång.',
          },
        },
      ],
    },
    {
      k: 'if',
      when: { k: 'flag', id: 'st_kolbeinn_spared' },
      then: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Kolbeinn walks into Askdalr on the first warm day, with his hands empty. He works Gyða’s field all summer without being asked, and never sings a word of seiðr again.',
            sv: 'Kolbeinn går in i Askdalr den första varma dagen, med tomma händer. Han brukar Gyðas åker hela sommaren utan att någon ber honom, och sjunger aldrig mer ett ord seiðr.',
          },
        },
      ],
      else: [
        {
          k: 'say',
          who: null,
          text: {
            en: 'Nobody in Askdalr says Kolbeinn’s name again. In the autumn Gyða cuts it out of the hof’s doorpost, and burns the shavings.',
            sv: 'Ingen i Askdalr säger Kolbeinns namn igen. På hösten skär Gyða bort det ur hovets dörrstolpe och bränner spånen.',
          },
        },
      ],
    },
  ],
};

/** Embla on the shore at the first sailing weather: "Come with me?" (her `shore` node: stay or go). */
const endShore: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'At midsummer Embla’s boat lies on the shore below the farm, tarred and rigged, her sail-needle stuck through the hem of the sail.',
        sv: 'Vid midsommar ligger Emblas båt på stranden nedanför gården, tjärad och riggad, med segelnålen instucken i seglets fåll.',
      },
    },
    { k: 'talk', dialogue: 'embla' },
  ],
};

export const ENDING_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  d8_embla: d8Embla,
  d8_ending: d8Ending,
  end_home: endHome,
  end_shore: endShore,
};

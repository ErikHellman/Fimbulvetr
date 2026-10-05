import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** The first steps into Útgarðr (M10a). */
const d8Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d8_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'Everything in here was made for someone ten times my height. The doors, the steps, the cold. Three halls lead off the first one, and every one of them is carved with something I have carried this year.',
        sv: 'Allt härinne är gjort för någon tio gånger så lång som jag. Dörrarna, trappstegen, kylan. Tre salar leder ut från den första, och varenda en är ristad med något jag har burit med mig i år.',
      },
    },
  ],
};

/** A basin of meltwater in the giants' halls: Ask drinks, and is whole again, seiðr and all. */
const d8Basin: ScriptDef = {
  steps: [
    {
      k: 'do',
      effects: [
        { k: 'heal', n: 80 },
        { k: 'seidr', n: 0 },
        { k: 'sfx', id: 'sfx_drink' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'A trough for a giant’s hands, half full of meltwater. Ask drinks from it like a calf: every hurt goes quiet, and the seiðr comes back into Ask’s hands like warmth.',
        sv: 'Ett tråg för en jättes händer, halvfullt av smältvatten. Ask dricker ur det som en kalv: varje sår tystnar, och seiðr strömmar tillbaka i Asks händer som värme.',
      },
    },
  ],
};

/** Into Kolbeinn's hall: he is waiting. */
const d8Kolbeinn: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d8_kolbeinn_met', value: true }] },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'The farmhand. With the old man’s seax, still. Do you know what I was, before I knelt to the King? A thrall, in a jarl’s hall. Like you.',
        sv: 'Drängpojken. Med gubbens sax, fortfarande. Vet du vad jag var, innan jag knäböjde för Kungen? En träl, i en jarls hall. Som du.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'Your people bound a god to keep their fields. I only helped him up. Come, then. Let us see who taught you better.',
        sv: 'Ditt folk band en gud för att behålla sina åkrar. Jag hjälpte honom bara upp. Kom då. Låt oss se vem som har lärt dig bäst.',
      },
    },
  ],
};

/** Kolbeinn beaten: he kneels, and Ask spares or kills him (see the `yield` node in his dialogue). */
const d8KolbeinnYield: ScriptDef = {
  steps: [
    { k: 'wait', ticks: 40 },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The seiðr-staff breaks across Kolbeinn’s knee, and he goes down on the other one.',
        sv: 'Seidstaven brister över Kolbeinns knä, och han går ner på det andra.',
      },
    },
    { k: 'talk', dialogue: 'kolbeinn' },
    { k: 'fade', out: true },
    { k: 'wait', ticks: 30 },
    { k: 'fade', out: false },
  ],
};

export const D8_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  d8_enter: d8Enter,
  d8_basin: d8Basin,
  d8_kolbeinn: d8Kolbeinn,
  d8_kolbeinn_yield: d8KolbeinnYield,
};

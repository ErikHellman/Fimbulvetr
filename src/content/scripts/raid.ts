import type { ScriptDef } from '@core/story/script';

/** Two in the morning on the raid night; the clock stands still until it is over. */
export const RAID_MINUTE = 2 * 60;
const MORNING = 7 * 60;

/**
 * Sleeping on the third night: Ask wakes to fire under the first autumn storm and grabs the pitchfork. The
 * warp respawns the longhouse with its fires and the draugr inside.
 */
const raidBegins: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    {
      k: 'do',
      effects: [
        { k: 'setSeason', season: 'autumn' },
        { k: 'setMinute', minute: RAID_MINUTE },
        { k: 'set', flag: 'st_raid_begun', value: true },
        { k: 'weapon', id: 'pitchfork' },
        { k: 'sfx', id: 'sfx_thunder' },
      ],
    },
    {
      k: 'card',
      text: {
        en: 'Ask wakes to thunder, and to fire. The roof is burning. Outside, horns, and something howling that is not a wolf.',
        sv: 'Ask vaknar av åska, och av eld. Taket brinner. Utanför hörs horn, och något som ylar men inte är en varg.',
      },
    },
    {
      k: 'card',
      text: {
        en: 'He grabs the pitchfork by the door. Get out. Find the others.',
        sv: 'Han griper högaffeln vid dörren. Ut härifrån. Hitta de andra.',
      },
    },
    { k: 'warp', screen: 'ask_int_longhouse', at: { x: 10, y: 8 }, facing: 's' },
    { k: 'fade', out: false },
  ],
};

/**
 * At the north gate: Kolbeinn has Embla, Halvar charges him and falls. The night ends; morning finds Ask
 * back in the longhouse beside Halvar's bed.
 */
const raidGate: ScriptDef = {
  steps: [
    { k: 'face', actor: 'hero', dir: 'n' },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'So this is Askdalr. The oath-blood sleeps soundly here. Not for much longer.',
        sv: 'Så detta är Askdalr. Edsblodet sover gott här. Inte länge till.',
      },
    },
    {
      k: 'say',
      who: 'embla',
      text: { en: 'Ask! Don’t! He is not a man, he is…', sv: 'Ask! Gör det inte! Han är ingen man, han är…' },
    },
    {
      k: 'say',
      who: 'halvar',
      text: {
        en: 'Kolbeinn! Let the girl go. If it is old blood you want, take mine!',
        sv: 'Kolbeinn! Släpp flickan. Är det gammalt blod du vill ha, så ta mitt!',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'Yours, old huscarl? Thin with years. The king needs the young.',
        sv: 'Ditt, gamle huskarl? Tunt av år. Kungen behöver de unga.',
      },
    },
    { k: 'move', actor: 'halvar', to: { x: 19, y: 7 } },
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_thunder' }] },
    { k: 'wait', ticks: 20 },
    { k: 'say', who: 'kolbeinn', text: { en: 'Sleep, old wolf.', sv: 'Sov, gamla varg.' } },
    { k: 'fade', out: true },
    {
      k: 'card',
      text: {
        en: 'The trolls carry Embla and eight of the village into the storm. Halvar lies where he fell at the gate.',
        sv: 'Trollen bär ut Embla och åtta av byborna i stormen. Halvar ligger där han föll vid porten.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_raid_done', value: true },
        { k: 'sleep', until: MORNING },
        { k: 'heal', n: 0 },
      ],
    },
    { k: 'warp', screen: 'ask_int_longhouse', at: { x: 25, y: 8 }, facing: 'e' },
    {
      k: 'card',
      text: {
        en: 'Morning comes grey and cold. Halvar is alive, barely. He is asking for you.',
        sv: 'Morgonen kommer grå och kall. Halvar lever, knappt. Han frågar efter dig.',
      },
    },
    { k: 'fade', out: false },
  ],
};

export const RAID_SCRIPTS = {
  raid_begins: raidBegins,
  raid_gate: raidGate,
} as const satisfies Record<string, ScriptDef>;

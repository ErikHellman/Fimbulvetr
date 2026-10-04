import type { ScriptDef } from '@core/story/script';

/** Ask fell to one heart in Styrr's duel: he steps back, and the duel can be tried again. */
const duelLost: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: 'styrr',
      text: {
        en: 'Enough. You would be dead twice over on a real field. Breathe. Again, when you are ready.',
        sv: 'Nog. Du hade varit död två gånger om på ett riktigt slagfält. Andas. Igen, när du är redo.',
      },
    },
  ],
};

/** Ask won Styrr's duel: his last lesson, Bragð. */
const duelWon: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    {
      k: 'say',
      who: 'styrr',
      text: {
        en: 'Hah! Down, in my own yard, by a farmhand. Halvar taught you nothing; you learned it anyway.',
        sv: 'Hah! Nere, på min egen gård, av en dräng. Halvar lärde dig ingenting; du lärde dig ändå.',
      },
    },
    {
      k: 'say',
      who: 'styrr',
      text: {
        en: 'One thing is left that I can give. The jarl’s skalds called it Bragð: the blade sings, and the song cuts what the blade cannot reach.',
        sv: 'En sak finns kvar som jag kan ge. Jarlens skalder kallade det Bragð: klingan sjunger, och sången skär det som klingan inte når.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'learn', galdr: 'bragd' },
        { k: 'set', flag: 'st_bragd_learned', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ask learned Bragð. Ready it in the pause menu and sing it (the galdr button): a beam flies from the blade and pierces a shield.',
        sv: 'Ask lärde sig Bragð. Gör den redo i pausmenyn och sjung den (galdrknappen): en stråle flyger från klingan och genomborrar en sköld.',
      },
    },
    { k: 'fade', out: false },
  ],
};

/**
 * The end of Act I: the three seals flare, the door opens, the Rime King's breath pours out over the
 * lowlands and the world snaps to winter: the Fimbulvetr. Then the credits, and the gorge iced shut.
 */
const passOpen: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ask lays a hand on the great door. It is warm. One by one the three seals answer.',
        sv: 'Ask lägger handen på den stora dörren. Den är varm. En efter en svarar de tre sigillen.',
      },
    },
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_seal' }] },
    { k: 'wait', ticks: 30 },
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_seal' }] },
    { k: 'wait', ticks: 30 },
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_seal' }] },
    { k: 'wait', ticks: 30 },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_pass_open', value: true },
        { k: 'sfx', id: 'sfx_gate' },
      ],
    },
    { k: 'wait', ticks: 50 },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Stone grinds on stone, and the door stands open. Beyond it the gorge climbs north, and at its end the mountain glows from within, blue as a cold forge.',
        sv: 'Sten skaver mot sten, och dörren står öppen. Bortom den stiger klyftan mot norr, och vid dess slut glöder berget inifrån, blått som en kall smedja.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Then the mountain breathes out.',
        sv: 'Då andas berget ut.',
      },
    },
    { k: 'breath' },
    { k: 'do', effects: [{ k: 'setSeason', season: 'winter' }] },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Frost runs over the heather. The tarn locks white, and across the lowlands every field goes still under snow. Whatever the calendar said, it is winter now.',
        sv: 'Frosten rinner över ljungen. Tjärnen låser sig vit, och över hela låglandet stelnar varje åker under snö. Vad kalendern än sade är det vinter nu.',
      },
    },
    { k: 'card', text: { en: 'The Fimbulvetr.', sv: 'Fimbulvintern.' } },
    { k: 'credits' },
    {
      k: 'say',
      who: null,
      text: {
        en: 'At the gorge’s end the breath has frozen into a wall of ice. The road north is shut, for now. Askdalr will have felt this cold: home first.',
        sv: 'Vid klyftans slut har andedräkten frusit till en mur av is. Vägen norrut är stängd, för tillfället. Askdalr har känt den här kölden: hem först.',
      },
    },
  ],
};

/** Ask's first steps into the farmyard after the pass opened: Askdalr under the Fimbulvetr. */
const homeWinter: ScriptDef = {
  steps: [
    {
      k: 'say',
      who: null,
      text: {
        en: 'Askdalr lies white and still. The well has frozen to its rim, and the smoke from the longhouse rises straight up into a sky like iron.',
        sv: 'Askdalr ligger vitt och stilla. Brunnen har frusit ända upp till kanten, och röken från långhuset stiger rakt upp mot en himmel som järn.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Under the snow the burned roof still shows black. Halvar will want to hear what happened at the pass.',
        sv: 'Under snön syns det brända taket fortfarande svart. Halvar vill nog höra vad som hände vid passet.',
      },
    },
    { k: 'do', effects: [{ k: 'set', flag: 'st_home_winter', value: true }] },
  ],
};

/** Scripts of the Act I finale: the last duel, the pass, the Fimbulvetr and the homecoming. */
export const PASS_SCRIPTS: Readonly<
  Record<'duel_lost' | 'duel_won' | 'pass_open' | 'home_winter', ScriptDef>
> = {
  duel_lost: duelLost,
  duel_won: duelWon,
  pass_open: passOpen,
  home_winter: homeWinter,
};

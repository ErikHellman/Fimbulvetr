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

/** Scripts of the Act I finale: the last duel, the pass, the Fimbulvetr. */
export const PASS_SCRIPTS: Readonly<Record<'duel_lost' | 'duel_won', ScriptDef>> = {
  duel_lost: duelLost,
  duel_won: duelWon,
};

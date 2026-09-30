import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

/** Sölvi the rune-carver, among his standing stones. He teaches Ask Eldr, for a stave from Skeggi's kiln. */
export const SOLVI: DialogueDef = {
  entry: [
    { when: not(flag('n_solvi_met')), node: 'meet' },
    { when: all(flag('st_eldr_learned'), not(flag('q_rs2_mill'))), node: 'stone2' },
    { when: all(flag('st_stone2_lit'), not(flag('st_barrow_open'))), node: 'stone3' },
    { when: flag('st_eldr_learned'), node: 'after' },
    { when: { k: 'item', id: 'charred_stave' }, node: 'stave' },
    { when: flag('q_eldr_asked'), node: 'waiting' },
    { node: 'ask' },
  ],
  nodes: {
    stone3: {
      text: {
        en: 'The third stone? The verse says: under the king who would not lie down. That is Konungshaugr in Haugar. Its door opens for a watcher, not a thief.',
        sv: 'Den tredje stenen? Versen säger: under kungen som inte ville lägga sig. Det är Konungshaugr i Haugar. Dess dörr öppnas för en väktare, inte för en tjuv.',
      },
    },
    stone2: {
      text: {
        en: 'The second of the three stones? The old verse says it sleeps where water turns stone. A millstone, I think. There was a mill in Mýrland that the water took.',
        sv: 'Den andra av de tre stenarna? Den gamla versen säger att den sover där vatten vänder sten. En kvarnsten, tror jag. Det fanns en kvarn i Mýrland som vattnet tog.',
      },
    },
    meet: {
      text: {
        en: 'Mind the stones, the paint is still wet. Sölvi. I carve runes, and I listen to what they say back.',
        sv: 'Akta stenarna, färgen är inte torr än. Sölvi. Jag ristar runor, och jag lyssnar på vad de svarar.',
      },
      do: [{ k: 'set', flag: 'n_solvi_met', value: true }],
      next: 'ask',
    },
    ask: {
      text: {
        en: 'Hm. The runes have noticed you. A stone woke in the south, and you smell of it. Can you sing?',
        sv: 'Hm. Runorna har lagt märke till dig. En sten vaknade i söder, och du luktar av den. Kan du sjunga?',
      },
      next: 'ask2',
    },
    ask2: {
      text: {
        en: 'Eldr is the fire-song. I can teach it, but the lesson must be carved on a stave burnt slow in a kiln.',
        sv: 'Eldr är eldsången. Jag kan lära dig den, men lektionen måste ristas på en stav som bränts långsamt i en mila.',
      },
      next: 'ask3',
    },
    ask3: {
      text: {
        en: 'Skeggi the charcoal-burner keeps a kiln in Myrkviðr. Bring me one of his charred staves.',
        sv: 'Skeggi kolaren har en mila i Myrkviðr. Hämta en av hans förkolnade stavar åt mig.',
      },
      do: [{ k: 'set', flag: 'q_eldr_asked', value: true }],
    },
    waiting: {
      text: {
        en: 'A charred stave from Skeggi’s kiln, down in Myrkviðr. The runes are patient. I am less so.',
        sv: 'En förkolnad stav från Skeggis mila, nere i Myrkviðr. Runorna har tålamod. Det har inte jag.',
      },
    },
    stave: {
      text: {
        en: 'That smell! Burnt slow, black to the heart. Good. Hold still while I carve.',
        sv: 'Den lukten! Långsamt bränd, svart ända in. Bra. Stå still medan jag ristar.',
      },
      do: [{ k: 'take', item: 'charred_stave' }],
      next: 'stave2',
    },
    stave2: {
      text: {
        en: 'Now sing it with me. Eldr. Feel it catch in your chest, like a coal someone blew on.',
        sv: 'Sjung den nu med mig. Eldr. Känn hur den tar fyr i bröstet, som en glöd någon blåst på.',
      },
      do: [
        { k: 'learn', galdr: 'eldr' },
        { k: 'seidr', n: 0 },
        { k: 'set', flag: 'st_eldr_learned', value: true },
        { k: 'sfx', id: 'sfx_eldr' },
      ],
      next: 'stave3',
    },
    stave3: {
      text: {
        en: 'That warmth is your seiðr, the breath behind every song. Green mead fills it again, and so does a hof’s stone.',
        sv: 'Den värmen är din seiðr, andedräkten bakom varje sång. Grönt mjöd fyller på den, och så gör ett hovs sten.',
      },
      next: 'stave4',
    },
    stave4: {
      text: {
        en: 'Burn what bars your way: grass, brambles, ice. And mind the wind. It carries fire wherever it likes.',
        sv: 'Bränn det som står i vägen: gräs, snår, is. Och akta vinden. Den bär elden vart den vill.',
      },
    },
    after: {
      text: {
        en: 'Eldr answers you now. Each rune is a word the world once agreed to. Sing it true and the world remembers.',
        sv: 'Eldr svarar dig nu. Varje runa är ett ord som världen en gång gick med på. Sjung den rätt så minns världen.',
      },
    },
  },
};

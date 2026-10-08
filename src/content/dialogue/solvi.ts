import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

const HLIF = 120;
const STAVE = 40;

/** Sölvi the rune-carver, among his standing stones. He teaches Ask Eldr, for a stave from Skeggi's kiln. */
export const SOLVI: DialogueDef = {
  entry: [
    { when: not(flag('n_solvi_met')), node: 'meet' },
    { when: all(flag('st_pass_open'), not(flag('st_hlif_learned'))), node: 'hlif' },
    { when: flag('st_embla_found'), node: 'embla' },
    { when: all(flag('st_rime_open'), flag('st_hlif_learned')), node: 'staves' },
    { when: flag('st_hlif_learned'), node: 'warded' },
    { when: all(flag('st_eldr_learned'), not(flag('q_rs2_mill'))), node: 'stone2' },
    { when: all(flag('st_stone2_lit'), not(flag('st_barrow_open'))), node: 'stone3' },
    { when: flag('st_eldr_learned'), node: 'after' },
    { when: { k: 'item', id: 'charred_stave' }, node: 'stave' },
    { when: flag('q_eldr_asked'), node: 'waiting' },
    { node: 'ask' },
  ],
  nodes: {
    embla: {
      text: {
        en: "Halvar's daughter has raised a hall full of the fled and the angry, and she plans a war on the ice. Good. A war needs someone who remembers the old staves.",
        sv: 'Halvars dotter har samlat en hall full av flyktingar och arga, och hon planerar ett krig mot isen. Bra. Ett krig behöver någon som minns de gamla stavarna.',
      },
    },
    hlif: {
      text: {
        en: 'You felt it too: the cold came down like a lid. The runes went quiet all at once. All but one. Hlíf, the shelter-song. It wants to be sung now.',
        sv: 'Du kände det också: kölden föll som ett lock. Runorna tystnade på en gång. Alla utom en. Hlíf, skyddssången. Den vill sjungas nu.',
      },
      choices: [
        {
          text: {
            en: `Teach me Hlíf (${String(HLIF)} silver).`,
            sv: `Lär mig Hlíf (${String(HLIF)} silver).`,
          },
          when: { k: 'silver', gte: HLIF },
          do: [
            { k: 'silver', n: -HLIF },
            { k: 'learn', galdr: 'hlif' },
            { k: 'set', flag: 'st_hlif_learned', value: true },
            { k: 'sfx', id: 'sfx_ward' },
          ],
          next: 'hlif2',
        },
        {
          text: { en: `Hlíf (${String(HLIF)} silver)…`, sv: `Hlíf (${String(HLIF)} silver)…` },
          when: { k: 'not', c: { k: 'silver', gte: HLIF } },
          next: 'hlif_poor',
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
    hlif2: {
      text: {
        en: 'Sing it, and the runes stand round you like a ring of shields: three blows they take, whatever strikes them, and then they are spent. (Ready it in the pause menu.)',
        sv: 'Sjung den, så står runorna runt dig som en ring av sköldar: tre slag tar de, vad som än slår, och sedan är de förbrukade. (Gör den redo i pausmenyn.)',
      },
    },
    hlif_poor: {
      text: {
        en: 'The runes are free. The stone they are cut in is not, and neither is my supper.',
        sv: 'Runorna är gratis. Stenen de ristas i är det inte, och inte heller min kvällsmat.',
      },
    },
    staves: {
      text: {
        en: 'You melted the rime? Then the north is open, and it is colder than fire can mend. I have cut Ís on staves: frost for a foe, a floor on still water. One song each.',
        sv: 'Du smälte rimfrosten? Då är norr öppet, och där är det kallare än eld kan bota. Jag har ristat Ís på stavar: frost åt en fiende, ett golv på stilla vatten. En sång var.',
      },
      choices: [
        {
          text: {
            en: `An Ís stave (${String(STAVE)} silver).`,
            sv: `En Ís-stav (${String(STAVE)} silver).`,
          },
          when: all({ k: 'silver', gte: STAVE }, not({ k: 'item', id: 'stave_is', gte: 3 })),
          do: [
            { k: 'silver', n: -STAVE },
            { k: 'give', item: 'stave_is' },
            { k: 'sfx', id: 'sfx_itemget' },
          ],
          next: 'stave_sold',
        },
        {
          text: { en: `An Ís stave (${String(STAVE)} silver)…`, sv: `En Ís-stav (${String(STAVE)} silver)…` },
          when: all(not({ k: 'silver', gte: STAVE }), not({ k: 'item', id: 'stave_is', gte: 3 })),
          next: 'hlif_poor',
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
    stave_sold: {
      text: {
        en: 'Put it in your hand, not your song: it sings once, for nothing, and then it is kindling. Three is all a sane person carries.',
        sv: 'Ha den i handen, inte i sången: den sjunger en gång, gratis, och sedan är den tändved. Tre är allt en vettig människa bär.',
      },
    },
    warded: {
      text: {
        en: 'Keep Hlíf close this winter. Three blows are not many, but they are three more than the cold will give you.',
        sv: 'Håll Hlíf nära den här vintern. Tre slag är inte många, men de är tre fler än kölden ger dig.',
      },
    },
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

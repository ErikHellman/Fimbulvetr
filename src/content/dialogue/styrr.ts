import type { DialogueDef } from '@core/story/dialogue';
import { all, flag, not } from './util';

const NIGHTFALL = 22 * 60;
const DASH = 50;
const PARRY = 80;
const night = { k: 'phase', is: 'night' } as const;
const poor = (n: number) => ({ k: 'not', c: { k: 'silver', gte: n } }) as const;
const rich = (n: number) => ({ k: 'silver', gte: n }) as const;

/**
 * Styrr, the old huscarl: he carried a shield for the old jarl, beside Halvar. He teaches the dash thrust
 * and the parry for silver, and tells of the barrow-watch that opens the King's Barrow.
 */
export const STYRR: DialogueDef = {
  entry: [
    { when: not(flag('n_styrr_met')), node: 'meet' },
    { when: all(flag('t_parry'), not(flag('q_duel_asked'))), node: 'challenge' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: flag('q_duel_won'), node: 'won' },
    { when: all(flag('st_barrow_open'), not(flag('st_stone3_lit'))), node: 'opened' },
    { when: flag('st_stone3_lit'), node: 'lit' },
    { node: 'menu' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Through the rockfall, were you? With a bomb, I would wager. Nobody climbs it. Styrr. I carried a shield for the old jarl, long ago.',
        sv: 'Genom rasbranten, alltså? Med en bomb, skulle jag tro. Ingen klättrar över den. Styrr. Jag bar sköld åt den gamle jarlen, för länge sedan.',
      },
      do: [{ k: 'set', flag: 'n_styrr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'From Askdalr? Then you know Halvar. Hah. So he lived. He always had the better shield arm, and the worse temper.',
        sv: 'Från Askdalr? Då känner du Halvar. Hah. Så han lever. Han hade alltid den bättre sköldarmen, och det sämre humöret.',
      },
      next: 'barrow',
    },
    barrow: {
      text: {
        en: 'A runestone, you say. There is one in Konungshaugr, the King’s Barrow, south of the stone circle. Its door opens only to one who keeps the barrow-watch.',
        sv: 'En runsten, säger du. Det finns en i Konungshaugr, Kungens hög, söder om stencirkeln. Dess dörr öppnas bara för den som håller gravvakt.',
      },
      do: [{ k: 'set', flag: 'q_rs3_watch', value: true }],
      next: 'barrow2',
    },
    barrow2: {
      text: {
        en: 'Stand by its door at night. The dead come out to see who knocks: put them back in the ground. Three rise. They always do.',
        sv: 'Stå vid dess dörr om natten. De döda kommer ut för att se vem som knackar: lägg dem tillbaka i jorden. Tre reser sig. Det gör de alltid.',
      },
      next: 'barrow3',
    },
    barrow3: {
      text: {
        en: 'Their shields are old but sound. Strike when their blades are out, or get round them. Or pay me, and I will show you how an old huscarl does it.',
        sv: 'Deras sköldar är gamla men hela. Hugg när deras klingor är ute, eller ta dig runt dem. Eller betala mig, så visar jag hur en gammal huskarl gör.',
      },
      next: 'menu',
    },
    menu: {
      text: {
        en: 'Well? The blade does not learn itself.',
        sv: 'Nå? Klingan lär sig inte själv.',
      },
      choices: [
        {
          text: {
            en: `Teach me the dash thrust (${String(DASH)} silver).`,
            sv: `Lär mig utfallsstöten (${String(DASH)} silver).`,
          },
          when: all(not(flag('t_dash')), rich(DASH)),
          do: [
            { k: 'silver', n: -DASH },
            { k: 'set', flag: 't_dash', value: true },
          ],
          next: 'dash',
        },
        {
          text: {
            en: `The dash thrust (${String(DASH)} silver)…`,
            sv: `Utfallsstöten (${String(DASH)} silver)…`,
          },
          when: all(not(flag('t_dash')), poor(DASH)),
          next: 'poor',
        },
        {
          text: {
            en: `Teach me the parry (${String(PARRY)} silver).`,
            sv: `Lär mig pareringen (${String(PARRY)} silver).`,
          },
          when: all(flag('t_dash'), not(flag('t_parry')), rich(PARRY)),
          do: [
            { k: 'silver', n: -PARRY },
            { k: 'set', flag: 't_parry', value: true },
          ],
          next: 'parry',
        },
        {
          text: { en: `The parry (${String(PARRY)} silver)…`, sv: `Pareringen (${String(PARRY)} silver)…` },
          when: all(flag('t_dash'), not(flag('t_parry')), poor(PARRY)),
          next: 'poor',
        },
        {
          text: { en: 'Wait with me for nightfall.', sv: 'Vänta med mig tills det blir natt.' },
          when: all(flag('q_rs3_watch'), not(flag('st_barrow_open')), not(night)),
          next: 'wait',
        },
        {
          text: { en: 'I am ready for the duel.', sv: 'Jag är redo för tvekampen.' },
          when: all(flag('q_duel_asked'), not(flag('q_duel_won'))),
          do: [
            { k: 'heal', n: 0 },
            { k: 'set', flag: 'ev_duel_on', value: true },
          ],
          next: 'duel',
        },
        {
          text: { en: 'Tell me of the barrow-watch again.', sv: 'Berätta om gravvakten igen.' },
          when: not(flag('st_barrow_open')),
          next: 'barrow2',
        },
        { text: { en: 'Farewell.', sv: 'Farväl.' } },
      ],
    },
    challenge: {
      text: {
        en: 'The thrust and the parry, both. Then there is one lesson left, and I do not sell it. You win it, in my yard, against me.',
        sv: 'Stöten och pareringen, båda två. Då finns en lektion kvar, och den säljer jag inte. Den vinner du, på min gård, mot mig.',
      },
      do: [{ k: 'set', flag: 'q_duel_asked', value: true }],
      next: 'challenge2',
    },
    challenge2: {
      text: {
        en: 'Blunt edges and old bones. Nobody dies, though you may wish you had. When you can stand it, say so.',
        sv: 'Slöa eggar och gamla ben. Ingen dör, fast du kanske önskar att du hade gjort det. När du står ut med det, säg till.',
      },
      next: 'menu',
    },
    duel: {
      text: {
        en: 'Out to the yard, then. My shield does not open for a plain cut, and when I lift the blade high, meet it or be gone.',
        sv: 'Ut på gården, då. Min sköld öppnar sig inte för ett vanligt hugg, och när jag lyfter klingan högt, möt den eller var borta.',
      },
    },
    won: {
      text: {
        en: 'My shoulder will remember you all winter. Sing the blade well, and remember who taught you.',
        sv: 'Min axel kommer att minnas dig hela vintern. Sjung klingan väl, och kom ihåg vem som lärde dig.',
      },
      next: 'menu',
    },
    poor: {
      text: {
        en: 'Silver first. An old man has to eat, and I have eaten my sword’s worth twice over.',
        sv: 'Silver först. En gammal man måste äta, och jag har ätit upp mitt svärds värde två gånger om.',
      },
    },
    dash: {
      text: {
        en: 'Roll, and while you are still low, strike: all of you behind the point. It goes through a shield like a nail through bark. (Press the sword button in the middle of a roll.)',
        sv: 'Rulla, och medan du fortfarande är låg, stöt: hela du bakom udden. Den går genom en sköld som en spik genom bark. (Tryck på svärdsknappen mitt i en rullning.)',
      },
    },
    parry: {
      text: {
        en: 'Raise the shield as the blow comes, not before. Meet it, and you turn it aside and leave them standing open. Too early and it is only a shield. (Raise the shield just as a blow lands.)',
        sv: 'Lyft skölden när hugget kommer, inte förr. Möt det, så vänder du det åt sidan och lämnar dem öppna. För tidigt och det är bara en sköld. (Lyft skölden precis när ett hugg träffar.)',
      },
    },
    wait: {
      text: {
        en: 'Sit, then. We share a fire and say nothing, as huscarls do. The day burns down to embers, and the dark comes up out of the barrows. Go. They are waiting.',
        sv: 'Sätt dig, då. Vi delar en eld och säger ingenting, som huskarlar gör. Dagen brinner ner till glöd, och mörkret stiger upp ur högarna. Gå. De väntar.',
      },
      do: [{ k: 'setMinute', minute: NIGHTFALL }],
    },
    opened: {
      text: {
        en: 'I heard it from here: stone on stone. The king knows you now. Go down, and take nothing that is his.',
        sv: 'Jag hörde det härifrån: sten mot sten. Kungen känner dig nu. Gå ner, och ta inget som är hans.',
      },
      next: 'menu',
    },
    lit: {
      text: {
        en: 'Three stones burning, and a farmhand did it. Halvar would laugh. Then he would say nothing for a week.',
        sv: 'Tre stenar som brinner, och en dräng gjorde det. Halvar skulle skratta. Sedan skulle han inte säga något på en vecka.',
      },
      next: 'menu',
    },
    fimbul: {
      text: {
        en: 'So the old cold is back. I stood in it once, with Halvar beside me. Ask him about it. He will not answer, but ask.',
        sv: 'Så den gamla kölden är tillbaka. Jag stod i den en gång, med Halvar vid min sida. Fråga honom om det. Han svarar inte, men fråga.',
      },
      next: 'menu',
    },
  },
};

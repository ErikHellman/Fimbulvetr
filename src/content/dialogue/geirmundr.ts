import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Geirmundr, a grave-robber who lost his nerve: grave-gold wakes the dead. */
export const GEIRMUNDR: DialogueDef = {
  entry: [
    { when: not(flag('n_geirmundr_met')), node: 'meet' },
    { when: flag('q_barrow_ring_done'), node: 'ring_after' },
    { when: flag('q_ring_laid'), node: 'ring_thanks' },
    { when: flag('q_ring_given'), node: 'ring_wait' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: flag('st_stone3_lit'), node: 'lit' },
    { when: flag('st_barrow_open'), node: 'opened' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'I was not digging. I was… resting, near a hole. Geirmundr. A trader in old things, from old places.',
        sv: 'Jag grävde inte. Jag… vilade, nära ett hål. Geirmundr. Handlare i gamla ting, från gamla platser.',
      },
      do: [{ k: 'set', flag: 'n_geirmundr_met', value: true }],
      next: 'gold',
    },
    gold: {
      text: {
        en: 'A word, since you have the look of someone who goes in places. Grave-gold is not for lifting. You lift it, and whoever it was buried with sits up to ask for it back.',
        sv: 'Ett råd, eftersom du ser ut som någon som går in på ställen. Gravguld är inte till för att lyftas. Lyfter du det, sätter sig den som det begravdes med upp och ber om att få det tillbaka.',
      },
      next: 'gold2',
    },
    gold2: {
      text: {
        en: 'I learned that the hard way. My partner learned it harder. So now I sit by the road and sell honest pots.',
        sv: 'Det lärde jag mig den hårda vägen. Min kompanjon lärde sig det hårdare. Så nu sitter jag vid vägen och säljer ärliga krukor.',
      },
    },
    day: {
      text: {
        en: 'The barrows are quiet by day. By day. Remember that.',
        sv: 'Gravhögarna är tysta om dagen. Om dagen. Kom ihåg det.',
      },
    },
    opened: {
      text: {
        en: 'You opened Konungshaugr? You mad fool. There is a king’s hoard down there, and a king who counts it every night.',
        sv: 'Du öppnade Konungshaugr? Din galning. Där nere finns en kungs skatt, och en kung som räknar den varje natt.',
      },
    },
    lit: {
      text: {
        en: 'You came out. With nothing in your pockets? Then you are wiser than me, and luckier.',
        sv: 'Du kom ut. Utan något i fickorna? Då är du klokare än jag, och har mer tur.',
      },
    },
    fimbul: {
      text: {
        en: 'Frozen ground. You cannot dig frozen ground. Do you know what that does to a man in my trade?',
        sv: 'Frusen mark. Man kan inte gräva i frusen mark. Vet du vad det gör med en man i min bransch?',
      },
      next: 'ring',
    },
    ring: {
      text: {
        en: 'Also, I have not slept since I took this ring from the north-west mound. Something scratches at my tent. Put it back for me? At night, when they can see it returned.',
        sv: 'Dessutom har jag inte sovit sedan jag tog den här ringen från högen i nordväst. Något krafsar på mitt tält. Lägg tillbaka den åt mig? På natten, när de kan se att den kommer tillbaka.',
      },
      do: [
        { k: 'give', item: 'grave_ring' },
        { k: 'set', flag: 'q_ring_given', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    ring_wait: {
      text: {
        en: 'The north-west mound, after dark. Lay it on the top and run. That is what I would do. That is what I did, mostly.',
        sv: 'Högen i nordväst, efter mörkrets inbrott. Lägg den överst och spring. Det är vad jag skulle göra. Det är vad jag gjorde, för det mesta.',
      },
    },
    ring_thanks: {
      text: {
        en: 'You did it? And they rose? I slept like a babe. Here, a quiver I was keeping for a better grave than mine. More arrows for you.',
        sv: 'Du gjorde det? Och de steg upp? Jag sov som ett barn. Här, ett koger jag sparade till en bättre grav än min. Fler pilar åt dig.',
      },
      do: [
        { k: 'give', item: 'quiver' },
        { k: 'set', flag: 'q_barrow_ring_done', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    ring_after: {
      text: {
        en: 'I am in the selling trade now, not the digging trade. Mostly.',
        sv: 'Jag är i säljarbranschen nu, inte i grävarbranschen. För det mesta.',
      },
    },
  },
};

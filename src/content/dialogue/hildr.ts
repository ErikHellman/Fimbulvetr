import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Hildr, the shepherd on the heath: the barrow-wights, Styrr's habits, her sheep. */
export const HILDR: DialogueDef = {
  entry: [
    { when: not(flag('n_hildr_met')), node: 'meet' },
    { when: { k: 'item', id: 'trade_bell' }, node: 'bell' },
    { when: flag('st_pass_open'), node: 'fimbul' },
    { when: flag('st_stone3_lit'), node: 'lit' },
    { when: flag('st_barrow_open'), node: 'opened' },
    { when: not(flag('n_styrr_met')), node: 'styrr' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Careful, you will scatter them. Hildr. These are my sheep, and that is my heather, and none of it is for sale.',
        sv: 'Försiktigt, du skrämmer dem. Hildr. Det här är mina får, och det där är min ljung, och inget av det är till salu.',
      },
      do: [{ k: 'set', flag: 'n_hildr_met', value: true }],
      next: 'wights',
    },
    wights: {
      text: {
        en: 'I take them down to the bay before dark. At night the barrow-wights walk: shields and old swords, and they do not like the living.',
        sv: 'Jag driver ner dem till viken innan det mörknar. Om natten går gravvättarna: sköldar och gamla svärd, och de tycker inte om de levande.',
      },
      next: 'styrr',
    },
    styrr: {
      text: {
        en: 'If it is the barrows you want, ask old Styrr, east past the stone circle. He talks to nobody, but he will talk to anyone with silver.',
        sv: 'Om det är gravhögarna du vill åt, fråga gamle Styrr, österut förbi stencirkeln. Han talar inte med någon, men han talar med alla som har silver.',
      },
    },
    day: {
      text: {
        en: 'Grey sky, green heather, fat sheep. Haugar is a good place, as long as you are home by dark.',
        sv: 'Grå himmel, grön ljung, feta får. Haugar är ett bra ställe, så länge man är hemma innan mörkret.',
      },
    },
    opened: {
      text: {
        en: 'The King’s Barrow is open. My sheep would not graze near it this morning. Sheep know things.',
        sv: 'Kungens hög står öppen. Mina får ville inte beta nära den i morse. Får vet saker.',
      },
    },
    lit: {
      text: {
        en: 'The dead lie quiet since you came up out of the hill. I sleep with the door open now. Well, a little open.',
        sv: 'De döda ligger stilla sedan du kom upp ur kullen. Jag sover med dörren öppen nu. Nåja, lite öppen.',
      },
    },
    bell: {
      text: {
        en: 'That is Ulf’s bell, I would know its note anywhere. My bellwether lost hers in the cold, and the flock will not follow a quiet ewe.',
        sv: 'Det där är Ulfs skälla, jag känner igen klangen var som helst. Min skällgumma tappade sin i kölden, och hjorden följer inte ett tyst får.',
      },
      choices: [
        {
          text: { en: 'Give her the bell.', sv: 'Ge henne skällan.' },
          do: [
            { k: 'take', item: 'trade_bell' },
            { k: 'give', item: 'trade_fleece' },
            { k: 'set', flag: 'q_trade', value: 1 },
            { k: 'sfx', id: 'sfx_itemget' },
          ],
          next: 'fleece',
        },
        { text: { en: 'Not yet.', sv: 'Inte än.' } },
      ],
    },
    fleece: {
      text: {
        en: 'Here, a fleece for it, the best I sheared this year. Raw as it comes; someone in Uppvík spins.',
        sv: 'Här, en fäll för den, den bästa jag klippte i år. Rå som den är; någon i Uppvík spinner.',
      },
    },
    fimbul: {
      text: {
        en: 'The cold scattered my flock across the heath in one night. A farm with a whole fold could winter them. I have a hut and a dog.',
        sv: 'Kölden skingrade min hjord över heden på en enda natt. En gård med en hel fålla kunde ta dem genom vintern. Jag har en koja och en hund.',
      },
    },
  },
};

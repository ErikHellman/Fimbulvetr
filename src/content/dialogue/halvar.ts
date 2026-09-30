import type { DialogueDef } from '@core/story/dialogue';
import { afterRaid, all, choresDone, day, evening, flag, not, paid, raidNight } from './util';

const PAY = 10;

/** Halvar hands out the day's chores and pays for them. */
export const HALVAR: DialogueDef = {
  entry: [
    { when: raidNight, node: 'raid' },
    { when: all(afterRaid, not(flag('st_seax_given'))), node: 'wounded' },
    { when: all(afterRaid, not(flag('st_legend_told'))), node: 'go_gyda' },
    { when: all(afterRaid, flag('n_styrr_met'), not(flag('st_stone3_lit'))), node: 'styrr' },
    { when: afterRaid, node: 'after' },
    { when: all(day(1), not(flag('st_intro_seen'))), node: 'intro' },
    { when: all(day(1), choresDone(1), not(flag(paid(1)))), node: 'pay1' },
    { when: all(day(2), choresDone(2), not(flag(paid(2)))), node: 'pay2' },
    { when: all(day(3), choresDone(3), not(flag(paid(3)))), node: 'pay3' },
    { when: evening, node: 'night' },
    { when: all(day(1), flag(paid(1))), node: 'rest1' },
    { when: all(day(2), flag(paid(2))), node: 'rest2' },
    { when: all(day(3), flag(paid(3))), node: 'rest3' },
    { when: day(1), node: 'chore1' },
    { when: day(2), node: 'chore2' },
    { when: day(3), node: 'chore3' },
  ],
  nodes: {
    intro: {
      text: {
        en: 'Up with the sun, good. The sheep broke out of the pen again, and the trough is bone dry.',
        sv: 'Uppe med solen, bra. Fåren har rymt ur fållan igen, och vattentråget är snustorrt.',
      },
      next: 'intro2',
      do: [{ k: 'set', flag: 'st_intro_seen', value: true }],
    },
    intro2: {
      text: {
        en: 'Walk the five of them back into the pen, then fill the trough from the well. Lift the pail and set it down by the trough.',
        sv: 'Driv in alla fem i fållan igen, och fyll sedan tråget från brunnen. Lyft ämbaret och ställ ner det vid tråget.',
      },
      next: 'intro3',
    },
    intro3: {
      text: {
        en: 'And keep my old hand-axe close. There is wood to split tomorrow.',
        sv: 'Och håll min gamla handyxa nära. Det finns ved att klyva i morgon.',
      },
    },
    chore1: {
      text: {
        en: 'Sheep in the pen, water in the trough. Walk at the sheep and they will go the other way.',
        sv: 'Fåren i fållan, vatten i tråget. Gå mot fåren så går de åt andra hållet.',
      },
    },
    pay1: {
      text: {
        en: 'All five penned and the trough full? Here. You earned it.',
        sv: 'Alla fem i fållan och tråget fullt? Här. Det har du förtjänat.',
      },
      do: [
        { k: 'silver', n: PAY },
        { k: 'set', flag: 'q_paid_d1', value: true },
        { k: 'sfx', id: 'sfx_buy' },
      ],
      next: 'pay1b',
    },
    pay1b: {
      text: {
        en: 'Go in and eat. Embla has been asking where you went all day.',
        sv: 'Gå in och ät. Embla har frågat efter dig hela dagen.',
      },
    },
    rest1: {
      text: { en: 'Go in, lad. The day’s work is done.', sv: 'Gå in, pojk. Dagens arbete är gjort.' },
    },
    chore2: {
      text: {
        en: 'Winter comes whether we are ready or not. Split the logs by the chopping block. The big ones need your whole body: hold the blade back, then let it go.',
        sv: 'Vintern kommer vare sig vi är redo eller inte. Klyv stockarna vid huggkubben. De stora kräver hela kroppen: håll bladet bakåt och släpp sedan.',
      },
    },
    pay2: {
      text: {
        en: 'That is a winter’s warmth. Good. Take this.',
        sv: 'Det där är en vinters värme. Bra. Ta det här.',
      },
      do: [
        { k: 'silver', n: PAY },
        { k: 'set', flag: 'q_paid_d2', value: true },
        { k: 'sfx', id: 'sfx_buy' },
      ],
      next: 'pay2b',
    },
    pay2b: {
      text: {
        en: 'Gyða says the stones on the ridge have gone dark. Old women’s talk. Go on in.',
        sv: 'Gyða säger att stenarna på åsen har slocknat. Käringprat. Gå in nu.',
      },
    },
    rest2: {
      text: {
        en: 'Old women’s talk, I said. Go in and rest.',
        sv: 'Käringprat, sa jag. Gå in och vila.',
      },
    },
    chore3: {
      text: {
        en: 'The ravens are at the barley again. Throw stones at them. A blade will never catch a bird.',
        sv: 'Korparna är i kornet igen. Kasta sten på dem. Ett blad hinner aldrig ikapp en fågel.',
      },
    },
    pay3: {
      text: {
        en: 'They will tell the whole flock about you. Well done.',
        sv: 'De kommer att berätta om dig för hela flocken. Bra gjort.',
      },
      do: [
        { k: 'silver', n: PAY },
        { k: 'set', flag: 'q_paid_d3', value: true },
        { k: 'sfx', id: 'sfx_buy' },
      ],
      next: 'pay3b',
    },
    pay3b: {
      text: {
        en: 'There is a storm in the north. Sleep early tonight, Ask.',
        sv: 'Det är storm i norr. Gå och lägg dig tidigt i kväll, Ask.',
      },
    },
    rest3: {
      text: {
        en: 'Can you smell that wind? Snow. In summer.',
        sv: 'Känner du vinden? Snö. Mitt i sommaren.',
      },
    },
    night: {
      text: { en: 'Sleep well, Ask.', sv: 'Sov gott, Ask.' },
    },
    raid: {
      text: {
        en: 'That horn… Stay behind me, lad.',
        sv: 'Det där hornet… Håll dig bakom mig, pojk.',
      },
    },
    wounded: {
      text: {
        en: 'Ask. They took her. They took Embla, and I lay in the mud and watched.',
        sv: 'Ask. De tog henne. De tog Embla, och jag låg i leran och såg på.',
      },
      next: 'wounded2',
    },
    wounded2: {
      text: {
        en: 'I stood in the shield wall once, against worse than trolls. I never told you. I never told her.',
        sv: 'Jag stod i sköldborgen en gång, mot värre än troll. Jag berättade aldrig för dig. Aldrig för henne.',
      },
      next: 'gift',
    },
    gift: {
      text: {
        en: 'Take my old seax and my shield from the chest. They have waited long enough.',
        sv: 'Ta min gamla sax och min sköld ur kistan. De har väntat länge nog.',
      },
      do: [
        { k: 'weapon', id: 'seax' },
        { k: 'shield', has: true },
        { k: 'set', flag: 'st_seax_given', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
      next: 'gift2',
    },
    gift2: {
      text: {
        en: 'Raise the shield against a blow and it will hold. Go to Gyða. She knows what that sorcerer is.',
        sv: 'Håll upp skölden mot ett slag så håller den. Gå till Gyða. Hon vet vad den där trollkarlen är.',
      },
    },
    go_gyda: {
      text: {
        en: 'Go to the hof. Gyða knows the old stories. I only lived one of them.',
        sv: 'Gå till hovet. Gyða kan de gamla berättelserna. Jag levde bara en av dem.',
      },
    },
    styrr: {
      text: {
        en: 'Styrr? Old Styrr still breathes? … That is a name from another life, Ask. Leave it there. Bring them home.',
        sv: 'Styrr? Gamle Styrr andas fortfarande? … Det är ett namn från ett annat liv, Ask. Låt det vara där. För hem dem.',
      },
    },
    after: {
      text: {
        en: 'Bring them home, Ask. Bring her home. I will mend, and I will be here.',
        sv: 'För hem dem, Ask. För hem henne. Jag blir bättre, och jag finns här.',
      },
    },
  },
};

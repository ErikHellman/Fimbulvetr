import type { DialogueDef } from '@core/story/dialogue';
import { all, atLeast, evening, flag, not } from './util';

/** Önundr the woodcutter, in his clearing by day and his hut by night. */
export const ONUNDR: DialogueDef = {
  entry: [
    { when: not(flag('n_onundr_met')), node: 'meet' },
    { when: flag('q_trolls_done'), node: 'trolls_after' },
    { when: all(flag('q_trolls_asked'), atLeast('q_trolls_stoned', 5)), node: 'trolls_won' },
    { when: flag('q_trolls_asked'), node: 'trolls_wait' },
    { when: flag('st_pass_open'), node: 'trolls' },
    { when: all(flag('st_stone1_lit'), not(flag('st_road_open'))), node: 'road' },
    { when: all(flag('st_road_open'), not(flag('st_myrland_reached'))), node: 'south' },
    { when: all(flag('st_stone2_lit'), not(flag('st_haugar_reached'))), node: 'east' },
    { when: flag('st_road_open'), node: 'north' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    trolls: {
      text: {
        en: 'The cold has the trolls bold. They walk my wood every night now, and the sun catches too few of them. Keep them busy in the troll wood until sunrise.',
        sv: 'Kölden har gjort trollen djärva. De går i min skog varenda natt nu, och solen fångar för få av dem. Håll dem sysselsatta i trollskogen tills solen går upp.',
      },
      next: 'trolls2',
    },
    trolls2: {
      text: {
        en: 'Five stones, that is all I ask. Stay out of their reach until dawn and let the light do the work. I have an old arm-ring for the trouble.',
        sv: 'Fem stenar, mer begär jag inte. Håll dig utom räckhåll tills det gryr och låt ljuset göra jobbet. Jag har en gammal armring för besväret.',
      },
      do: [{ k: 'set', flag: 'q_trolls_asked', value: true }],
    },
    trolls_wait: {
      text: {
        en: 'Five trolls to stone in the troll wood, east of the roots. The sun does not care how many nights it takes.',
        sv: 'Fem troll till sten i trollskogen, öster om rötterna. Solen bryr sig inte om hur många nätter det tar.',
      },
    },
    trolls_won: {
      text: {
        en: 'Five new stones in the troll wood! My saw thanks you. Here, the arm-ring: whoever wears it is up off the ground before the ground knows it.',
        sv: 'Fem nya stenar i trollskogen! Min såg tackar dig. Här, armringen: den som bär den är uppe från marken innan marken vet om det.',
      },
      do: [
        { k: 'set', flag: 'w_ring_stamina', value: true },
        { k: 'set', flag: 'q_trolls_done', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
      next: 'trolls_ring',
    },
    trolls_ring: {
      text: {
        en: '(The arm-ring of stamina: rolls come quicker. Wear it from the pause menu.)',
        sv: '(Armringen av uthållighet: rullningarna kommer tätare. Bär den från pausmenyn.)',
      },
    },
    trolls_after: {
      text: {
        en: 'The wood is quieter. Not quiet, mind. Quieter.',
        sv: 'Skogen är tystare. Inte tyst, märk väl. Tystare.',
      },
    },
    meet: {
      text: {
        en: 'A farm lad, this deep in Myrkviðr? Then it is true. The trolls came down through my wood two nights ago.',
        sv: 'En gårdspojke, så här djupt inne i Myrkviðr? Då är det sant. Trollen kom ner genom min skog för två nätter sedan.',
      },
      do: [{ k: 'set', flag: 'n_onundr_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'I hid in the woodpile like a coward. Önundr is my name. If you need a fire and a roof, knock.',
        sv: 'Jag gömde mig i vedtraven som en ynkrygg. Önundr heter jag. Behöver du eld och tak, så knacka.',
      },
    },
    day: {
      text: {
        en: 'Leaves hide all sorts in autumn. Cut through a pile and you never know what you find. Old coins. A lost boot.',
        sv: 'Löven gömmer allt möjligt om hösten. Hugg igenom en hög och man vet aldrig vad man hittar. Gamla mynt. En borttappad känga.',
      },
    },
    road: {
      text: {
        en: 'The old stone under the roots burns again. I felt it in my axe handle. You did that, lad?',
        sv: 'Den gamla stenen under rötterna brinner igen. Jag kände det i yxskaftet. Var det du, pojk?',
      },
      next: 'road2',
    },
    road2: {
      text: {
        en: 'Then you need Uppvík, where the traders and the rune-carver are. The road north lies under that fallen pine. Leave it to me.',
        sv: 'Då behöver du Uppvík, där handlarna och runristaren finns. Vägen norrut ligger under den fallna tallen. Lämna den åt mig.',
      },
      next: 'road3',
    },
    road3: {
      text: {
        en: 'There. Sawn through while we talked, near enough. Follow the road north past the deep pines.',
        sv: 'Så. Genomsågad medan vi pratade, nästan. Följ vägen norrut förbi de djupa tallarna.',
      },
      do: [{ k: 'set', flag: 'st_road_open', value: true }],
    },
    south: {
      text: {
        en: 'And lad: my brook runs south to a weir, and past it lies Mýrland, all reed and slow water. The mill there drowned last spring. They say an old stone lies under it.',
        sv: 'Och pojk: min bäck rinner söderut till en damm, och bortom den ligger Mýrland, bara vass och långsamt vatten. Kvarnen där drunknade i våras. Det sägs att en gammal sten ligger under den.',
      },
      next: 'south2',
    },
    south2: {
      text: {
        en: 'The weir’s drawbridge is hauled up from the far side. You would need something that flies out and comes back to strike its latch.',
        sv: 'Dammens vindbrygga är uppdragen från andra sidan. Du skulle behöva något som flyger ut och kommer tillbaka för att slå till spärren.',
      },
    },
    east: {
      text: {
        en: 'Two stones lit, they say in Uppvík. The third lies east, in Haugar, where the barrows are. The storm brought the rocks down across the old path out of the birch glade.',
        sv: 'Två stenar tända, säger de i Uppvík. Den tredje ligger österut, i Haugar, där gravhögarna är. Stormen rasade ner stenar över den gamla stigen ut ur björkgläntan.',
      },
      next: 'east2',
    },
    east2: {
      text: {
        en: 'You carry bombs now, I hear. Well. A rockfall does not argue with a bomb.',
        sv: 'Du bär bomber nu, hör jag. Nåja. Ett stenras säger inte emot en bomb.',
      },
    },
    north: {
      text: {
        en: 'Uppvík shuts its gate at dark. Knock hard, and Bersi might let you in before the dead catch up.',
        sv: 'Uppvík stänger porten när det mörknar. Knacka hårt, så släpper Bersi kanske in dig innan de döda hinner ikapp.',
      },
    },
    night: {
      text: {
        en: 'Shut the door behind you. The dead walk in the hollow past the clearing, and they do not knock.',
        sv: 'Stäng dörren efter dig. De döda går i sänkan bortom gläntan, och de knackar inte.',
      },
    },
  },
};

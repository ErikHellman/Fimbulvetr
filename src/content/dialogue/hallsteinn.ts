import type { DialogueDef } from '@core/story/dialogue';
import { flag, not } from './util';

/** Hallsteinn, the warden of the shut pass: the three seals, and the stones that light them. */
export const HALLSTEINN: DialogueDef = {
  entry: [
    { when: not(flag('n_hallsteinn_met')), node: 'meet' },
    { when: flag('st_rime_open'), node: 'rime' },
    { when: flag('st_pass_open'), node: 'open' },
    { when: flag('st_stone3_lit'), node: 'three' },
    { when: flag('st_stone2_lit'), node: 'two' },
    { node: 'seals' },
  ],
  nodes: {
    rime: {
      text: {
        en: 'Melted. My fathers watched that ice for four hundred winters, and you sang it away before my supper. Go on, then. Someone has to see what it was keeping in.',
        sv: 'Smält. Mina fäder vaktade den isen i fyrahundra vintrar, och du sjöng bort den före min kvällsmat. Gå då. Någon måste se vad den höll inne.',
      },
    },
    meet: {
      text: {
        en: 'Halt. Well, not halt: nobody goes anywhere. Hallsteinn. My fathers kept this pass, and I keep the door that shuts it.',
        sv: 'Stanna. Nåja, inte stanna: ingen går någonstans. Hallsteinn. Mina fäder vaktade detta pass, och jag vaktar dörren som stänger det.',
      },
      do: [{ k: 'set', flag: 'n_hallsteinn_met', value: true }],
      next: 'seals',
    },
    seals: {
      text: {
        en: 'Three seals, three stones. The ancestors carved them to shut the mountains. When all three stones burn again, the door will know it.',
        sv: 'Tre sigill, tre stenar. Förfäderna högg dem för att stänga bergen. När alla tre stenar brinner igen, vet dörren om det.',
      },
    },
    two: {
      text: {
        en: 'Two seals burning. I have watched this door forty winters and never seen one. The third stone is under Konungshaugr, they say.',
        sv: 'Två sigill som brinner. Jag har vaktat denna dörr i fyrtio vintrar och aldrig sett ett enda. Den tredje stenen ligger under Konungshaugr, sägs det.',
      },
    },
    open: {
      text: {
        en: 'The door was the easy part. That ice up the gorge is the King’s own breath, and it will not melt for a summer. Go home, lad. Look to your people. I will watch it.',
        sv: 'Dörren var det lätta. Isen uppe i klyftan är Konungens egen andedräkt, och den smälter inte för en sommar. Gå hem, grabben. Se till ditt folk. Jag vaktar den.',
      },
    },
    three: {
      text: {
        en: 'All three. The door is warm to the touch. Something beyond it is warm too, and I do not like how it breathes.',
        sv: 'Alla tre. Dörren är varm att ta på. Något bortom den är också varmt, och jag tycker inte om hur det andas.',
      },
    },
  },
};

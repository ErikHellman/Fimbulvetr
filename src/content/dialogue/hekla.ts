import type { DialogueDef } from '@core/story/dialogue';
import { all, atLeast, flag, not } from './util';

/** Hekla, Dvalinn's daughter (M8a): she leads Ask through the old workings to the lamp-room. */
export const HEKLA: DialogueDef = {
  entry: [
    { when: atLeast('q_foreman', 4), node: 'after' },
    { when: { k: 'escort', npc: 'hekla' }, node: 'with' },
    { when: all(atLeast('q_foreman', 3), not({ k: 'escort', npc: 'hekla' })), node: 'go' },
    { when: flag('st_dvg_reached'), node: 'camp' },
  ],
  nodes: {
    camp: {
      text: {
        en: 'Father says long-legs are slow and loud. You do not look slow.',
        sv: 'Far säger att långben är långsamma och högljudda. Du ser inte långsam ut.',
      },
    },
    go: {
      text: {
        en: 'Ready? I know every turn in there. Go first, and I will stay close behind you. If a warden comes, I stand still until it is broken.',
        sv: 'Redo? Jag känner varje krök därinne. Gå först, så håller jag mig tätt bakom dig. Om en väktare kommer står jag stilla tills den är krossad.',
      },
      do: [{ k: 'escort', npc: 'hekla', hp: 12, lost: 'escort_lost' }],
    },
    with: {
      text: {
        en: 'Down the shaft at the top of the gallery, then west to the lamps. I am right behind you.',
        sv: 'Ner i schaktet högst upp i gången, sedan västerut till lamporna. Jag är tätt bakom dig.',
      },
    },
    after: {
      text: {
        en: 'I found them by the lamps, and you found me. Father will not stop telling it. Neither will I.',
        sv: 'Jag hittade dem vid lamporna, och du hittade mig. Far slutar aldrig berätta om det. Inte jag heller.',
      },
    },
  },
};

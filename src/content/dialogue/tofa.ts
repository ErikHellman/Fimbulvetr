import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Tófa, who is sure there are no trolls, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'Oddr says trolls live under the ford. He is lying.',
      sv: 'Oddr säger att det bor troll under vadet. Han ljuger.',
    },
  ],
  [
    {
      en: 'Trolls turn to stone in the sun. So they cannot live under a ford. It is sunny there.',
      sv: 'Troll blir till sten i solen. Så de kan inte bo under ett vad. Det är soligt där.',
    },
  ],
  [
    {
      en: 'The ravens are scared of you! Can you scare Oddr too?',
      sv: 'Korparna är rädda för dig! Kan du skrämma Oddr också?',
    },
  ],
  { en: 'I want my mother.', sv: 'Jag vill ha min mamma.' },
);

/**
 * Tófa: taken in the raid, held in a cell in Helgrind until Náströnd falls, then home to her stall at the
 * field fence, selling flatbread and cheese (the stall's `shop_tofa` opens with her `home` line).
 */
export const TOFA: DialogueDef = {
  entry: [
    { when: flag('st_freed_tofa'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Ask. There are trolls. I saw them carry us. I am not crying, it is the fog.',
        sv: 'Ask. Det finns troll. Jag såg dem bära oss. Jag gråter inte, det är dimman.',
      },
      next: 'cell_key',
    },
    cell_key: {
      text: {
        en: 'The shield-man has the key. Ulf is in the other cells, west, over the pools. Tell him I am brave.',
        sv: 'Sköldmannen har nyckeln. Ulf sitter i de andra cellerna, västerut, bortom dammarna. Säg till honom att jag är modig.',
      },
    },
    home: {
      text: {
        en: 'Trolls are real, so I sell bread now. Mother says a stall is safer than the woods. Flatbread, cheese?',
        sv: 'Troll finns på riktigt, så nu säljer jag bröd. Mamma säger att ett stånd är säkrare än skogen. Tunnbröd, ost?',
      },
    },
  },
};

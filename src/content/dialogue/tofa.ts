import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Tófa, who is sure there are no trolls. */
export const TOFA: DialogueDef = daily(
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

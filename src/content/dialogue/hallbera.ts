import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Hallbera, the brewer. */
export const HALLBERA: DialogueDef = daily(
  [
    {
      en: 'The mead has gone sour. Never once in thirty summers.',
      sv: 'Mjödet har surnat. Inte en enda gång på trettio somrar.',
    },
  ],
  [
    {
      en: 'Come back at harvest for the good ale. If there is a harvest.',
      sv: 'Kom tillbaka till skörden för det goda ölet. Om det blir någon skörd.',
    },
  ],
  [
    {
      en: 'My cellar was cold this morning. Cold as a grave.',
      sv: 'Min källare var kall i morse. Kall som en grav.',
    },
  ],
  { en: 'Bar the doors! Bar the doors!', sv: 'Bomma dörrarna! Bomma dörrarna!' },
);

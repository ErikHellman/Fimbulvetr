import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Oddr, who is sure there are trolls. */
export const ODDR: DialogueDef = daily(
  [{ en: 'Trolls live under the ford! Tófa is lying.', sv: 'Troll bor under vadet! Tófa ljuger.' }],
  [
    {
      en: 'They come out at night. That is why you never see them. Obviously.',
      sv: 'De kommer fram på natten. Det är därför man aldrig ser dem. Självklart.',
    },
  ],
  [
    {
      en: 'The ravens know something. Ravens always know something.',
      sv: 'Korparna vet något. Korpar vet alltid något.',
    },
  ],
  { en: 'I told you. I told you!', sv: 'Jag sa ju det. Jag sa ju det!' },
);

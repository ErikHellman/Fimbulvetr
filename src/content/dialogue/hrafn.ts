import type { DialogueDef } from '@core/story/dialogue';
import { atLeast, flag, not } from './util';

/**
 * Hrafn the seal-hunter, in his turf hut on Niflmýrr's shore. Trading step 4: Gamli's bone hook for a
 * walrus-ivory comb. He loses his nets to a marbendill every night, and his late wife's seal-skin hangs
 * over the bed (his quest for it comes in M7).
 */
export const HRAFN: DialogueDef = {
  entry: [
    { when: not(flag('n_hrafn_met')), node: 'meet' },
    { when: { k: 'item', id: 'trade_hook' }, node: 'hook' },
    { when: atLeast('q_trade', 4), node: 'after' },
    { node: 'nets' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Shut the door, the fog gets in. Hrafn. I hunt seal on the lake, when the lake lets me. Nobody comes over the pass any more. You must want something badly.',
        sv: 'Stäng dörren, dimman kommer in. Hrafn. Jag jagar säl på sjön, när sjön låter mig. Ingen kommer över passet längre. Du måste vilja ha något mycket.',
      },
      do: [{ k: 'set', flag: 'n_hrafn_met', value: true }],
      next: 'nets',
    },
    nets: {
      text: {
        en: 'Every night something climbs the strand and tears my nets: a marbendill, grey as a drowned man. The skin over the bed? My wife’s. That is not for talking about.',
        sv: 'Varje natt klättrar något upp på stranden och river mina nät: en marbendill, grå som en drunknad. Skinnet över sängen? Min hustrus. Det pratar vi inte om.',
      },
    },
    hook: {
      text: {
        en: 'Is that… a bone hook? Gamli’s hook, from the pike of Mýrland? A hook like that holds a seal-line through a whole winter. What do you want for it?',
        sv: 'Är det… en benkrok? Gamles krok, från gäddan i Mýrland? En sådan krok håller en sällina genom en hel vinter. Vad vill du ha för den?',
      },
      choices: [
        {
          text: { en: 'Trade him the hook.', sv: 'Byt bort kroken.' },
          do: [
            { k: 'take', item: 'trade_hook' },
            { k: 'give', item: 'trade_comb' },
            { k: 'set', flag: 'q_trade', value: 4 },
            { k: 'sfx', id: 'sfx_itemget' },
          ],
          next: 'comb',
        },
        { text: { en: 'Not yet.', sv: 'Inte än.' } },
      ],
    },
    comb: {
      text: {
        en: 'Take this comb. Walrus ivory, carved for my wife. I have no use for it now. Give it to someone who still combs her hair for a reason.',
        sv: 'Ta den här kammen. Valrossben, snidad åt min hustru. Jag har ingen användning för den nu. Ge den till någon som fortfarande kammar sitt hår av en anledning.',
      },
    },
    after: {
      text: {
        en: 'The hook holds. The nets do not. That marbendill will have the boat next.',
        sv: 'Kroken håller. Näten gör det inte. Den där marbendillen tar båten härnäst.',
      },
    },
  },
};

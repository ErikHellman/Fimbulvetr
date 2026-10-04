import type { DialogueDef } from '@core/story/dialogue';
import { atLeast, flag, not } from './util';

/**
 * Hrafn the seal-hunter, in his turf hut on Niflmýrr's shore. Trading step 4: Gamli's bone hook for a
 * walrus-ivory comb. He loses his nets to a marbendill every night: drive it off three nights (M7a) and
 * he gives his late wife's seal-skin, which hangs over the bed.
 */
export const HRAFN: DialogueDef = {
  entry: [
    { when: not(flag('n_hrafn_met')), node: 'meet' },
    { when: { k: 'item', id: 'trade_hook' }, node: 'hook' },
    { when: flag('q_sealskin_done'), node: 'skinned' },
    { when: atLeast('q_seal_nights', 3), node: 'skin' },
    { when: flag('ev_seal_tonight'), node: 'tonight' },
    { when: flag('q_sealskin_asked'), node: 'watch' },
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
      choices: [
        {
          text: { en: 'I will watch your nets tonight.', sv: 'Jag vaktar dina nät i natt.' },
          do: [{ k: 'set', flag: 'q_sealskin_asked', value: true }],
          next: 'guard',
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
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
      choices: [
        {
          text: { en: 'I will watch your nets tonight.', sv: 'Jag vaktar dina nät i natt.' },
          do: [{ k: 'set', flag: 'q_sealskin_asked', value: true }],
          next: 'guard',
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
    guard: {
      text: {
        en: 'Then watch the strand after dark. It comes up out of the lake by the reeds, west of the hut. Drive it off three nights and I will believe the lake can be crossed.',
        sv: 'Vakta då stranden efter mörkrets inbrott. Den kommer upp ur sjön vid vassen, väster om hyddan. Driv bort den tre nätter så ska jag tro att sjön går att ta sig över.',
      },
    },
    watch: {
      text: {
        en: 'After dark, on the strand. It comes every night, as sure as the fog.',
        sv: 'Efter mörkrets inbrott, på stranden. Den kommer varje natt, lika säkert som dimman.',
      },
    },
    tonight: {
      text: {
        en: 'I heard it scream and go under. Good. It will be back tomorrow night; they always are.',
        sv: 'Jag hörde den skrika och dyka. Bra. Den kommer tillbaka i morgon natt; det gör de alltid.',
      },
    },
    skin: {
      text: {
        en: 'Three nights, and the nets still whole. Take the skin from over the bed. She went back to the water once. Mind you come back from it.',
        sv: 'Tre nätter, och näten fortfarande hela. Ta skinnet ovanför sängen. Hon gick tillbaka till vattnet en gång. Se till att du kommer tillbaka därifrån.',
      },
      do: [
        { k: 'give', item: 'sealskin' },
        { k: 'set', flag: 'q_sealskin_done', value: true },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
      next: 'skin2',
    },
    skin2: {
      text: {
        en: 'In it the lake holds you up. Roll, and you go under like a seal: whatever is swinging at you swings at water.',
        sv: 'I det håller sjön dig uppe. Rulla, så dyker du som en säl: det som svingar mot dig svingar mot vatten.',
      },
    },
    skinned: {
      text: {
        en: 'Holmr is out there, past the warm water. Somebody keeps a fire on it at night. I have not rowed out to see who.',
        sv: 'Holmr ligger där ute, bortom det varma vattnet. Någon håller en eld brinnande där om nätterna. Jag har inte rott ut för att se vem.',
      },
    },
  },
};

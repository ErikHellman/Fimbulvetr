import type { DialogueDef } from '@core/story/dialogue';
import { atLeast } from './util';

/** Nýr, of Dvalinn's crew (M8a): trapped in the lamp-room, then back at the camp. */
export const NYR: DialogueDef = {
  entry: [{ when: atLeast('q_foreman', 4), node: 'camp' }, { node: 'trapped' }],
  nodes: {
    trapped: {
      text: {
        en: 'Light! Is that a lamp or a long-legs? Either is welcome.',
        sv: 'Ljus! Är det en lampa eller en långben? Båda är välkomna.',
      },
    },
    camp: {
      text: {
        en: 'Four days on lamp-oil and boot-leather. The camp stew tastes like a king’s feast.',
        sv: 'Fyra dagar på lampolja och stövelläder. Lägergrytan smakar som en kungs gästabud.',
      },
    },
  },
};

/** Náli, of Dvalinn's crew (M8a). */
export const NALI: DialogueDef = {
  entry: [{ when: atLeast('q_foreman', 4), node: 'camp' }, { node: 'trapped' }],
  nodes: {
    trapped: {
      text: {
        en: 'Do not stand under that beam. Nothing in these workings has held since the forge woke.',
        sv: 'Stå inte under den bjälken. Ingenting i de här gångarna har hållit sedan smedjan vaknade.',
      },
    },
    camp: {
      text: {
        en: 'The cart road runs to Uppvík. Their ale is thin, but it is wet.',
        sv: 'Kärrvägen går till Uppvík. Deras öl är tunt, men det är blött.',
      },
    },
  },
};

import type { DialogueDef } from '@core/story/dialogue';
import { daily } from './util';

/** Þorkell, the neighbour. */
export const THORKELL: DialogueDef = daily(
  [
    {
      en: 'Halvar is lucky to have you, lad. My sons left for Uppvík and never looked back.',
      sv: 'Halvar har tur som har dig, pojk. Mina söner drog till Uppvík och såg sig aldrig om.',
    },
  ],
  [
    {
      en: 'The road north is quiet. Too quiet, Grímr says. Grímr says a lot.',
      sv: 'Vägen norrut är tyst. För tyst, säger Grímr. Grímr säger en hel del.',
    },
  ],
  [
    {
      en: 'Rannveig wants me to bar the door tonight. Women’s fears.',
      sv: 'Rannveig vill att jag bommar dörren i natt. Kvinnofruktan.',
    },
  ],
  { en: 'Rannveig! Rannveig, where are you?', sv: 'Rannveig! Rannveig, var är du?' },
);

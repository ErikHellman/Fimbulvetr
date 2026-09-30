import type { DialogueDef } from '@core/story/dialogue';
import { all, atLeast, evening, flag, not } from './util';

/** Kári the fisherman: lends his rod, buys every catch, and has waited forty winters for Gamli. */
export const KARI: DialogueDef = {
  entry: [
    { when: not(flag('n_kari_met')), node: 'meet' },
    { when: all(flag('q_fish_gamli'), not(flag('q_fisher_done'))), node: 'gamli' },
    { when: flag('q_fisher_done'), node: 'after' },
    { when: evening, node: 'night' },
    { when: atLeast('q_fish_caught', 5), node: 'knack' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Mind the planks, they are older than me. Kári. I fish this cove because the warm springs keep it open when the lake freezes.',
        sv: 'Akta plankorna, de är äldre än jag. Kári. Jag fiskar i den här viken för att de varma källorna håller den öppen när sjön fryser.',
      },
      do: [{ k: 'set', flag: 'n_kari_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'You have never held a rod, have you. Take mine, I have three. Cast from the end of the jetty, strike when the float goes under, and do not haul like a fool.',
        sv: 'Du har aldrig hållit i ett spö, va. Ta mitt, jag har tre. Kasta från bryggans ände, ta mothugg när flötet dras under, och dra inte som en tok.',
      },
      next: 'meet3',
    },
    meet3: {
      text: {
        en: 'I buy whatever you land, on the spot. And if you ever hook Gamli, the old pike, I will give you something better than silver.',
        sv: 'Jag köper allt du landar, på stående fot. Och får du någonsin Gamle på kroken, den gamla gäddan, så ger jag dig något bättre än silver.',
      },
    },
    day: {
      text: {
        en: 'Perch bite all year. Trout at dawn and dusk. Eels at night, summer and autumn. Gamli comes up in autumn, at first light and last, and he fights like a bull.',
        sv: 'Abborren nappar året om. Öringen i gryning och skymning. Ålen om natten, sommar och höst. Gamle kommer upp om hösten, i första och sista ljuset, och han slåss som en tjur.',
      },
    },
    knack: {
      text: {
        en: 'You have the knack now. Keep the line tight, and let it run when he surges, or it snaps. Gamli bites in autumn, at dawn and dusk.',
        sv: 'Nu har du fått kläm på det. Håll linan spänd, och låt den löpa när han rusar, annars brister den. Gamle nappar om hösten, i gryning och skymning.',
      },
    },
    night: {
      text: {
        en: 'The fish are asleep and so should I be. Eels, though. Eels never sleep.',
        sv: 'Fisken sover och det borde jag också göra. Ålen, däremot. Ålen sover aldrig.',
      },
    },
    gamli: {
      text: {
        en: 'You landed Gamli? Gamli! Forty winters I have tried. Here. My grandmother took this out of a pike’s belly. I think it was meant for you.',
        sv: 'Har du landat Gamle? Gamle! I fyrtio vintrar har jag försökt. Här. Min farmor tog det här ur magen på en gädda. Jag tror det var menat åt dig.',
      },
      do: [
        { k: 'piece', id: 'hp_myl_fisher' },
        { k: 'set', flag: 'q_fisher_done', value: true },
      ],
      next: 'gamli2',
    },
    gamli2: {
      text: {
        en: 'I let him go again. Some fish have earned it.',
        sv: 'Jag släppte tillbaka honom. En del fiskar har gjort sig förtjänta av det.',
      },
    },
    after: {
      text: {
        en: 'Every time the water swirls I think it is Gamli again. It never is. Fish away; the rod is yours as long as you like.',
        sv: 'Varje gång vattnet virvlar tror jag att det är Gamle igen. Det är det aldrig. Fiska på; spöet är ditt så länge du vill.',
      },
    },
  },
};

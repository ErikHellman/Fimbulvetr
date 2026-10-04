import type { DialogueDef } from '@core/story/dialogue';

/**
 * A thrall left behind at the drained camp in Niflmýrr, bled nearly to nothing: the twist of Act II. The
 * captives are being bled to unmake the blood-oath that holds the Rime King, and Embla got away.
 */
export const THRALL: DialogueDef = {
  entry: [{ node: 'meet' }],
  nodes: {
    meet: {
      text: {
        en: 'Warm. You are warm. Do not come close; I am poured out already, and the cold in me is hungry.',
        sv: 'Varm. Du är varm. Kom inte nära; jag är redan uttömd, och kylan i mig är hungrig.',
      },
      next: 'bled',
    },
    bled: {
      text: {
        en: 'They chained us on this bank and bled us, a little every night. Not for food. For the oath. The oath your jarl’s men swore on their own blood, to hold the King in the mountain.',
        sv: 'De kedjade oss på den här stranden och tappade oss, lite varje natt. Inte för mat. För eden. Eden som er jarls män svor på sitt eget blod, för att hålla Kungen kvar i berget.',
      },
      next: 'drain',
    },
    drain: {
      text: {
        en: 'Blood made it, and blood unmakes it. Every child of those who swore. They took eight from your valley, and they drain them hall by hall, until the oath runs thin and the mountain opens.',
        sv: 'Blod band den, och blod löser den. Varje barn till dem som svor. De tog åtta från er dal, och de tappar dem sal för sal, tills eden tunnas ut och berget öppnar sig.',
      },
      choices: [
        {
          text: {
            en: 'There was a girl with red hair. Embla.',
            sv: 'Det fanns en flicka med rött hår. Embla.',
          },
          next: 'embla',
        },
      ],
    },
    embla: {
      text: {
        en: 'The red-haired one. She slipped her chain the first night and went into the lake, west, towards the island. They never found her. Go, before they come to drink again.',
        sv: 'Den rödhåriga. Hon slank ur sin kedja första natten och gick ut i sjön, västerut, mot ön. De hittade henne aldrig. Gå, innan de kommer för att dricka igen.',
      },
      do: [{ k: 'set', flag: 'st_twist_heard', value: true }],
    },
  },
};

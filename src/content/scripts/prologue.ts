import type { ScriptDef } from '@core/story/script';
import { all, day, flag } from '../dialogue/util';

const DUSK = 20 * 60;
const DAWN = 6 * 60;

/**
 * Embla's evening scene: dusk falls, Ask is by the hearth and she talks. Her dialogue picks the day's
 * scene and sets its flag, so one script serves all three evenings.
 */
const evening: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    { k: 'do', effects: [{ k: 'setMinute', minute: DUSK }] },
    { k: 'warp', screen: 'ask_int_longhouse', at: { x: 19, y: 15 }, facing: 'n' },
    { k: 'fade', out: false },
    { k: 'talk', dialogue: 'embla', with: 'embla' },
  ],
};

/** Ask's bed: sleeps to the next morning once the day's evening scene has played; day 3 ends in the raid. */
const sleep: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: all(day(3), flag('ev_embla_d3')),
      then: [{ k: 'run', script: 'raid_begins' }],
      else: [
        {
          k: 'if',
          when: { k: 'any', of: [all(day(1), flag('ev_embla_d1')), all(day(2), flag('ev_embla_d2'))] },
          then: [
            { k: 'fade', out: true },
            {
              k: 'do',
              effects: [
                { k: 'add', flag: 'st_farm_day', n: 1 },
                { k: 'sleep', until: DAWN },
                { k: 'heal', n: 0 },
              ],
            },
            {
              k: 'if',
              when: day(2),
              then: [{ k: 'card', text: { en: 'The second day.', sv: 'Den andra dagen.' } }],
              else: [{ k: 'card', text: { en: 'The third day.', sv: 'Den tredje dagen.' } }],
            },
            { k: 'fade', out: false },
          ],
          else: [
            {
              k: 'say',
              who: 'ask',
              text: {
                en: 'Not tired yet. The day’s work is not done.',
                sv: 'Inte trött än. Dagens arbete är inte gjort.',
              },
            },
          ],
        },
      ],
    },
  ],
};

/** The end of M1a: night falls on the third day and a horn sounds. The raid itself is M1b. */
const raidBegins: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    {
      k: 'do',
      effects: [
        { k: 'setMinute', minute: 23 * 60 },
        { k: 'set', flag: 'st_raid_begun', value: true },
      ],
    },
    {
      k: 'card',
      text: {
        en: 'Night falls on the third day. The wind smells of snow. Somewhere in the dark, a horn sounds.',
        sv: 'Natten faller över den tredje dagen. Vinden luktar snö. Någonstans i mörkret ljuder ett horn.',
      },
    },
    { k: 'card', text: { en: 'To be continued…', sv: 'Fortsättning följer…' } },
    { k: 'fade', out: false },
  ],
};

const shopSigrun: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'sigrun', with: 'sigrun' },
    { k: 'shop', id: 'sigrun' },
  ],
};

export const PROLOGUE_SCRIPTS = {
  sleep,
  embla_evening: evening,
  raid_begins: raidBegins,
  shop_sigrun: shopSigrun,
} as const satisfies Record<string, ScriptDef>;

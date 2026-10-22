import type { Action } from '@core/input/actions';
import type { L10n } from '@core/i18n/t';

/** The on-screen buttons by the action they press, as prompts and the controls pages name them. */
export const TOUCH_BUTTONS: Readonly<Record<Action, L10n>> = {
  up: { en: '↑', sv: '↑' },
  down: { en: '↓', sv: '↓' },
  left: { en: '←', sv: '←' },
  right: { en: '→', sv: '→' },
  sword: { en: 'Sword', sv: 'Svärd' },
  item1: { en: 'Item 1', sv: 'Sak 1' },
  item2: { en: 'Item 2', sv: 'Sak 2' },
  galdr: { en: 'Galdr', sv: 'Galdr' },
  roll: { en: 'Roll', sv: 'Rulla' },
  shield: { en: 'Shield', sv: 'Sköld' },
  interact: { en: 'Use', sv: 'Använd' },
  menu: { en: 'Menu', sv: 'Meny' },
  map: { en: 'Map', sv: 'Karta' },
  confirm: { en: 'OK', sv: 'OK' },
  cancel: { en: 'Back', sv: 'Tillbaka' },
};

/** Short labels drawn on the buttons themselves (the overlay is DOM text, not the bitmap font). */
export const TOUCH_CAPS: Readonly<Record<Action, L10n>> = {
  ...TOUCH_BUTTONS,
  item1: { en: '1', sv: '1' },
  item2: { en: '2', sv: '2' },
};

export const TOUCH_TEXT = {
  stick: { en: 'the stick on the left', sv: 'spaken till vänster' },
  press: { en: 'Tap to begin', sv: 'Tryck för att börja' },
  works_too: {
    en: 'Keyboards and gamepads work too.',
    sv: 'Tangentbord och handkontroller fungerar också.',
  },
  tap_rows: {
    en: 'Tap a line to choose it, tap again to take it.',
    sv: 'Tryck på en rad för att välja den, tryck igen för att ta den.',
  },
  controls_hint: {
    en: 'The on-screen buttons are set in Touch controls.   {cancel}: back',
    sv: 'Skärmknapparna ställs in under Pekkontroller.   {cancel}: tillbaka',
  },
  rotate: { en: 'Turn your device sideways to play.', sv: 'Vänd enheten på sidan för att spela.' },
  arrange_help: {
    en: 'Drag the buttons where your thumbs want them.',
    sv: 'Dra knapparna dit tummarna vill ha dem.',
  },
  arrange_done: { en: 'Done', sv: 'Klar' },
  arrange_reset: { en: 'Reset', sv: 'Återställ' },
} as const satisfies Readonly<Record<string, L10n>>;

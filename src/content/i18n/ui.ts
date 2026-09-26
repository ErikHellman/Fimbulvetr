import type { L10n } from '@core/i18n/t';

export const UI = {
  webgl_required: {
    en: 'Fimbulvetr needs WebGL, which this browser has turned off or does not support.',
    sv: 'Fimbulvetr behöver WebGL, som den här webbläsaren har stängt av eller saknar stöd för.',
  },
  already_open: {
    en: 'Fimbulvetr is already open in another tab. Close it there to play here.',
    sv: 'Fimbulvetr är redan öppet i en annan flik. Stäng det där för att spela här.',
  },
  storage_unavailable: {
    en: 'Saving is unavailable in this browser window (private mode or blocked storage). Progress will not be kept.',
    sv: 'Det går inte att spara i det här webbläsarfönstret (privat läge eller blockerad lagring). Framstegen sparas inte.',
  },
  ok: { en: 'OK', sv: 'OK' },
  update_ready: {
    en: 'A new version of the game is ready. Reload now?',
    sv: 'En ny version av spelet finns. Ladda om nu?',
  },
  update_reload: { en: 'Reload', sv: 'Ladda om' },
  update_later: { en: 'Later', sv: 'Senare' },
  import_ok: { en: 'Save imported.', sv: 'Sparfilen importerades.' },
  import_checksum: {
    en: 'The save file was edited or damaged, but it loaded.',
    sv: 'Sparfilen har ändrats eller skadats, men den gick att ladda.',
  },
  import_bad_file: {
    en: 'That file is not a Fimbulvetr save.',
    sv: 'Filen är ingen sparfil från Fimbulvetr.',
  },
  import_too_new: {
    en: 'That save comes from a newer version of the game.',
    sv: 'Sparfilen kommer från en nyare version av spelet.',
  },
  import_invalid: { en: 'That save file is damaged: {detail}', sv: 'Sparfilen är skadad: {detail}' },
} as const satisfies Record<string, L10n>;

export type UiKey = keyof typeof UI;

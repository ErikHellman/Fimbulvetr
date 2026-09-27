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
  speaker_ask: { en: 'Ask', sv: 'Ask' },
  shop_leave: { en: 'Leave', sv: 'Gå' },
  shop_ok: { en: 'Thank you kindly.', sv: 'Tack så mycket.' },
  shop_poor: { en: 'You have too little silver.', sv: 'Du har för lite silver.' },
  shop_owned: { en: 'You already have one.', sv: 'Du har redan en.' },
  shop_full: { en: 'You cannot carry more.', sv: 'Du kan inte bära fler.' },
  shop_unknown: { en: 'That is not for sale.', sv: 'Den är inte till salu.' },
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
  game_over: { en: 'You have fallen.', sv: 'Du har fallit.' },
  menu_items: { en: 'Items', sv: 'Saker' },
  menu_map: { en: 'Map', sv: 'Karta' },
  menu_quests: { en: 'Quests', sv: 'Uppdrag' },
  menu_system: { en: 'Game', sv: 'Spel' },
  menu_tabs_hint: {
    en: 'Left/Right: page   Esc or Tab: back to the game',
    sv: 'Vänster/Höger: sida   Esc eller Tab: tillbaka till spelet',
  },
  menu_items_hint: {
    en: 'K or E: put in slot K   L: put in slot L   E on food: eat',
    sv: 'K eller E: lägg i fack K   L: lägg i fack L   E på mat: ät',
  },
  menu_no_items: { en: 'You carry nothing you can use yet.', sv: 'Du bär inget du kan använda än.' },
  menu_no_quests: { en: 'Nothing to do yet.', sv: 'Inget att göra än.' },
  menu_quest_done: { en: 'done', sv: 'klart' },
  menu_here: { en: 'You are here', sv: 'Du är här' },
  menu_resume: { en: 'Back to the game', sv: 'Tillbaka till spelet' },
  menu_start_over: { en: 'Start a new game', sv: 'Börja ett nytt spel' },
  menu_start_over_confirm: {
    en: 'Start over from the first day? Press E again to confirm.',
    sv: 'Börja om från första dagen? Tryck E igen för att bekräfta.',
  },
  game_over_continue: { en: 'Rise again: E or Enter', sv: 'Res dig igen: E eller Enter' },
} as const satisfies Record<string, L10n>;

export type UiKey = keyof typeof UI;

export const LANGS = ['en', 'sv'] as const;
export type Lang = (typeof LANGS)[number];

/** Player-facing text in every supported language. A missing language is a compile error. */
export type L10n = Readonly<Record<Lang, string>>;

/** Picks the language and fills `{name}` placeholders; unknown placeholders stay visible. */
export function t(text: L10n, lang: Lang, vars: Readonly<Record<string, string | number>> = {}): string {
  return text[lang].replace(/\{(\w+)\}/g, (whole: string, key: string) => {
    const value = vars[key];
    return value === undefined ? whole : String(value);
  });
}

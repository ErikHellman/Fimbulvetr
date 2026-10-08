import { CREDITS, FINAL_CREDITS } from '@content/credits';
import { t, type Lang } from '@core/i18n/t';
import type { CreditsRoll } from '@core/story/script';

/**
 * Where the credits stand `t` ticks into a roll of `of`: the lines in order, and the top line's y. They
 * rise from just below the screen (`height`) until the last line has passed the middle, then hold. `roll`
 * picks the demo's credits or the game's last ones.
 */
export function creditsRoll(
  lang: Lang,
  t0: number,
  of: number,
  height: number,
  lineHeight: number,
  roll: CreditsRoll = 'demo',
): { readonly lines: readonly string[]; readonly y: number } {
  const lines = (roll === 'end' ? FINAL_CREDITS : CREDITS).map((l) => t(l, lang));
  const travel = height / 2 + lines.length * lineHeight;
  const share = Math.min(1, t0 / Math.max(1, of * 0.85));
  return { lines, y: Math.round(height - share * travel) };
}

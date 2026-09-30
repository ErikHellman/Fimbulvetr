import { describe, expect, it } from 'vitest';
import { textWidth } from '@art/font';
import { DEFAULT_SETTINGS } from '@shell/platform/settings';
import { GAME_W } from '@shell/scale';
import { openIntro } from '@shell/ui/intro';
import { INTRO_LEFT, introColumn, introLines } from '@shell/ui/introText';

describe('intro text', () => {
  it('names the default keys', () => {
    const { values } = introLines(openIntro(), DEFAULT_SETTINGS, 'en');
    const all = values.join('\n');
    expect(all).toContain('W A S D');
    expect(all).toContain('J');
    expect(all).toContain('Space');
    expect(all).toContain('K, L');
  });

  it('follows remapped keys', () => {
    const s = { ...DEFAULT_SETTINGS, keys: { sword: ['KeyU'] } };
    const { labels, values } = introLines(openIntro(), s, 'en');
    expect(values[labels.findIndex((l) => l.includes('Sword'))]).toBe('U');
  });

  it('draws the checkbox ticked or not, with the cursor on Begin', () => {
    const plain = introLines(openIntro(), DEFAULT_SETTINGS, 'en').labels;
    expect(plain).toContain('  [ ] Don’t show this again');
    expect(plain).toContain('> Begin');
    const ticked = introLines({ cursor: 0, dontShow: true }, DEFAULT_SETTINGS, 'en').labels;
    expect(ticked).toContain('> [x] Don’t show this again');
  });

  it('speaks Swedish', () => {
    const { heading, labels } = introLines(openIntro(), DEFAULT_SETTINGS, 'sv');
    expect(heading).toBe('Så spelar du');
    expect(labels).toContain('> Börja');
  });

  it('fits the screen in both languages', () => {
    for (const lang of ['en', 'sv'] as const) {
      const { heading, labels, values, hint } = introLines(
        { cursor: 0, dontShow: true },
        DEFAULT_SETTINGS,
        lang,
      );
      const column = introColumn(labels, values);
      labels.forEach((l, i) => {
        const w = values[i] === '' ? textWidth(l) : column + textWidth(values[i] ?? '');
        expect(INTRO_LEFT + w, l).toBeLessThanOrEqual(GAME_W - INTRO_LEFT);
      });
      expect(textWidth(heading)).toBeLessThan(GAME_W);
      expect(textWidth(hint), hint).toBeLessThan(GAME_W - 16);
    }
  });
});

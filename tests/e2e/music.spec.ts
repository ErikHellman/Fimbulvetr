import { expect, test, type Page } from '@playwright/test';
import { boot } from './helpers';

/** Puts an analyser in front of the speakers, so a test can tell whether anything is heard. */
async function tapOutput(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with an explicit this below
    const connect = AudioNode.prototype.connect as (this: AudioNode, ...a: unknown[]) => unknown;
    AudioNode.prototype.connect = function (this: AudioNode, ...args: unknown[]) {
      const w = window as unknown as { __analyser?: AnalyserNode };
      if (args[0] === this.context.destination && w.__analyser === undefined) {
        const a = this.context.createAnalyser();
        w.__analyser = a;
        connect.call(a, this.context.destination);
        return connect.call(this, a, ...args.slice(1));
      }
      return connect.apply(this, args);
    } as typeof AudioNode.prototype.connect;
  });
}

const loudness = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const a = (window as unknown as { __analyser?: AnalyserNode }).__analyser;
    if (a === undefined) return -1;
    const d = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(d);
    return Math.sqrt(d.reduce((s, v) => s + v * v, 0) / d.length);
  });

test('the title plays the main theme, audibly, once a key unlocks sound', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await tapOutput(page);
  await page.goto('/');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 15_000 });
  await page.keyboard.press('Space');
  await expect(page.locator('body[data-music="music_title"]')).toBeAttached({ timeout: 20_000 });
  await expect.poll(() => loudness(page), { timeout: 10_000 }).toBeGreaterThan(0.01);
  expect(errors).toEqual([]);
});

test('the field plays its region theme, and the winter variant in winter', async ({ page }) => {
  await boot(page, 'nosave&screen=ask_field&time=12:00&season=summer');
  await page.keyboard.press('Shift');
  await expect(page.locator('body[data-music="music_askdalr"]')).toBeAttached({ timeout: 20_000 });
  await boot(page, 'nosave&screen=ask_field&time=12:00&season=winter');
  await page.keyboard.press('Shift');
  await expect(page.locator('body[data-music="music_askdalr_winter"]')).toBeAttached({ timeout: 20_000 });
});

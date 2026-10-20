// Captures the promotional screenshots and trailer in promo/ from a `--mode test` build (dev query honoured).
/* global window */
// Usage: pnpm build:test && pnpm preview --port 4173, then `pnpm promo` (needs ffmpeg with libx264 on PATH).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.PROMO_URL ?? 'http://localhost:4173';
const OUT = 'promo';
const FONT = process.env.PROMO_FONT ?? '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

/** Screenshot name → dev query. Rolled weather is off, so each shot is the same on every run. */
const SHOTS = {
  '01-askdalr-village': 'preset=morning&screen=ask_village&at=20,12&time=10:00&season=summer&weather=clear',
  '02-raid-night': 'preset=raid&screen=ask_farmyard&at=20,12&weather=clear',
  '03-myrkvidr-forest': 'preset=myr&screen=myr_deep&at=20,12&weather=clear&time=11:00',
  '04-myrland-mill': 'preset=myl&screen=myl_mill&at=20,12&weather=clear&time=17:30',
  '05-uppvik-square': 'preset=uppvik&screen=upp_square&at=20,12&weather=clear',
  '06-haugar-stone-circle': 'preset=hau&screen=hau_circle&at=20,12&weather=clear&season=autumn',
  '07-fimbulvetr-pass': 'preset=hau&screen=hau_pass&weather=snow',
  '08-saevatn-holm': 'preset=sae&screen=sae_holmr&at=20,12&weather=clear&season=summer',
  '09-hrimfjoll-glacier': 'preset=hrf&screen=hrf_glacier&at=20,12&weather=snow',
  '10-trollskog-night': 'preset=myr&screen=myr_trollskog&at=20,12&time=22:30&weather=clear',
};

const launch = () =>
  chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  });

async function open(page, query) {
  const title = query === 'title=1';
  await page.goto(`${BASE}/?nosave&mute&rolled=0${title ? '' : '&title=0'}&${query}`);
  if (title) await page.waitForTimeout(2500);
  else await page.waitForFunction(() => window.__fimbul?.ready === true, undefined, { timeout: 30_000 });
  await page.waitForTimeout(900);
}

async function screenshots() {
  mkdirSync(join(OUT, 'screenshots'), { recursive: true });
  const browser = await launch();
  // 1920×1080 is a whole 3× of the 640×360 canvas, so pixels stay crisp.
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const [name, query] of Object.entries({ '00-title': 'title=1', ...SHOTS })) {
    await open(page, query);
    await page.waitForTimeout(1600);
    await page.locator('canvas').screenshot({ path: join(OUT, 'screenshots', `${name}.png`) });
    console.log(name);
  }
  await browser.close();
}

async function trailer() {
  const dir = mkdtempSync(join(tmpdir(), 'promo-'));
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };
  const swing = async (n) => {
    for (let i = 0; i < n; i++) await hold('KeyJ', 120).then(() => page.waitForTimeout(250));
  };
  /** Each scene: a dev query and what the hero does there (about 3 s). */
  const scenes = [
    ['title=1', () => page.waitForTimeout(3000)],
    [
      SHOTS['01-askdalr-village'].replace('20,12', '12,12'),
      () => hold('ArrowRight', 1800).then(() => hold('ArrowDown', 1200)),
    ],
    [SHOTS['03-myrkvidr-forest'].replace('20,12', '20,14'), () => hold('ArrowUp', 1500).then(() => swing(3))],
    [
      SHOTS['04-myrland-mill'].replace('20,12', '14,6'),
      () => hold('ArrowRight', 2000).then(() => hold('ArrowDown', 1000)),
    ],
    [
      SHOTS['05-uppvik-square'].replace('20,12', '20,16'),
      () => hold('ArrowUp', 1500).then(() => hold('ArrowLeft', 1500)),
    ],
    [SHOTS['02-raid-night'], () => hold('ArrowLeft', 1000).then(() => swing(4))],
    [SHOTS['06-haugar-stone-circle'].replace('20,12', '20,18'), () => hold('ArrowUp', 3000)],
    [SHOTS['07-fimbulvetr-pass'], () => hold('ArrowDown', 3000)],
    [
      SHOTS['08-saevatn-holm'].replace('20,12', '18,12'),
      () => hold('ArrowLeft', 1500).then(() => hold('ArrowDown', 1500)),
    ],
    [SHOTS['10-trollskog-night'], () => hold('ArrowRight', 1500).then(() => swing(3))],
    [SHOTS['09-hrimfjoll-glacier'], () => hold('ArrowUp', 1500).then(() => hold('ArrowRight', 1500))],
  ];
  const segs = [];
  for (const [query, act] of scenes) {
    await open(page, query);
    const start = (Date.now() - t0) / 1000;
    await act();
    await page.waitForTimeout(300);
    segs.push([start, (Date.now() - t0) / 1000]);
    console.log(query);
  }
  await ctx.close();
  await browser.close();

  // Cut the scenes out of the recording (loading gaps dropped), fade between them, end on a title card.
  const webm = join(
    dir,
    readdirSync(dir).find((f) => f.endsWith('.webm')),
  );
  const fd = 0.35;
  const parts = segs.map(([s, e], i) => {
    const d = Math.min(e - s - 0.2, i === 0 ? 2.6 : 3.0);
    return `[0:v]trim=start=${(s + 0.1).toFixed(2)}:duration=${d.toFixed(2)},setpts=PTS-STARTPTS,fade=t=in:st=0:d=${fd},fade=t=out:st=${(d - fd).toFixed(2)}:d=${fd}[v${i}]`;
  });
  const text = (t, color, size, y) =>
    `drawtext=fontfile=${FONT}:text='${t}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=h*${y}`;
  parts.push(
    `[0:v]trim=start=${(segs[0][0] + 0.1).toFixed(2)}:duration=3.2,setpts=PTS-STARTPTS,` +
      `${text('Play free in your browser', '0xe8d9a8', 34, 0.62)},${text('fimbulvetr.hellman.cloud', 'white', 42, 0.7)},` +
      `fade=t=in:st=0:d=${fd},fade=t=out:st=2.6:d=0.6[vend]`,
  );
  parts.push(
    `${segs.map((_, i) => `[v${i}]`).join('')}[vend]concat=n=${segs.length + 1}:v=1:a=0,format=yuv420p[out]`,
  );
  execFileSync('ffmpeg', [
    ...['-v', 'error', '-y', '-i', webm, '-filter_complex', parts.join(';'), '-map', '[out]'],
    ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-movflags', '+faststart', '-r', '25'],
    join(OUT, 'trailer.mp4'),
  ]);
  rmSync(dir, { recursive: true, force: true });
  console.log('trailer.mp4');
}

const only = process.argv[2];
if (only !== 'trailer') await screenshots();
if (only !== 'screenshots') await trailer();

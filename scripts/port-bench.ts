// The Apple TV feasibility check (`pnpm port:bench`): evaluates dist-port/fimbulvetr-core.js in a bare
// context (no DOM, no console, no timers, like a JSContext on tvOS) and times the busiest screens of the
// M10a save, and how long generating the art takes. Run under Bun, which is JavaScriptCore; BUN_JSC_useJIT=0 approximates an app's JSContext,
// which runs without the JIT.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { DB } from '@content/index';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { tileFeet, type TilePos } from '@core/world/screen';
import type { PortArt } from '@port/art';
import type { PortCore } from '@port/core';

const TICKS = 600;
const SCREENS: readonly ScreenId[] = [
  'ask_farmyard',
  'ask_int_longhouse',
  'upp_smiths',
  'hau_pass',
  'hau_watch',
  'myl_weir',
];

function arrival(screen: ScreenId): TilePos {
  for (const id of SCREEN_IDS)
    for (const t of DB.screens[id].things) if (t.k === 'door' && t.to === screen) return t.arrive;
  const spawn = DB.screens[screen].spawns?.[0];
  if (spawn === undefined) throw new Error(`no way into ${screen}`);
  return spawn;
}

const bundle = readFileSync('dist-port/fimbulvetr-core.js', 'utf8');
const context: { FimbulvetrCore?: { createPort: () => PortCore; buildPortArt: () => PortArt } } = {};
const load = performance.now();
runInNewContext(bundle, context);
const core = context.FimbulvetrCore;
if (core === undefined) throw new Error('the bundle did not define FimbulvetrCore');
const save = readFileSync('tests/fixtures/saves/v1-m10a.json', 'utf8');
const port = core.createPort();
const err = port.boot(save, 1);
if (err !== '') throw new Error(err);
const loadMs = performance.now() - load;
const artStart = performance.now();
const art = core.buildPortArt();
const artMs = performance.now() - artStart;

const jit = process.env.BUN_JSC_useJIT === '0' ? 'JIT off' : 'JIT on';
const rows: string[] = [];
let worst = 0;
for (const screen of SCREENS) {
  const p = tileFeet(arrival(screen));
  port.command(JSON.stringify({ t: 'warp', screen, x: p.x, y: p.y }));
  port.step(0, 0, 0);
  port.step(0, 0, 0);
  const start = performance.now();
  for (let i = 0; i < TICKS; i++) port.step(0, 0, 0);
  const ms = (performance.now() - start) / TICKS;
  worst = Math.max(worst, ms);
  rows.push(`  ${screen.padEnd(20)} ${ms.toFixed(3)} ms/tick`);
}
console.log(`port bench (${jit}): bundle load + boot ${loadMs.toFixed(0)} ms`);
console.log(
  `  art: ${artMs.toFixed(0)} ms for ${String(art.pages.length)} sprite pages and ${String(art.tileCount)} tiles`,
);
console.log(rows.join('\n'));
console.log(
  `  worst ${worst.toFixed(3)} ms/tick of the 16.7 ms frame (${((worst / 16.7) * 100).toFixed(1)}%)`,
);

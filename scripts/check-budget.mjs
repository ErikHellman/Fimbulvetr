// Fails the build when the gzipped JavaScript grows past the budget from the design spec.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 730;
const dir = 'dist/assets';
let total = 0;
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith('.js'))
  .sort()) {
  const gz = gzipSync(readFileSync(join(dir, file))).length;
  total += gz;
  console.log(`${file.padEnd(48)} ${(gz / 1024).toFixed(1).padStart(7)} KB gz`);
}
console.log(`total ${(total / 1024).toFixed(1)} KB gz (budget ${BUDGET_KB} KB)`);
if (total > BUDGET_KB * 1024) {
  console.error('JavaScript is over budget.');
  process.exit(1);
}

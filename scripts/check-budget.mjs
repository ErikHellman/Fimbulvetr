// Fails the build when the gzipped JavaScript grows past the budget from the design spec.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 730;
const dir = 'dist';

if (!existsSync(dir)) {
  console.error('dist/ not found — run pnpm build first.');
  process.exit(1);
}

let total = 0;
const files = readdirSync(dir, { recursive: true })
  .filter((f) => f.endsWith('.js'))
  .sort();

for (const file of files) {
  const fullPath = join(dir, file);
  const gz = gzipSync(readFileSync(fullPath)).length;
  total += gz;
  console.log(`${file.padEnd(48)} ${(gz / 1024).toFixed(1).padStart(7)} KB gz`);
}
console.log(`total ${(total / 1024).toFixed(1)} KB gz (budget ${BUDGET_KB} KB)`);
if (total > BUDGET_KB * 1024) {
  console.error('JavaScript is over budget.');
  process.exit(1);
}

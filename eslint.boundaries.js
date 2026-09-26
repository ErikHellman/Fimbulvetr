// @ts-check
/** Layer and determinism rules for src/. Used by eslint.config.js and tests/tooling/boundaries.test.ts. */

const noShell = { regex: '^@shell/|(^|/)shell/', message: 'Only src/shell may import the shell layer.' };
const noPhaser = { regex: '^phaser($|/)', message: 'Phaser is only allowed in src/shell.' };
const noArt = { regex: '^@art/|(^|/)art/', message: 'This layer must not depend on art.' };
const contentTypesOnly = {
  regex: '^@content/|(^|/)content/',
  allowTypeImports: true,
  message: 'core may only import types from content (use `import type`).',
};

const noEntropy = [
  { object: 'Math', property: 'random', message: 'Use the seeded Rng from @core/math/rng.' },
  { object: 'Date', property: 'now', message: 'No wall-clock time in pure layers; pass time in.' },
];
const noEngineTrig = ['sin', 'cos', 'tan', 'atan2', 'hypot'].map((property) => ({
  object: 'Math',
  property,
  message: `Math.${property} can differ between browsers; the core must stay deterministic.`,
}));
const noNewDate = {
  selector: "NewExpression[callee.name='Date']",
  message: 'No wall-clock time in pure layers; pass time in.',
};

/** @type {import('eslint').Linter.Config[]} */
export const boundaryConfigs = [
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noShell, noPhaser, noArt, contentTypesOnly] }],
      'no-restricted-properties': ['error', ...noEntropy, ...noEngineTrig],
      'no-restricted-syntax': ['error', noNewDate],
    },
  },
  {
    files: ['src/content/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noShell, noPhaser, noArt] }],
      'no-restricted-properties': ['error', ...noEntropy],
      'no-restricted-syntax': ['error', noNewDate],
    },
  },
  {
    files: ['src/art/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noShell, noPhaser] }],
      'no-restricted-properties': ['error', ...noEntropy],
      'no-restricted-syntax': ['error', noNewDate],
    },
  },
];

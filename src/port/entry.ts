import { createPort } from './core';

/**
 * The bundle a native shell evaluates in JavaScriptCore (`pnpm port:build` → dist-port/fimbulvetr-core.js).
 * It only defines `globalThis.FimbulvetrCore`; the host creates a port and drives it.
 */
(globalThis as { FimbulvetrCore?: unknown }).FimbulvetrCore = { createPort };

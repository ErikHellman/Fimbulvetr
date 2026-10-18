import { buildPortArt } from './art';
import { createPort } from './core';

/**
 * The bundle a native shell evaluates in JavaScriptCore (`pnpm port:build` → dist-port/fimbulvetr-core.js).
 * It only defines `globalThis.FimbulvetrCore`: the host builds the art once and creates a port to drive.
 */
(globalThis as { FimbulvetrCore?: unknown }).FimbulvetrCore = { createPort, buildPortArt };

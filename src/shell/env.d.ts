/// <reference types="vite-plugin-pwa/client" />

/** Short git hash (CI) or 'dev'; stamped into every save as `build`. */
declare const __BUILD_ID__: string;

/** The game's version, from package.json; shown on the title screen. */
declare const __APP_VERSION__: string;

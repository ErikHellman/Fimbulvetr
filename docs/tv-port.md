# TV port plan: Android TV and Apple TV

Decided 2026-10-18 in the "Google Cast and AirPlay" thread. The two platforms take different routes, because tvOS has no web view at all.

- **Android TV** runs the unchanged web build inside a small native app (a full-screen WebView). All the code is shared, and only the controller bridge and some TV details are new.
- **Apple TV** gets a native Swift app. It runs the pure TypeScript layers (`src/core`, `src/content`, `src/art`, about 90% of the code) inside JavaScriptCore and replaces only the Phaser shell (about 7k lines) with Swift.

A full engine port (Unity, Godot) was rejected: it rewrites everything to avoid rewriting the shell, and it drops the shared tests and the web version.

## Android TV

| Step | What | State |
| --- | --- | --- |
| T1 | `android/` app: one Java Activity, WebView serving the web build from the APK on `https://appassets.androidplatform.net` (secure origin: IndexedDB saves, Web Locks, workers). Leanback launcher, banner, full screen, landscape, screen kept on. | done |
| T1 | Controller bridge: `PadBridge` turns Android gamepad keys, hat and axes into a standard-layout pad that the game polls through `window.FimbulvetrHost` (`src/shell/platform/host.ts`). Remote: the centre button is Enter and Back is Escape plus Start (cancel in menus, the pause menu in play). | done |
| T1 | Game side: no Import or Export on the title (no files on a TV), Back on the title's main list closes the app, and no service worker (the store updates the app). | done |
| T1 | `pnpm android:web` copies the build in, and the "Android TV" workflow builds a debug APK as a CI artifact. | done |
| T2 | Sideload on a real Android TV or Google TV: controller feel, remote menus, audio start, frame time, saves surviving an app update. Fix what turns up. | needs Erik's TV |
| T3 | TV polish: an overscan margin setting if HUD edges get cut, a controller-required notice when only a remote is connected, and a "press any button" that names the pad. | |
| T4 | Release: upload key and signing, a Play Console app with a TV listing and screenshots, and Google's TV app quality checklist. | needs Erik's accounts |

## Apple TV

| Step | What | State |
| --- | --- | --- |
| A1 | `src/port`: the rules behind a string-and-number API (`createPort`: boot from a save or a seed, `step(held, mx, my)`, commands, hash, status, save text). `pnpm port:build` makes `dist-port/fimbulvetr-core.js`, one classic script that needs no DOM, console or timers. | done |
| A1 | Feasibility: `pnpm port:bench` runs the bundle in a bare context under Bun (JavaScriptCore). App JSContexts run without the JIT; with the JIT off, the busiest screen of the M10a save costs 0.25 ms a tick (1.5% of a 60 Hz frame) on the dev container. | done |
| A2 | Events and art through the port: sound and autosave events from `step`, and the generated textures (RGBA) and sounds (Float32Array) handed out once at boot. Measure art generation time in JavaScriptCore. | next |
| A3 | A draw list: move what the Phaser views decide (which frame, where, depth, tint, lights, darkness, weather, colour matrix) into a pure `present` layer that the web shell also draws from. Both renderers then draw the same list, and the native one stays thin. Done view by view behind the existing e2e and gallery checks. | the large step |
| A4 | `apple/` Xcode project (Swift): a JSContext loads the bundle; Metal or SpriteKit draws the list; GameController reads the pad and the Siri Remote; AVAudioEngine plays the sound and music buffers; saves go to iCloud key-value storage, because tvOS may purge local files. | needs Erik's Mac (Remote Control) |
| A5 | Release: Apple Developer Program, TestFlight on the Apple TV, App Store listing; declare game controller support and decide what the Siri Remote can do. | needs Erik's accounts |

## Notes

- Saves are about 15 KB of JSON, well inside iCloud key-value limits.
- The Android app has no third-party dependencies. The Android SDK cannot be downloaded in the cloud dev container, so APKs are built by CI (or on a Mac with Android Studio).
- Determinism means the Apple TV build can be checked against the web build: the same inputs must give the same `hash()`.

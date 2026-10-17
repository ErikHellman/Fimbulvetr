# Music: analysis and plan

Fimbulvetr 1.0 shipped with sound effects but no music. This note covers what the game needs, what free music exists, why the first soundtrack is composed in code, and how real recordings replace it later.

## What the game needs

The design document asks for one theme per region (8, each with a winter variant), one per dungeon (8), a town theme, a boss theme, a final-boss theme and credits, about 30 tracks. The style is Nordic folk: nyckelharpa, tagelharpa, lyre and frame drum over light orchestration. On top of that sits an adaptive layer: combat adds a percussion stem, night adds a low drone, and both fade out over about 3 s once the trigger ends.

The game itself sets a few hard constraints:

| Constraint | Source | Consequence for music |
| --- | --- | --- |
| Everything runs in the browser and loads fast | GDD, "Load time" | Tracks must stream or be small. 30 tracks of OGG at 96 kbps and about 1.5 min each come to roughly 30–35 MB. |
| Total under 60 MB | GDD | Recorded music would be about half the whole budget. |
| Public, free web game (MIT code) | repo | Only CC0, or CC-BY with credits, is safe. No NC/ND, no "free for personal use" packs. |
| Real assets replace placeholders by key, with no code changes | GDD, asset pipeline | Music has to play under fixed keys, like the SFX do. |
| Safari: Web Audio, no Ogg Vorbis on older versions | GDD, Safari audit | Recordings need an AAC fallback. Generated audio sidesteps the issue. |

### Where each track plays

| Situation | Track |
| --- | --- |
| Title screen | `music_title` (the main theme) |
| Outdoors in a region | `music_<region>`, or `music_<region>_winter` when that region's season is winter (Hrímfjöll is always winter until it thaws) |
| Askdalr village and Uppvík, inside and out | `music_town` |
| Inside a dungeon | `music_d1` … `music_d8` |
| A boss on the screen | `music_boss`. Mini-bosses keep the dungeon theme with the combat drums. |
| Hrímnir, the Rime King | `music_final` (the main theme, dark) |
| The credits roll | `music_credits` (the main theme, bright) |
| A living foe within 7 tiles | + combat stem |
| Night, under the open sky | + night stem (not indoors, in caves or in dungeons) |

## Free music: what is out there

I looked for Nordic or Viking folk music that a public, free web game could ship:

- **CC0:** there is very little. OpenGameArt has single tracks such as "Viking March" (CC0), but nothing close to 29 tracks in one consistent style, and almost nothing with nyckelharpa.
- **CC-BY (credit required):** OpenGameArt has loops such as Hobgoblin's "Looping medieval track" (CC-BY 4.0). These are medieval rather than Nordic, and mixing several composers gives an uneven soundtrack.
- **Free packs on itch.io:** NEFERA's [Free Viking Music Pack](https://nefera.itch.io/free-viking-music-pack) (3 loops: main, ambient, combat; free with credit), alkakrab's [Free Viking Folk Music Pack](https://alkakrab.itch.io/free-viking-folk-music-pack) (6 tracks; "free for commercial use", with no explicit licence text), and Ivan Duch's [Northlanders](https://ivanduch.itch.io/northlanders) (nyckelharpa and tagelharpa; pay what you want, credit required). None covers more than a handful of tracks, and two have unclear terms.
- **Paid packs** with the right sound exist: Eamon Coughlan's [Nordic / Viking RPG Music](https://eamon-music.itch.io/nordic-rpg-music) (6 nyckelharpa tracks with stems, about $10) and BLACKMID's Nordic Viking Folk Music (10 tracks, royalty-free). These are the best route to real recordings later, but they still don't reach 29 tracks or include winter variants.

**Conclusion:** free packs can't cover the soundtrack. They would supply at most 10 tracks, in mixed styles, with no winter variants and no matching combat or night stems, at 10–35 MB of download and with licences that need checking one by one.

## Decision: compose the placeholder soundtrack in code

The game already draws its placeholder art in code and synthesises its placeholder SFX. Music follows the same pattern, and it fits the constraints:

- **Size:** zero bytes of audio. The composer adds about 8 KB gzipped of JavaScript; the budget stays green (670.8 of 730 KB).
- **Licence:** original work under the repo's MIT licence. No credits are needed.
- **Coverage:** all 29 tracks, every winter variant, and combat and night stems that are in time and in key with every track.
- **Consistency:** one sound and one set of instruments across the whole game. The main theme comes back in the last battle and the credits, and each winter variant plays the same tune as its region.
- **Replaceable:** each track plays under its final key. A recording loaded into Phaser's audio cache under that key wins, so real music drops in with no code changes, as the GDD's pipeline requires.

The trade-off is quality: synthesised instruments sound like a good chiptune folk band, not like a real nyckelharpa. That is the right level for a placeholder, and it keeps the game honest about what it is until real recordings exist.

### How it works

- **Score** (`src/art/music/scores.ts`): a few settings per track: mode (dorian, aeolian, phrygian, mixolydian, lydian, ionian), tonic, tempo, 3/4 polska or 4/4, lead instrument, accompaniment, drums, how busy, and how much reverb.
- **Composer** (`src/art/music/compose.ts`): writes a tune in sections (A A′ B A′), from motifs seeded by the track's theme. Strong beats lean on chord tones, and phrases end on the fifth or the tonic. Under the tune go lyre arpeggios, bowed chords, a bass, a tagelharpa-like drone on tonic and fifth, and frame drums. It also writes two four-bar stems: driving frame drums and shakers for combat, and a low drone with a far-off flute call for night.
- **Instruments** (`src/art/music/voices.ts`): a bowed "nyckelharpa" (band-limited saws with vibrato and a sympathetic octave), a Karplus–Strong lyre, a breathy bone flute, a bowed pad, a bass, a drone, a frame drum, a tom and a shaker.
- **Renderer** (`src/art/music/render.ts`): mixes the notes into a seamless loop, where tails wrap round to the start, through a small Schroeder hall reverb. It renders at 22 050 Hz, which takes about a second per track.
- **Player** (`src/shell/audio/music.ts`): renders in a Web Worker, keeps three tracks in memory (about 13 MB each), crossfades between tracks, and fades the stems in fast and out slowly. It plays at master volume × the new **Music** setting (default 6/10). `?mute` silences it.

### The themes

| Track | Mode, metre, tempo | Lead | Character |
| --- | --- | --- | --- |
| Title | D dorian, 4/4, 76 | fiddle | the main theme |
| Askdalr | G mixolydian polska, 104 | fiddle | home, lilting |
| Myrkviðr | A aeolian, 74 | fiddle over bowed chords | dark wood |
| Mýrland | E dorian, 3/4, 86 | lyre | the bog |
| Haugar | D phrygian, 66 | fiddle, heartbeat drum | barrow hills |
| Niflmýrr | B aeolian, 62 | flute over a drone | mist |
| Sævatn | F lydian, 3/4, 92 | lyre with arpeggios | water |
| Dvergagröf | E phrygian march, 96 | fiddle | the dwarves |
| Hrímfjöll | B dorian, 70 | fiddle, wide reverb | frost |
| Winter variants | same tune, about 15% slower | flute over bowed chords, no drums | |
| Town | G ionian polska, 116 | fiddle and lyre | Uppvík and the village |
| Dungeons 1–8 | each its own mode and tempo | lyre, fiddle or flute | from the root cave to Útgarðr |
| Boss | E phrygian, 132, war drums | fiddle | |
| Last battle | the main theme in D phrygian, 120, war drums | fiddle | |
| Credits | the main theme in D mixolydian, 84 | fiddle and lyre | spring after the winter |

## Replacing it with real music later

1. Commission or buy tracks (the paid packs above are good candidates for a first pass), as OGG with an AAC/M4A fallback, 96 kbps, made to loop.
2. Load each one in `BootScene` with `this.load.audio('music_askdalr', ['…ogg', '…m4a'])`. Stems are optional, under `music_askdalr_combat` and `music_askdalr_night`, and must have the same length as the track or divide it evenly.
3. Nothing else changes. The player prefers a loaded recording over the composer. Region tracks should load lazily on first entry, as the GDD plans for atlases.
4. For CC-BY tracks, add the credit lines to `src/content/credits.ts` (en and sv).

## Open points

- **Listen-through:** the tunes come from seeded rules, so some will be better than others. A theme you don't like is fixed by changing its `theme` seed or settings in `scores.ts`, without touching the composer.
- **Memory:** three cached tracks take about 40 MB of decoded audio. If phones struggle, keep two.

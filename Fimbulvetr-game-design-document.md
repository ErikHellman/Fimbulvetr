# Fimbulvetr (working title) — Game Design Document

Sep 26, 2026 · Erik

> **Revision 2 — Sep 26, 2026.** Reviewed against Phaser 4.2.1 and revised. Full rationale, architecture and
> roadmap: [`docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`](docs/superpowers/specs/2026-09-26-fimbulvetr-design.md).
> Changes: Phaser 4 renders through WebGL 1 / GLSL ES 1.00 with no Canvas fallback, and custom shaders are replaced by built-in filters · `pixelArt: true` with integer zoom and a 640×352 playfield · flip-screen world, no 3×3 streamer · hybrid seasons (story sets, clock cycles) · text maps and typed TS content instead of Tiled + JSON Schema · pure-TS core with a thin Phaser shell · 36 heart pieces (max 20 hearts) · sequence-break and gate fixes (ferry, frozen lake, seal-skin, Hrímfjöll, D7) · gamepad layout · Embla joins at the Refuge · Safari storage mitigations · open questions resolved · code-drawn placeholder art and procedural SFX · build plan replaced by an AI-driven 12-milestone roadmap.

## Overview

A browser-based top-down action-adventure in the mould of *A Link to the Past*, set in a Norse-myth world: a farmhand sets out to rescue the farmer's daughter and the villagers taken by a jötunn king bound beneath the mountains. Cel-shaded 2D, four living seasons with weather and day-night, 8 dungeons, 15–20 hours, built solo with Claude Code on Phaser 4 + TypeScript, running entirely in any modern desktop browser.

**Design pillars**

1. **Every screen has a reason** — exploration is rewarded with items, secrets or story, never empty tiles.
2. **Combat is readable** — clear telegraphs, short animations, no stat spreadsheets; skill and the right tool beat grinding.
3. **The world turns** — seasons, weather and night change what you can reach and what hunts you; NPCs and the village react to the story and the calendar.
4. **Lean by design** — loads in under 5 s on a normal connection, under 150 MB RAM, 60 fps on integrated graphics in Chrome, Firefox and Safari.

**Scope targets**

| Item | Target |
| --- | --- |
| Playtime (main quest) | 15–20 h |
| Dungeons | 8 (3 lowland, 4 highland, 1 final) |
| Overworld regions | 8 |
| Seasons / weather types | 4 / 5 (clear, rain, snow, wind, fog) |
| Bosses | 9 (8 dungeon + final) |
| Enemy types | ~30, ~10 night-only or night-boosted |
| Named NPCs | ~45 |
| Side quests | ~25 |
| Galdr (spells) | 8 |
| Sub-items | 8 |
| Screen resolution | 640×360 canvas, 640×352 playfield (40×22 tiles), integer-scaled in the browser |
| Heart pieces | 36 (9 hearts); 3 start + 8 containers + 9 = 20 max |
| Initial download / total | < 8 MB / < 60 MB |

## Story

Three acts: a slow farm prologue that makes the raid hurt, a lowland act that opens the world, and a highland act with a twist that turns a rescue into a war against a jötunn. Names draw on Old Norse and the Eddas; the world is Norse-myth-inspired, not historical.

**Cast**

| Character | Role |
| --- | --- |
| Ask (hero) | Farmhand, orphan taken in by the farmer. Silent protagonist. Named for the first man, made from an ash tree. |
| Embla | The farmer's daughter, named for the first woman. Flirts with Ask daily; sharp, brave, plans to sail south. |
| Halvar | The farmer. Former huscarl of the old jarl; fought in the binding of the Rime King and hides it. |
| Gyða the goði | Village priestess-chieftain and keeper of the rune-records. Explains the legend, sends Ask out. |
| Hrímnir, the Rime King | A jötunn bound beneath the mountains by the villagers' ancestors. Wakes because the binding was sworn on their bloodlines, and the oath has been forgotten. |
| Kolbeinn | A seiðmaðr (sorcerer) who serves the jötnar. Recurring mid-game antagonist, leads the raids. |

**Prologue — the farm (30–45 min)**

1. Day 1–3 chores teach controls: herd sheep (movement, pushing), split firewood (attack, charged attack), fetch water from the well (item use, pots), scare ravens (throwing). It is late summer; the grass is tall.
2. Each evening Embla finds Ask with a new excuse to talk. Three short scenes, each ends with a joke she leaves hanging.
3. Night 3: the raid, under a first autumn storm. Ask wakes to fire. Playable escape through the burning longhouse with a pitchfork; too weak to stop the trolls and draugr. Kolbeinn takes Embla and eight villagers. Halvar is wounded defending the gate.
4. Morning: Halvar gives Ask his old seax and round shield. Gyða reveals the legend of the Rime King and that the mountain pass is closed by three runestones, carved by the ancestors and now dark.

**Act I — the lowlands (5–7 h)**

- Goal: relight the three runestones to open the mountain pass. Each stone sits at the heart of a dungeon.
- Dungeons 1–3 in any order after a short forced first one; the trading town Uppvík in Myrkviðr is reached after dungeon 1 and becomes the hub.
- Kolbeinn appears after each runestone, always one step ahead, and reveals the villagers are alive and "needed".
- Act ends at the pass: the stones open it, the hero sees the mountain glow from within, and the Rime King's breath pours out over the lowlands — the world snaps to winter whatever the calendar said. This is the Fimbulvetr.

**Act II — the highlands (7–9 h)**

- Twist on arrival: the villagers were not taken as hostages. The rune-binding under the mountain was sworn on the villagers' bloodlines; draining their descendants unmakes it. Embla is not among the drained — she escaped and is leading the captives in a hidden refuge.
- Ask finds Embla when he first reaches the Refuge on Holmr (Act II dungeons can be done in several orders, so this is tied to the place, not a dungeon count). She joins as a story companion who stays at the Refuge: she opens it as a second hub, gives quests, and her flirting shifts to something earned. She does not follow Ask into dungeons.
- Dungeons 4–7 each hold one of the Rime King's four thanes; killing all four breaks his link to the drained villagers and frees them.
- Halvar arrives in the highlands, confesses he fought the Rime King before and that his generation chose to bind rather than kill him, which caused this.

**Act III — Útgarðr (2–3 h)**

- Dungeon 8, Útgarðr, the jötunn stronghold, is a gauntlet that reuses every item and galdr.
- Kolbeinn is the penultimate boss; he can be spared or killed (affects one ending scene only).
- Hrímnir has a three-phase fight. Embla's role: she holds the binding open, which limits the arena and gives the fight a clock.
- Ending: the villagers return; the farm rebuilds (visible in the epilogue if the farm side quest is done); spring comes to the highlands for the first time. Embla sails south and asks Ask to come. A final choice picks the closing shot — stay, or go.

## World

One continuous overworld of roughly 16×12 screens (each screen a 640×352 px playfield = 40×22 tiles), split into 8 regions and gated by items and seasons rather than walls. The camera is flip-screen in the style of *Link's Awakening*: it stays on one screen and slides to the next when Ask walks off an edge. Each screen is the unit of layout, spawns, ground cover and autosave. Two hubs: the trading town Uppvík in the forest (Act I) and Embla's refuge on a lake island (Act II). The look is Viking-age Scandinavia with the myths made real: turf-roofed longhouses, a hof with carved gables, runestones, stone circles, and Yggdrasil's roots breaking through the forest floor.

| Region | Biome | Act | Gate to enter | Contains |
| --- | --- | --- | --- | --- |
| Askdalr | Farmland, village | Prologue | — | Halvar's farm, village, Gyða's hof, first trader |
| Myrkviðr | Dark forest, old pines | I | — | Dungeon 1 (Rótarhellir), Uppvík town, the völva's hut |
| Mýrland | Wetland, river | I | Boomerang | Dungeon 2 (Sökkva Kvern), fisherman, ferry |
| Haugar | Barrow hills, stone circles | I | Bombs | Dungeon 3 (Konungshaugr), old huscarl's cottage, the runestone pass |
| Niflmýrr | Fog marsh, dead trees | II | Pass open (lantern needed to see in its fog) | Dungeon 4 (Helgrind), the wandering skald, the seal-hunter on the Sævatn shore |
| Sævatn | Lake, islands | II | Pass open + seal-skin | Dungeon 5 (Sökkva Hof), the Refuge on Holmr |
| Dvergagröf | Cliffs, dwarf mines | II | Grapple chain | Dungeon 6 (Ívaldi's Forge), miners' camp, dwarf smith |
| Hrímfjöll | Glacier, peaks | II | Ember byrnie (the killing frost drains hearts without it) | Dungeon 7 (Hrímturn, door sealed until the other three thanes fall), Útgarðr (Dungeon 8) |

**Uppvík (hub, Act I)**

Mead hall (save, rest, rumours), trader, smith (armor tiers), the rune-carver's hall (galdr, seiðr upgrades), the Þing-stone (quest board), a hof (heart pieces trade), a locked longhouse that opens after Act II. Population ~20 NPCs with dialogue that changes per story flag, season and time of day. Gates close at night; the mead hall stays open.

**The Refuge (hub, Act II)**

Embla's camp on the island Holmr in Sævatn. Smaller: a healer, a trader who takes ore instead of silver, Embla's quest chain, and a war table that tracks how many captives are freed.

**Hermits and lone NPCs**

- Völva of Myrkviðr: brews mead from ingredients you gather; unlocks the blue mead. Some ingredients grow only in one season.
- The old huscarl (Haugar): teaches three sword techniques for a price.
- The skald (Niflmýrr): sells verses that reveal secrets on the pause-menu map.
- Fisherman (Mýrland): fishing minigame, heart piece; catches change with the season.
- Dwarf foreman (Dvergagröf): ore trading, side quest chain that opens a shortcut.
- The Norns' loom (Sævatn, hidden): after their quest, lets you turn the season at any hof.

**Traversal**

Warp points (one per region, unlocked on first visit) via the Farvegr galdr from dungeon 3 onward. Ferry between Mýrland and Sævatn in three seasons; in winter the lake freezes and you walk across instead. Both only after the pass opens, so neither skips Act I: the ferryman refuses to row toward the mountains before, and warm springs keep a channel open along the Mýrland shore in an ordinary winter — only after the Fimbulvetr does the lake freeze solid. Hidden caves under bombable rocks and liftable stones on most screens; some only reachable when tall grass is cut, leaves are blown away, or ice covers a river.

## Gameplay systems

Zelda 3 controls, one twist: a dodge roll and a small seiðr (MP) bar, so builds lean toward sword, galdr or items without any of them being mandatory. Seasons, weather and the day-night cycle have their own section below.

**Controls** (keyboard + gamepad, fully remappable; keyboard bindings use physical key positions, so WASD works on any layout)

| Action | Keyboard | Gamepad (standard mapping) |
| --- | --- | --- |
| Move | WASD / arrows | Left stick / d-pad |
| Sword | J | X / Square |
| Item slot 1 / 2 | K / L | B / Circle, Y / Triangle |
| Galdr | I | RT / R2 |
| Dodge roll | Space | RB / R1 |
| Shield (hold) | Shift | LB / L1 |
| Interact / lift | E | A / Cross |
| Inventory / map | Tab / M | Start / Select |

**Combat**

- Sword: 3-hit combo, held-button spin attack, dash thrust (learned). Damage scales by weapon tier, not level.
- Round shield: blocks projectiles and light melee; heavy attacks stagger through it.
- Dodge roll: 12 i-frames, short cooldown. Rolling through an enemy's back opens a critical.
- Enemies telegraph 300–500 ms before every attack. Roughly 30 types across 6 families: vargar (wolves and beasts), draugr and haugbúar (undead), trolls, vættir (nature spirits: nykr, huldra, mara), dvergar constructs, jötnar (frost and fire giants). Trolls turn to stone at sunrise and can be lifted for loot.
- No experience points. Power comes from hearts, gear, galdr and techniques.

**Sub-items** (two active slots)

| Item | Found | Use in combat | Use in traversal/puzzles |
| --- | --- | --- | --- |
| Lantern | Trader, prologue | Burns cobwebs, lights braziers | Dark rooms, night, fog |
| Boomerang | Dungeon 1 | Stuns, retrieves | Hits far switches, blows leaf piles |
| Bombs | Dungeon 2 | AoE damage | Cracked walls, rocks, snowdrifts |
| Bow | Dungeon 3 | Ranged damage; fire/ice arrows later | Eye switches |
| Seal-skin | Seal-hunter's quest, Niflmýrr shore of Sævatn | — | Swimming, Sævatn |
| Grapple chain | Dungeon 4 | Pulls light enemies | Cross gaps, pull posts |
| Dwarf hammer | Dungeon 6 | Crushes armored enemies | Stakes, cracked floors, deep snow |
| Ice mirror | Dungeon 7 | Reflects beams | Light puzzles in Hrímturn |

**Galdr** (sung spells; seiðr bar refilled by mead, seiðr jars and hofs)

| Galdr | Source | Effect | Seiðr |
| --- | --- | --- | --- |
| Eldr | Rune-carver's hall | Fire bolt; melts ice, lights torches, burns grass | 2 |
| Ís | Dungeon 4 rune-stave | Freezes enemies and water surfaces in any season | 3 |
| Farvegr | Dungeon 3 | Teleport to any visited warp point | 4 |
| Hlíf | Rune-carver (after Act I) | Barrier absorbs 3 hits | 3 |
| Skjálfti | Dungeon 6 rune-stave | Room-wide stagger, breaks weak floors | 5 |
| Ljós | Völva quest | Reveals hidden paths and invisible enemies; cuts through fog and night | 2 |
| Vindr | Dungeon 5 | Wind gust: pushes enemies, scatters leaves, spins fans | 3 |
| Bragð | Old huscarl's last lesson | Charged sword beam | 4 |

**Gear**

- Weapons: Halvar's seax → Uppvík sword → dwarf-forged blade (from Dvergagröf ore).
- Armor: wool tunic → byrnie (Uppvík) → ember byrnie (forged by the Dvergagröf smith from mine ore; extends heat timers in Ívaldi's Forge and wards off Hrímfjöll's killing frost, which makes it the Hrímfjöll gate) → runeplate (seiðr +25%). Winter cloak (side quest) halves snow slowdown.
- Arm-rings (one worn): stamina (roll cooldown), thrift (cheaper trade), beacon (shows secrets on map), berserker (+damage, −defence).

**Consumables**

- Mead: red (health), green (seiðr), blue (both); horns ×4 found around the world.
- Rune-staves: one-use galdr for anything you have not learned yet; also the way to sample Ís and Skjálfti before finding them.
- Farm food: Embla's flatbread and cheese heal a heart and a half, cheap, sold only in Askdalr.
- Ammo: arrows ×30/50/70, bombs ×10/20/30 with quiver and bag upgrades.

**Progression**

- Hearts: start 3, max 20. One container per dungeon boss (8), 36 heart pieces (9 hearts): one per dungeon (8) and 28 in the overworld.
- Seiðr: start 10, max 30 via 4 upgrades.
- Purse: 100 → 300 → 999 silver.
- Sword techniques from the old huscarl: dash thrust, parry, Bragð.

**Save system**

- Autosave on every screen transition and dungeon room (with a rolling previous autosave as backup); three manual slots at mead halls and hofs.
- Save data is a single versioned, checksummed JSON in the browser's IndexedDB (plain IndexedDB API, no library), exportable and importable as a file: story flags, inventory, hearts/seiðr, world state (opened chests, killed bosses, cleared ground cover), world clock and season. The quest log is derived from flags, not stored. Every save format version has a migration and a test fixture that must keep loading.
- Safari deletes a site's storage after 7 days without a visit unless the game is installed, so the game requests persistent storage (`navigator.storage.persist()`), suggests "Add to Dock" in Safari, and nudges the player to export a backup.
- Only one tab can play at a time (Web Locks API), so two tabs never overwrite each other's autosave.

## Seasons, weather and day-night

A world clock drives all three. One in-game day is 24 real minutes (16 day, 8 night); a season is 6 days, so a full year of clock time takes about 10 hours. The clock runs in the overworld and towns, pauses in dungeons, cutscenes and menus, so a 15–20 hour run sees roughly one full year. Sleeping at a mead hall skips to morning; after the Norns' quest any hof can turn the season.

**Seasons are hybrid: the story sets them at key beats, and the clock turns them in between.**

| Beat | Season set |
| --- | --- |
| New game (prologue days 1–3) | Late summer, clock held |
| The raid (night 3) | Autumn, with the first storm; the clock starts cycling after the morning legend scene |
| The pass opens (end of Act I) | Winter — the Fimbulvetr; the clock cycles again from there |
| Ending | Spring, and the highlands thaw for the first time |

Between beats the clock advances a season every 6 in-game days, and the Norns' loom lets the player choose. Hrímfjöll is always winter until the ending.

**Seasons**

| Season | Ground cover | Movement | Cleared by | Other effects |
| --- | --- | --- | --- | --- |
| Summer | Tall grass on meadows and forest edges | 60% speed in grass | Sword (spin clears 3×3), Eldr burns it (spreads downwind) | Long days (18/6), berries and völva herbs, most animals, enemies hide in grass |
| Autumn | Leaf piles under trees | 80% speed in piles | Sword, boomerang, Vindr scatters them | Piles hide items and pits; first storms; fog at dawn; harvest festival in Askdalr |
| Winter | Snow everywhere, deep drifts in the north | 70% in snow, 50% in drifts | Sword clears snow; hammer or bombs break drifts; Eldr melts a patch | Short days (12/12), lakes and rivers freeze into new paths, some caves iced shut, blizzards, trolls stay out longer |
| Spring | Mud along rivers, meltwater | 75% in mud | Cannot be cleared; dries in clear weather | Rivers swell and block fords, frequent rain, flowers for the völva, the pass thaws (story) |

Ground cover is a per-tile state saved with the world: cleared grass stays cleared until the season turns, then regrows. The winter cloak halves snow slowdown.

**Weather** (rolled each in-game morning per region, weighted by season; can change once mid-day)

| Weather | Summer | Autumn | Winter | Spring | Effects |
| --- | --- | --- | --- | --- | --- |
| Clear | 60% | 35% | 30% | 40% | Mud dries; best visibility |
| Rain | 25% | 30% | — | 40% | Eldr damage halved, braziers go out, NPCs go indoors, puddles conduct Ís |
| Wind | 15% | 25% | 20% | 15% | Pushes projectiles and the player near cliffs, scatters leaves, spins fans, fire spreads |
| Fog | — | 10% | 10% | 5% | Visibility radius 5 tiles, Ljós or lantern extends it, ambush enemies |
| Snow / blizzard | — | — | 40% | — | Visibility drops, drifts grow, Ís enemies boosted |

Weather is cosmetic in towns and never active inside dungeons. Hrímfjöll is always winter (the Rime King's doing) until the ending.

**Day and night**

- Night is 8 of 24 minutes (varies by season). Screen tint shifts over 90 s at dusk and dawn; the lantern and Ljós carve a light radius.
- Enemy spawns double at night. Night-only: draugr rise from mounds in Haugar, mara haunt the marsh, huldra lure in Myrkviðr, the Rime King's ravens patrol and call reinforcements.
- Trolls roam only at night and turn to stone at sunrise; a troll caught in daylight is a liftable loot rock.
- Uppvík and Askdalr close their gates at night; shops shut, the mead hall opens, and some NPCs only appear after dark.
- Night-only quests: the huldra's bargain, the barrow-watch, the skald's ghost song.
- Bosses and dungeons are unaffected.

**How the systems interact**

- Cut grass, blown leaves and cleared snow reveal the same hidden holes, so every secret is reachable in every season by some tool.
- Ís freezes water in any season; winter freezes it for free, which opens shortcuts but also lets enemies cross.
- Fire (Eldr, fire arrows, braziers) spreads through summer grass and autumn leaves in wind — useful against groups, dangerous near the farm.
- Some ingredients, fish and enemies exist in one season only; the völva's and fisherman's quests use this.
- Winter nights are the hardest stretch of the game; the game funnels the player into Act II's first dungeons during one.

**Technical model**

- `WorldClock` lives in the pure-TS core and is the only writer of minute, day, season and weather; it emits `dawn`, `dusk`, `newDay`, `season` and `weather` events. Story effects call `setSeason`. Weather is a pure hash of (seed, day, region) against the season's table, so combat randomness never changes it.
- Ground cover is a separate dynamic tile layer per screen (grass/leaves/snow/drift/mud/ice, plus cleared and burning bits). Only the cleared bits are saved, tagged with the season, so cover regrows automatically when the season turns; base tiles never change. Winter ice and Ís both put ice cover on water.
- Seasonal look = one base tileset plus a season colour matrix and a cover-layer tileset, not four tilesets. Trees swap a single foliage frame.
- Weather = one screen-wide particle emitter (rain, snow, leaves) plus a tint and a wind vector read by projectiles and particles; budget 500 particles.
- Day-night = the same colour matrix on the world camera (season × time × weather, built-in Phaser 4 ColorMatrix filter, no custom shader), plus a visibility layer that erases light sprites out of darkness for night, dark rooms and fog; no dynamic shadows.

## Dungeons and bosses

Every dungeon follows the Zelda 3 loop: enter, find the map and compass, get the key item halfway, use it to reach the boss, beat the boss with it. Sizes grow from 12 rooms to 40. Each is a place from the myths brought down to human scale.

| # | Dungeon | Region | Rooms | Theme / mechanic | Key item | Boss | Boss gimmick |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Rótarhellir (Root Cave) | Myrkviðr | 12 | A cavern under Yggdrasil's roots; vines, pushable roots, sap that slows | Boomerang | Rótvættr (root spirit) | Stun the bulbs with the boomerang, cut the core |
| 2 | Sökkva Kvern (Sunken Mill) | Mýrland | 16 | Water levels raised/lowered by mill wheels | Bombs | Lindormr | Bomb the mud mounds it hides in |
| 3 | Konungshaugr (King's Barrow) | Haugar | 20 | Draugr crypt; torches, invisible floors, grave-gold that wakes the dead if lifted | Bow (+ Farvegr galdr) | Haugbúi King | Shoot the crown gems while it charges |
| 4 | Helgrind (Hel's Gate) | Niflmýrr | 22 | Fog rooms cleared with the lantern; moving platforms over Gjöll | Grapple chain (+ Ís rune-stave) | Thane Náströnd, the Hollow (draugr lord) | Grapple its shield away, then sword |
| 5 | Sökkva Hof (Sunken Temple) | Sævatn | 24 | Flooded rooms, swim/dive, current puzzles | Vindr galdr | Thane Nykr, the Tide (water horse) | Use Vindr to push it out of water |
| 6 | Ívaldi's Forge | Dvergagröf | 28 | Lava, conveyor belts, heat timers, dwarf constructs | Dwarf hammer (+ Skjálfti rune-stave) | Thane Ívaldi, the Anvil (corrupted dwarf king) | Hammer its armor plates open |
| 7 | Hrímturn (Rime Tower) | Hrímfjöll | 32 | Ice sliding, light-beam puzzles, wind; door sealed until the other three thanes fall | Ice mirror | Thane Hrímgerðr, the Glass (giantess) | Reflect her beams back with the mirror |
| 8 | Útgarðr | Hrímfjöll | 40 | Jötunn stronghold; three wings, one per act, reusing every item | Master key | Kolbeinn, then Hrímnir the Rime King | Kolbeinn: parry-focused duel. Hrímnir: 3 phases, arena shrinks as Embla holds the binding |

**Dungeon design rules**

- One new mechanic per dungeon, taught in a safe room, tested in three rooms, combined with an earlier mechanic before the boss.
- Mini-boss guards the key item in dungeons 3–8.
- Every dungeon has one heart piece behind an optional puzzle and one secret room for a silver cache or arm-ring.
- Dungeons 1–3 can be done in any order after 1; difficulty scales by which runestones are lit.
- No weather or clock inside; the entrance screen still shows the season, and some entrances open only in one (Helgrind's fog gate, Sökkva Hof under ice).

**Boss design rules**

- Three phases, the third adding a new pattern rather than more health.
- Damage windows are visible: a glowing weak point, a stunned pose or a broken plate.
- Bosses drop a heart container and open a warp point at the dungeon entrance.

## NPCs and side quests

Around 45 named NPCs and 25 side quests, tracked in a quest log. Every NPC has at least three dialogue states keyed to story flags, plus season and night variants where it matters, so the world keeps talking about what just happened and what the weather is doing. People are farmers, fishers, traders, smiths, a goði, a völva, a skald, huscarls, dwarves under the mountain, and the odd vættr that will talk if approached right.

**Dialogue system**

- Text boxes with portraits, typewriter reveal, 2–4 choice prompts where a quest branches.
- Dialogue is data (see Tech stack): one typed TypeScript file per NPC, lines chosen by a condition list (`flag`, `item`, `quest`, `season`, `night`, `weather`, combined with `all` / `any` / `not`), every line written in both Swedish and English.
- NPCs walk short patrol paths and turn to face the player; they go indoors in rain and sleep at night.

**Quest types**

| Type | Count | Example |
| --- | --- | --- |
| Fetch / deliver | 8 | Bring the völva three fen-moss (autumn only) for the blue mead |
| Hunt | 4 | Clear the vargar from the Myrkviðr road; stone five trolls before dawn |
| Trading chain | 1 | Seven-step chain starting with a sheep's bell, ending with the beacon arm-ring |
| Minigame | 3 | Fishing, sheep herding time trial, axe-throwing range |
| Rebuild | 1 | Rebuild the farm across the game: five stages, epilogue changes |
| Escort | 2 | Walk the dwarf foreman's daughter through the mines |
| Collection | 3 | The skald's verses, lost rune-record pages, runestone chips |
| Character | 3 | Embla's chain in the Refuge; Halvar's confession; the old huscarl's last duel |

**Notable side quests**

- **Rebuild the farm** — costs silver and ore at five points; each stage restores a building and moves an NPC back. Unlocks the true epilogue.
- **The trading chain** — classic Zelda chain across all 8 regions; rewards the beacon arm-ring.
- **Embla's letters** — after she joins, three letters lead to places from her childhood; the last reveals she planned to sail with or without Ask, which frames the ending choice.
- **The old huscarl's last duel** — once you know all three techniques he challenges you; winning gives Bragð.
- **The Norns' loom** — find Urðr's well under Sævatn and weave three threads (one from each lowland region); afterwards any hof can turn the season. Opens up the seasonal secrets without waiting.
- **The huldra's bargain** — a night-only quest in Myrkviðr; she trades the winter cloak for a promise you must later keep or break.
- **Lost captives** — the eight kidnapped villagers are found one by one in dungeons 4–7 and the Refuge; each returned villager reopens a shop or service in Askdalr.

**Rewards**

Heart pieces (36 in total across the world and dungeons), arm-rings (4), mead horns (3 of 4), purse upgrades, seiðr upgrades and silver. No side quest gates the main story.

## Art and audio direction

Cel-shaded 2D means flat colour fills, two-tone shading and dark outlines, in the spirit of *Link's Awakening* (2019) flattened to top-down sprites, dressed in Viking-age Scandinavia: turf-roofed longhouses, carved gables and dragon-heads, runestones, standing stones, knotwork borders in the UI, a runic display font. It reads well at 640×360 and suits a browser budget, but seasons multiply the art unless the pipeline is disciplined.

**Visual rules**

- Palette: 32 colours per region, tinted per season by the camera colour matrix (warm summer, amber autumn, blue-white winter, pale green spring). Shadows are one flat darker tone, never gradients.
- Outlines: 2 px dark outline on characters, 1 px on props, none on ground tiles. Outlines are part of the sprite, not a shader.
- Tiles 16×16 px on a 640×352 playfield (40×22 tiles per screen) inside a 640×360 canvas, characters 32×32 px with a 48×48 attack frame.
- Art is authored at native size and scaled up by whole numbers with nearest-neighbour filtering (`pixelArt: true`), so edges stay crisp at 2×, 3× and 4×.
- Top-down three-quarter view like Zelda 3; depth by y-sort.
- Lighting: additive light sprites for lanterns, braziers and galdr, plus a camera-wide colour-matrix tint for time of day and weather. No dynamic shadows.
- Seasons: base tileset + palette shift + a ground-cover tileset (grass, leaves, snow, mud) + one foliage frame per tree per season. Not four tilesets.

**Animation approach**

- Frame animation for everything, packed into texture atlases; browsers handle atlases far better than runtime skeletal rigs.
- Hero and Embla: 4 directions, ~10 actions, 6–8 frames each (~300 frames each).
- Enemies and NPCs: 4–8 frames per action, 2 directions with horizontal flip where possible.
- Bosses: 2 directions, 8–12 frames per attack.
- Effects: sprite sheets for hits and galdr; Phaser particle emitters for dust, sparks, rain, snow, leaves.

**Asset pipeline**

1. **Placeholder art is drawn in code**, so the whole game is playable and judgeable before any real art exists. Sprites are palette-indexed pixel grids in TypeScript, composed from body parts and pose tables. Tiles are procedural painters that generate every auto-tile variant. Both are rendered to textures at boot in the cel style: flat fills, two-tone shading, baked outlines. Missing art falls back to a labelled capsule.
2. Real art is drawn in Krita or Affinity Designer (vector shapes exported as PNG keep the cel look consistent); Aseprite for small frame animations.
3. Pack with free-tex-packer or TexturePacker into per-region atlases (≤ 2048×2048, WebP with PNG fallback) so a region loads in one request.
4. Name frames by convention (`enemy_vargr_walk_s_0`). Code-drawn and real art share the names, so a real atlas listed in `public/atlases/manifest.json` replaces placeholder frames by name with no code changes.
5. Budget: ~1,200 base tiles, ~200 cover tiles, ~30 enemies × ~20 frames, ~45 NPC sprites, 8 boss sheets, 2 × 300 hero/Embla frames. At roughly 400 assets a month that is 12 months of art for one person, so plan to buy or commission the tileset and hero sheet, and generate first-pass enemy art.

**Audio**

- Music: one theme per region (8, each with a winter variant), per dungeon (8), town, boss, final boss, credits — ~30 tracks, Nordic folk instruments (nyckelharpa, tagelharpa, lyre, frame drum) over light orchestration, OGG Vorbis 96 kbps with AAC fallback for Safari.
- SFX: ~150 sounds; sword, hits, UI, footsteps per surface and cover (grass, leaves, snow, mud), rain and wind beds. Until real sounds exist, SFX are synthesized with a tiny Web Audio synth (ZzFX-style) and fed to Phaser's sound manager under the final keys, so recorded or pack sounds replace them one by one. Final SFX are sourced from free packs plus a few recorded.
- Adaptive layer: combat adds a percussion stem; night adds a low drone; both fade 3 s after the trigger ends.
- Browsers require a user gesture before audio: the title screen's "press any key" unlocks it.

**Accessibility**

Remappable controls, colour-blind palette toggle, text size 3 levels, screen shake and flash toggles, hold-to-toggle for shield, a "long day" option that doubles day length for players who dislike night pressure.

## Tech stack and architecture

Phaser 4 (pinned to 4.2.1) with strict TypeScript, bundled by Vite, hosted as a static site and installable as a PWA. Phaser 4.0 shipped on 10 April 2026 ([release list](https://phaser.io/download/phaser4)). It is the mainstream browser 2D engine, with tilemaps, particles, filters, audio and input built in. The npm package ships a `skills/` folder written for AI coding agents, which makes Claude Code unusually effective with it. Phaser 4 renders through a **WebGL 1** context with GLSL ES 1.00 shaders. There is no Canvas fallback, because Canvas has no filters and the season/time tint would silently disappear; browsers without WebGL get a clear message instead. Everything the player needs is a URL, and everything the game stores stays in the player's browser.

**Why not the alternatives**

| Option | Browser footprint | Verdict |
| --- | --- | --- |
| Phaser 4 + TypeScript | ~355 KB gzipped engine, 80–150 MB RAM, WebGL 1 | Chosen. Full 2D toolkit, huge community, editor available (Phaser Editor), agent skills shipped in the package. |
| Godot 4 web export | ~40 MB wasm download, 300 MB+ RAM, needs COOP/COEP headers for threads, Safari audio and memory issues | Editor is excellent but the footprint fails the goal and browser support is the weakest of Godot's targets. |
| PixiJS + own engine | ~500 KB, very lean | Rendering only; tilemaps, audio, input, scenes all built by hand. |
| Excalibur (TypeScript) | ~400 KB | Nice TS engine, but a small community and fewer tools for a 15-hour content game. |
| Rust + macroquad/Bevy on wasm | 5–30 MB | Bevy's wasm build is heavy; macroquad is light but has no content tooling. |

**Browser constraints and how they are met**

- Load time: engine + game code + content in the first load (about 1 MB while art is drawn in code; < 8 MB once real atlases exist); later each region's atlas and audio load on first entry and are cached by the service worker. Total under 60 MB.
- Rendering:
  - 640×360 canvas, integer zoom computed from the window size and device pixel ratio ("fit" available as a setting).
  - `pixelArt: true` gives nearest-neighbour filtering and rounded pixels.
  - World camera viewport is 640×352 with a 4 px letterbox; the HUD camera covers the full canvas.
  - Target 60 fps with ground + cover + canopy tile layers and ~150 sprites per screen.
- Memory: one region's atlases resident at a time (≤ 4 atlases of 2048²); textures released on region change.
- Audio: Web Audio unlocked on the title screen's first key press. Synthesized SFX for now; recorded audio as OGG/Opus with AAC fallback for Safari.
- Input: keyboard (physical key codes), Gamepad API (standard mapping), and touch controls hidden unless a touch is detected (mobile is not a target but costs little).
- Saves:
  - Plain IndexedDB with a small hand-written wrapper: three slots plus autosave and a previous autosave.
  - Export/import as a `.json` file so a save survives browser data clearing and moves between machines.
  - `navigator.storage.persist()`; Web Locks keep a second tab from corrupting saves.
  - Settings live in `localStorage`.
- Offline: PWA manifest + service worker; the game installs to the desktop from Chrome, Edge or Safari (Add to Dock) and runs offline after first play. Updates are offered, never swapped in mid-session. Fullscreen via the Fullscreen API.
- Browsers: last two versions of Chrome, Firefox, Safari and Edge on Linux, Windows and macOS.

**Project structure**

```
src/
  core/      pure TypeScript game rules and simulation — no Phaser, no DOM
             math/ clock/ state/ (GameState, flags, save, migrations) world/ (layout, text-map parser,
             collision, ground cover, spawns, NPC schedules) sim/ (Sim.step, entities, events, commands)
             actors/ (state machines: hero, enemies/, bosses/) combat/ items/ story/ (conditions,
             effects, dialogue, quests, cutscenes) input/ i18n/
  content/   typed game data: flags, items, galdr, gear, enemies, spawn tables, quests, NPCs, shops,
             dialogue/<npc>.ts, cutscenes/, world/<region>/<screen>.ts, dungeons/<dN>/, UI strings
  art/       code-drawn placeholder art: palettes, sprite grids, part composer, outline, tile painters,
             auto-tiling, colour grading, bitmap font — pure functions returning RGBA buffers
  shell/     Phaser + browser: scenes (Boot, Title, Play, Ui, Menu), views that mirror sim state,
             atlas packing, audio, input devices, IndexedDB/localStorage/export, PWA, dev tools
tests/       unit/ content/ (integrity) art/ sim/ (harness, routes, determinism) replays/
             fixtures/saves/ e2e/ (Playwright)
scripts/     bundle budget check, icon generation
docs/        design spec, roadmap, milestone briefs, character bible
```

**Key architectural choices**

- **Pure core, thin shell.**
  - Every rule runs in `Sim.step(input)` at a fixed 60 Hz in plain TypeScript: movement, collision, combat, clock, weather, cover, quests, dialogue, cutscenes.
  - It has zero Phaser or DOM imports, so it is tested headless in Vitest.
  - Phaser only draws, reads input and plays sound: each frame the shell steps the sim, plays the one-shot events it emitted (sounds, particles, shake, autosave), and syncs sprites to sim state.
  - The boundary is enforced by split tsconfigs (core, content and art compile without DOM types) and ESLint import rules.
- **Deterministic.** All randomness comes from a seeded RNG, with no wall-clock time in the core. The same seed plus the same inputs gives the same result, so recorded play sessions become regression tests.
- **Data-driven content in typed TypeScript.**
  - Items, galdr, enemies, quests, dialogue and screens are typed modules.
  - Flag, item, screen and NPC ids are string unions, so a typo is a compile error.
  - A content-integrity test replaces the dialogue linter and quest-graph validator. It checks flags that are read but never set, broken doors, map sizes, walkable seams between screens, the heart total, and missing translations.
  - Adding a quest is still a file, not an engine change.
- **State machines** for the hero, every enemy and every boss (a small data-driven machine with typed states). Predictable, testable, easy to extend.
- **Story flags** as a single record in `GameState`; every NPC line, door, spawn table and cutscene checks flags. Quest state is derived from flags so the two never drift.
- **Flip-screen world written as text maps.**
  - Each 40×22 screen is an ASCII grid plus a typed list of NPCs, enemies, chests, doors, secrets and triggers, placed on the 16×12 world grid by a layout table.
  - Edges and corners are auto-tiled at runtime.
  - Only the current screen is live (plus the next one during a slide), so RAM stays flat regardless of world size.
- **WorldClock** owns time, season and weather and is the only writer of them; systems subscribe to its events. Spawn tables are keyed by `(region, season, isNight)`.
- **Ground cover** is its own tile layer, modified by tools and galdr, saved per screen as cleared bits tagged with the season, so it regrows when the season turns.
- **Collision and hits** are handled in the core on the tile grid. Feet boxes give Zelda-style corner sliding, with ledges, holes and deep water. Damage is a `HitData` record (amount, element, knockback, faction, tags), so weapons, galdr, fire spread and traps share one path.
- **Dialogue** as typed data with conditions and effects (`set`, `give`, `take`, `silver`, `setSeason`, `cutscene`, `shop`); the integrity test fails the build on missing flags.
- **Localization** from day one: every line is written as `{ en, sv }`, and a missing Swedish line is a compile error.
- **Tests:**
  - **Vitest** covers clock, weather, collision, cover and fire, damage, state machines, dialogue, quests, save round-trips and migrations.
  - **Headless route tests** drive the sim from a new game to each milestone's goal.
  - A **progression solver** proves the intended item and season gates and blocks sequence breaks.
  - **Playwright** runs the built game in Chromium and WebKit. It warps to every screen in every season and time of day, and fails on console errors, missing art or a frame-time budget miss.

  Claude Code runs all of them before every commit.

**Tooling**

- Screens and rooms are text maps in the repo (no external level editor). A dev page stitches a whole region into one image for review, and the in-game dev tools provide:
  - Query strings such as `?screen=ask_farmyard&season=winter&time=night`.
  - An F1 overlay; hitbox and cover views.
  - A console with warp, time, season and flag commands.
- GitHub with LFS for source art (once it exists); CI builds and tests on every push and deploys `main` to GitHub Pages.
- itch.io HTML5 embed for playtests; own domain for launch. No Tauri wrapper — PWA install covers the desktop.

## Build plan

The whole game is built iteratively by Claude Code, milestone by milestone, with placeholder art drawn in code throughout. You own design, direction, playtesting and the Swedish proofread. Real art and music are a separate, parallel track that replaces placeholder textures and sounds by name without code changes. The full roadmap with systems, content counts and exit criteria is in the design spec; the summary:

| # | Milestone | Done when |
| --- | --- | --- |
| M0 | Foundations | Project, pure-core boundaries, fixed-step sim, input, text maps + auto-tiling, collision, hero moves/attacks/rolls/shields, flip-screen between 3 test screens, clock + day/season tints, dev tools, IndexedDB saves + export/import, settings, PWA, CI + Pages |
| M1 | Vertical slice | Farm prologue (late summer → autumn storm), raid, Askdalr, Myrkviðr, Rótarhellir + Rótvættr; dialogue, cutscenes, quests, grass + leaf cover, 3 enemies incl. night-only draugr, lantern + boomerang. Playable start-to-boss in 45–60 min |
| M2 | Uppvík and the turning world | Uppvík hub, all 5 weathers, snow and mud, trolls, economy, gear, galdr + Eldr, settings UI |
| M3 | Mýrland + Sökkva Kvern (D2) | Bombs, water levels, seasonal fords, fishing |
| M4 | Haugar + Konungshaugr (D3) | Bow, Farvegr + warps, mini-bosses, huscarl techniques |
| M5 | Act I finale — public demo | The pass opens and the Fimbulvetr falls; 10 Act I side quests |
| M6 | Niflmýrr + Helgrind (D4) | Fog, grapple, Ís, Ljós, thanes, captives |
| M7 | Sævatn, the Refuge + Sökkva Hof (D5) | Swimming, Vindr, Embla joins, Norns' loom |
| M8 | Dvergagröf + Ívaldi's Forge (D6) | Hammer, Skjálfti, heat, ember byrnie |
| M9 | Hrímfjöll + Hrímturn (D7) | Killing frost, ice sliding, mirror beams, Bragð |
| M10 | Útgarðr + ending | Kolbeinn, Hrímnir, both endings |
| M11 | Completion and ship | All 25 side quests, 45 NPCs, 36 heart pieces, accessibility, Safari/performance pass, launch |

Every milestone opens with a brief (screens, NPCs, quests, flags, rooms) that you approve before content is written, and closes with a playtest of the deployed build, a Swedish proofreading pass and a committed save file that every later build must still load. Pre-agreed cut lines: Útgarðr 40 → 28 rooms, fewer Act II side quests, three highland dungeons if M6–M9 overrun by 30%.

**Working with Claude Code**

- `CLAUDE.md` in the repo carries the coding conventions: strict TS, the core/shell boundary, state-machine pattern, naming, test-first for systems, never renaming persisted ids, bilingual text. It points at Phaser's shipped `skills/` folder and links this document for design intent.
- One Claude Code session per feature branch; every session ends with typecheck, lint, Vitest, the Playwright smoke run and `vite build` under the bundle budget all green.
- Content generation loop:
  1. You approve the milestone brief.
  2. Claude Code writes the screens, NPCs, dialogue and quests as typed modules; the compiler and the integrity test validate them.
  3. You playtest in the browser with dev query strings.
- Keep an `ARCHITECTURE.md` that Claude Code updates when it adds a system; it is the fastest way back into the project after a break.
- Ask for a plan before any change to the core's public interfaces or the save format; accept diffs elsewhere freely.

**Risks**

| Risk | Mitigation |
| --- | --- |
| Art volume, multiplied by seasons | Colour matrix and a separate cover layer instead of four tilesets; code-drawn placeholders keep the whole game playable; buy a cel-style tileset; commission the hero sheet; frame names are the swap contract |
| Placeholder art makes fun hard to judge | Feel before art (hit-stop, shake, telegraph poses, particles, SFX); readable silhouettes and outlines; a texture gallery for quick review |
| Browser memory and load time | One region resident at a time, atlases ≤ 2048², WebP, service-worker cache; CI fails the build on budget misses |
| Safari quirks (audio, WebGL, IndexedDB eviction) | WebKit in CI from M0; persistent storage request, Add to Dock hint and export nudges; export-save-to-file is the safety net |
| Season systems bleeding into every feature | WorldClock is the single source of truth; every spawn table, cover rule and dialogue condition reads it through one API |
| Sequence breaks as the world grows | Progression solver per season; headless route tests for every allowed dungeon order |
| Content drifting across many sessions | Typed registries, character bible and glossary, generated flag/quest docs, milestone briefs approved up front |
| Save format changes between milestones | Versioned saves with a migration per version; fixture saves from every milestone must keep loading |
| Scope creep in Act II | Dungeons 4–7 share one room template library; cut lines agreed in advance |
| Phaser 4 being new | Exact version pin, upgrade only between milestones; the shell is thin so an engine change stays contained |

## Resolved questions

- [x] Title — "Fimbulvetr" (the great winter before Ragnarök) stays; the pass opening now literally brings it.
- [x] Embla in Act II — story-only: she stays at the Refuge as hub, quest-giver and companion in scenes; in the final fight she holds the binding (the arena clock).
- [x] Kolbeinn spare/kill — kept; one flag and one epilogue scene.
- [x] Season length — 6 in-game days, hybrid: story beats set the season, the clock turns it in between.
- [x] Night spawns — fixed per region tier; lowland dungeon difficulty scales with runestones lit.
- [x] Art — code-drawn placeholders throughout development; buying or commissioning real art is a parallel track that swaps in by frame name.
- [x] Languages at launch — Swedish + English from day one.
- [x] Browser-only — yes; PWA install covers the desktop, no Tauri wrapper.
- [x] Difficulty — one tuned difficulty plus accessibility options (including the "long day").

# Fimbulvetr (working title) — Game Design Document

Sep 26, 2026 · Erik

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
| Screen resolution | 640×360 native, integer-scaled in the browser |
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
- Act ends at the pass as autumn turns to winter: the stones open it, and the hero sees the mountain glow from within.

**Act II — the highlands (7–9 h)**

- Twist on arrival: the villagers were not taken as hostages. The rune-binding under the mountain was sworn on the villagers' bloodlines; draining their descendants unmakes it. Embla is not among the drained — she escaped and is leading the captives in a hidden refuge.
- Ask finds Embla midway through Act II (after dungeon 5). She joins as a story companion: opens the refuge as a second hub, gives quests, and her flirting shifts to something earned.
- Dungeons 4–7 each hold one of the Rime King's four thanes; killing all four breaks his link to the drained villagers and frees them.
- Halvar arrives in the highlands, confesses he fought the Rime King before and that his generation chose to bind rather than kill him, which caused this.

**Act III — Útgarðr (2–3 h)**

- Dungeon 8, Útgarðr, the jötunn stronghold, is a gauntlet that reuses every item and galdr.
- Kolbeinn is the penultimate boss; he can be spared or killed (affects one ending scene only).
- Hrímnir has a three-phase fight. Embla's role: she holds the binding open, which limits the arena and gives the fight a clock.
- Ending: the villagers return; the farm rebuilds (visible in the epilogue if the farm side quest is done); spring comes to the highlands for the first time. Embla sails south and asks Ask to come. A final choice picks the closing shot — stay, or go.

## World

One continuous overworld of roughly 16×12 screens (each screen 640×360 px = 40×22 tiles), split into 8 regions and gated by items and seasons rather than walls. Two hubs: the trading town Uppvík in the forest (Act I) and Embla's refuge on a lake island (Act II). The look is Viking-age Scandinavia with the myths made real: turf-roofed longhouses, a hof with carved gables, runestones, stone circles, and Yggdrasil's roots breaking through the forest floor.

| Region | Biome | Act | Gate to enter | Contains |
| --- | --- | --- | --- | --- |
| Askdalr | Farmland, village | Prologue | — | Halvar's farm, village, Gyða's hof, first trader |
| Myrkviðr | Dark forest, old pines | I | — | Dungeon 1 (Rótarhellir), Uppvík town, the völva's hut |
| Mýrland | Wetland, river | I | Boomerang | Dungeon 2 (Sökkva Kvern), fisherman, ferry |
| Haugar | Barrow hills, stone circles | I | Bombs | Dungeon 3 (Konungshaugr), old huscarl's cottage, the runestone pass |
| Niflmýrr | Fog marsh, dead trees | II | Lantern + pass open | Dungeon 4 (Helgrind), the wandering skald |
| Sævatn | Lake, islands | II | Seal-skin | Dungeon 5 (Sökkva Hof), the Refuge on Holmr |
| Dvergagröf | Cliffs, dwarf mines | II | Grapple chain | Dungeon 6 (Ívaldi's Forge), miners' camp, dwarf smith |
| Hrímfjöll | Glacier, peaks | II | Eldr galdr or ember byrnie | Dungeon 7 (Hrímturn), Útgarðr (Dungeon 8) |

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

Warp points (one per region, unlocked on first visit) via the Farvegr galdr from dungeon 3 onward. Ferry between Mýrland and Sævatn in three seasons; in winter the lake freezes and you walk across instead. Hidden caves under bombable rocks and liftable stones on most screens; some only reachable when tall grass is cut, leaves are blown away, or ice covers a river.

## Gameplay systems

Zelda 3 controls, one twist: a dodge roll and a small seiðr (MP) bar, so builds lean toward sword, galdr or items without any of them being mandatory. Seasons, weather and the day-night cycle have their own section below.

**Controls** (keyboard + gamepad, fully remappable)

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | WASD / arrows | Left stick / d-pad |
| Sword | J | X / Square |
| Item slot 1 / 2 | K / L | A / B |
| Galdr | I | Y / Triangle |
| Dodge roll | Space | RB |
| Shield (hold) | Shift | LB |
| Interact / lift | E | X (context) |
| Map / inventory | Tab | Start / Select |

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
| Seal-skin | Lake NPC quest | — | Swimming, Sævatn |
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
- Armor: wool tunic → byrnie (Uppvík) → ember byrnie (fire resistance, needed for Hrímfjöll's lava) → runeplate (seiðr +25%). Winter cloak (side quest) halves snow slowdown.
- Arm-rings (one worn): stamina (roll cooldown), thrift (cheaper trade), beacon (shows secrets on map), berserker (+damage, −defence).

**Consumables**

- Mead: red (health), green (seiðr), blue (both); horns ×4 found around the world.
- Rune-staves: one-use galdr for anything you have not learned yet; also the way to sample Ís and Skjálfti before finding them.
- Farm food: Embla's flatbread and cheese heal a heart and a half, cheap, sold only in Askdalr.
- Ammo: arrows ×30/50/70, bombs ×10/20/30 with quiver and bag upgrades.

**Progression**

- Hearts: start 3, max 20. One container per boss (8), 24 heart pieces (6 hearts) in the world.
- Seiðr: start 10, max 30 via 4 upgrades.
- Purse: 100 → 300 → 999 silver.
- Sword techniques from the old huscarl: dash thrust, parry, Bragð.

**Save system**

- Autosave on every screen transition and dungeon room; three manual slots at mead halls and hofs.
- Save data is a single JSON in the browser's IndexedDB, exportable and importable as a file: story flags, inventory, hearts/seiðr, world state (opened chests, killed bosses, cleared ground cover), quest log, world clock and season.

## Seasons, weather and day-night

A world clock drives all three. One in-game day is 24 real minutes (16 day, 8 night); a season is 6 days, so a full year takes about 10 hours and the player sees every season twice in a 15–20 hour run. The clock runs in the overworld and towns, pauses in dungeons, cutscenes and menus. Sleeping at a mead hall skips to morning; after the Norns' quest any hof can turn the season.

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

- `WorldClock` autoload: minute, day, season, weather; emits `dawn`, `dusk`, `seasonChanged`, `weatherChanged`.
- Ground cover is a separate dynamic tile layer per screen with a bitmask (grass/leaves/snow/mud/cleared) in the save; base tiles never change.
- Seasonal look = one base tileset plus a palette-shift shader per season and a cover-layer tileset, not four tilesets. Trees swap a single foliage frame.
- Weather = one screen-wide particle emitter (rain, snow, leaves) plus a tint and a wind vector read by projectiles and particles; budget 500 particles.
- Day-night = a colour-matrix tint on the world camera plus additive light sprites; no dynamic shadows.

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
| 7 | Hrímturn (Rime Tower) | Hrímfjöll | 32 | Ice sliding, light-beam puzzles, wind | Ice mirror | Thane Hrímgerðr, the Glass (giantess) | Reflect her beams back with the mirror |
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
- Dialogue is data (see Tech stack): one file per NPC, lines chosen by a condition list (`flags`, `items`, `quest_state`, `season`, `is_night`, `weather`).
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

Heart pieces (24), arm-rings (4), mead horns (3 of 4), purse upgrades, seiðr upgrades and silver. No side quest gates the main story.

## Art and audio direction

Cel-shaded 2D means flat colour fills, two-tone shading and dark outlines, in the spirit of *Link's Awakening* (2019) flattened to top-down sprites, dressed in Viking-age Scandinavia: turf-roofed longhouses, carved gables and dragon-heads, runestones, standing stones, knotwork borders in the UI, a runic display font. It reads well at 640×360 and suits a browser budget, but seasons multiply the art unless the pipeline is disciplined.

**Visual rules**

- Palette: 32 colours per region, tinted per season by shader (warm summer, amber autumn, blue-white winter, pale green spring). Shadows are one flat darker tone, never gradients.
- Outlines: 2 px dark outline on characters, 1 px on props, none on ground tiles.
- Tiles 16×16 px on a 640×360 canvas (40×22 tiles per screen), characters 32×32 px with a 48×48 attack frame.
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

1. Block out every screen with a grey-box tileset and placeholder capsules; play it first.
2. Draw in Krita or Affinity Designer (vector shapes exported as PNG keep the cel look consistent); Aseprite for small frame animations.
3. Pack with free-tex-packer or TexturePacker into per-region atlases (≤ 2048×2048, WebP with PNG fallback) so a region loads in one request.
4. Name assets by convention (`enemy_vargr_walk_s.png`) so import scripts and Claude Code can wire them without manual steps.
5. Budget: ~1,200 base tiles, ~200 cover tiles, ~30 enemies × ~20 frames, ~45 NPC sprites, 8 boss sheets, 2 × 300 hero/Embla frames. At roughly 400 assets a month that is 12 months of art for one person, so plan to buy or commission the tileset and hero sheet, and generate first-pass enemy art.

**Audio**

- Music: one theme per region (8, each with a winter variant), per dungeon (8), town, boss, final boss, credits — ~30 tracks, Nordic folk instruments (nyckelharpa, tagelharpa, lyre, frame drum) over light orchestration, OGG Vorbis 96 kbps with AAC fallback for Safari.
- SFX: ~150 sounds; sword, hits, UI, footsteps per surface and cover (grass, leaves, snow, mud), rain and wind beds. Sourced from free packs plus a few recorded.
- Adaptive layer: combat adds a percussion stem; night adds a low drone; both fade 3 s after the trigger ends.
- Browsers require a user gesture before audio: the title screen's "press any key" unlocks it.

**Accessibility**

Remappable controls, colour-blind palette toggle, text size 3 levels, screen shake and flash toggles, hold-to-toggle for shield, a "long day" option that doubles day length for players who dislike night pressure.

## Tech stack and architecture

Phaser 4 with TypeScript, bundled by Vite, rendered with WebGL 2 (Canvas fallback), hosted as a static site and installable as a PWA. Phaser 4.0 shipped on 10 April 2026 and 4.1 on 30 April ([release list](https://phaser.io/download/phaser4)); it is the mainstream browser 2D engine, it has tilemaps, particles, lighting, audio and input built in, and the repository ships a `skills/` folder written for AI coding agents, which makes Claude Code unusually effective with it ([v4.0.0 release notes](https://github.com/NextCommunity/NextCommunity.github.io/pull/445)). Everything the player needs is a URL.

**Why not the alternatives**

| Option | Browser footprint | Verdict |
| --- | --- | --- |
| Phaser 4 + TypeScript | ~1.5 MB gzipped engine, 80–150 MB RAM, WebGL 2 | Chosen. Full 2D toolkit, huge community, editor available (Phaser Editor), agent skills shipped in-repo. |
| Godot 4 web export | ~40 MB wasm download, 300 MB+ RAM, needs COOP/COEP headers for threads, Safari audio and memory issues | Editor is excellent but the footprint fails the goal and browser support is the weakest of Godot's targets. |
| PixiJS + own engine | ~500 KB, very lean | Rendering only; tilemaps, physics, audio, input, scenes all built by hand. |
| Excalibur (TypeScript) | ~400 KB | Nice TS engine, but a small community and fewer tools for a 15-hour content game. |
| Rust + macroquad/Bevy on wasm | 5–30 MB | Bevy's wasm build is heavy; macroquad is light but has no content tooling. |

**Browser constraints and how they are met**

- Load time: engine + core UI + prologue assets in the first bundle (< 8 MB); each region's atlas and audio loaded on first entry and cached by the service worker. Total under 60 MB.
- Rendering: Phaser Scale `FIT` with integer zoom on a 640×360 canvas, `pixelArt: false` (cel edges are anti-aliased), `roundPixels` on. Target 60 fps with ≤ 2 tile layers + cover layer + ~150 sprites per screen.
- Memory: one region's atlases resident at a time (≤ 4 atlases of 2048²); textures released on region change.
- Audio: WebAudio unlocked on first key press; OGG with AAC fallback for Safari.
- Input: keyboard, Gamepad API, and touch controls hidden unless a touch is detected (mobile is not a target but costs little).
- Saves: IndexedDB via `idb-keyval`, three slots plus autosave, export/import as a `.json` file so a save survives browser data clearing and moves between machines.
- Offline: PWA manifest + service worker; the game installs to the desktop from Chrome or Edge and runs offline after first play. Fullscreen via the Fullscreen API.
- Browsers: last two versions of Chrome, Firefox, Safari and Edge on Linux, Windows and macOS.

**Project structure**

```
src/
  core/         GameState, SaveManager, QuestManager, DialogueManager, WorldClock (day/season/weather), AudioManager, SceneRouter
  scenes/       Boot, Preload, Title, World, Dungeon, HUD, Inventory, Map, Dialogue, Pause
  entities/     player/, enemies/<name>/, npcs/<name>/, bosses/<name>/  (class + state machine + anim config together)
  world/        RegionLoader, ScreenStreamer (3×3), GroundCover, Weather, DayNight, Interactables
  items/        item, galdr, armor and arm-ring definitions (typed TS records)
  data/         dialogue/*.json, quests/*.json, enemies.json, loot_tables.json, i18n/{sv,en}.json, schemas/
  ui/           hud/, inventory/, dialogue_box/, map/, menus/
  shaders/      outline.frag, seasonTint.frag, water.frag, fog.frag, dayNight.frag (GLSL ES 3.0)
public/assets/  atlases/<region>/, tilemaps/*.json (Tiled), audio/, fonts/
tests/          vitest/ (logic), playwright/ (smoke: load every screen, no console errors, screenshot diff)
tools/          dialogue linter, quest-graph validator, atlas packer script, tilemap season checker
```

**Key architectural choices**

- **Data-driven content.** Items, galdr, enemies, quests and dialogue are typed JSON validated by JSON Schema at build time. Adding a quest is a file, not a code change, and Claude Code can generate and validate them.
- **State machines** for the hero, every enemy and every boss (a small `StateMachine` class with typed states). Predictable, testable, easy to extend.
- **Story flags** as a single record in `GameState`; every NPC line, door, spawn table and cutscene checks flags. `QuestManager` derives quest state from flags so the two never drift.
- **Screen-based world.** The overworld is one Tiled map per region; the streamer keeps a 3×3 screen window active and culls the rest, so RAM stays flat regardless of world size.
- **WorldClock** owns time, season and weather and is the only writer of them; systems subscribe to its events. Spawn tables are keyed by `(region, season, isNight)`.
- **Ground cover** is its own tile layer with a bitmask per tile, modified by tools and galdr, saved per screen, reset on season change.
- **Hit/hurt boxes** on collision groups by faction (Arcade Physics); damage is a `HitData` record (amount, knockback, element, source) so weapons, galdr, fire spread and traps share one path.
- **Dialogue** in JSON with conditions and effects (`set_flag`, `give_item`, `start_quest`); a linter fails the build on missing flags.
- **Localization** from day one via i18n JSON; Swedish and English.
- **Tests**: Vitest for state machines, save round-trips, quest logic, WorldClock and damage maths; Playwright drives the built game headless, walks every screen in every season and fails on console errors or a frame-time budget miss. Claude Code runs both before every commit.

**Tooling**

- Tiled for overworld and dungeon layout (Phaser imports it natively); one object layer per screen for spawns, secrets and cover masks.
- GitHub with LFS for source art; CI builds on every push and deploys the `main` branch to GitHub Pages or Cloudflare Pages on tag.
- itch.io HTML5 embed for playtests; own domain for launch; a Tauri wrapper later if a Steam release is wanted.

## Build plan

Six milestones over roughly 20 months of part-time solo work, with Claude Code doing most of the code and content wiring while you own design, art direction and playtesting. Art is the long pole, so it runs in parallel from milestone 2; seasons add about two months over the earlier plan.

| # | Milestone | Duration | Done when |
| --- | --- | --- | --- |
| 0 | Foundations | 3 weeks | Vite + Phaser 4 + TS skeleton, scene router, hero movement/attack/roll, one grey-box screen, WorldClock ticking with day-night tint, save round-trip to IndexedDB, CI deploying to GitHub Pages |
| 1 | Vertical slice | 8 weeks | Farm prologue (summer → autumn storm), raid, Askdalr, Myrkviðr, Dungeon 1 and Rótvættr, dialogue + quest systems, 3 enemies incl. one night-only, tall grass and leaf piles working, placeholder art. Playable start-to-boss in 45 min, in the browser |
| 2 | Systems complete | 12 weeks | All 8 sub-items, 8 galdr, gear, trade, inventory, map, mead/rune-staves, all four seasons and five weathers with ground cover, spawn tables by season/night, 15 enemy types, boss framework, gamepad + remap, localization, PWA offline |
| 3 | Act I content | 14 weeks | Regions 1–4, Dungeons 2–3, Uppvík fully populated, 10 side quests incl. the Norns' loom, first real art pass on hero/tiles/cover |
| 4 | Act II + III content | 26 weeks | Regions 5–8, Dungeons 4–8, Refuge, Embla as companion, all bosses, remaining quests, full art and music incl. winter variants |
| 5 | Polish and ship | 12 weeks | Balance pass across seasons, accessibility, achievements, itch.io page and own domain, trailer, external playtest ×2, launch |

**Working with Claude Code**

- `CLAUDE.md` in the repo carries the coding conventions (strict TS, state-machine pattern, naming, test-first for systems), points at Phaser's shipped `skills/` folder, and links this document for design intent.
- One Claude Code session per feature branch; every session ends with Vitest green, the Playwright smoke run green and `vite build` under the bundle budget.
- Content generation loop: describe an NPC or quest in prose → Claude Code writes the JSON, validates it against the schema, adds the flag and season checks → you playtest in the browser with a `?season=winter&time=night` dev query string.
- The Playwright smoke test is the thing Claude Code can run on its own: load every screen in every season and both times of day, assert no missing assets, no console errors, frame time under 16 ms.
- Keep an `ARCHITECTURE.md` that Claude Code updates when it adds a system; it is the fastest way back into the project after a break.
- Ask for a plan before any change touching `core/` or `world/`; accept diffs elsewhere freely.

**Risks**

| Risk | Mitigation |
| --- | --- |
| Art volume, multiplied by seasons | Palette-shift shader and a separate cover layer instead of four tilesets; grey-box everything first; buy a cel-style tileset; commission the hero sheet; generate first-pass enemies and redraw the best |
| Browser memory and load time | One region resident at a time, atlases ≤ 2048², WebP, service-worker cache; Playwright fails the build on budget misses |
| Safari quirks (audio, WebGL, IndexedDB eviction) | Test Safari from milestone 1; AAC fallback; export-save-to-file is the safety net |
| Season systems bleeding into every feature | WorldClock is the single source of truth; every spawn table, cover rule and dialogue condition reads it through one API |
| Scope creep in Act II | Dungeons 4–7 share one room template library; cut to 3 highland dungeons if milestone 4 slips past 32 weeks |
| Motivation over 20 months | Ship milestone 1 to itch.io as a browser demo; monthly external playtest keeps feedback flowing |
| Phaser 4 being new | Pin the version per milestone; 4.x is the actively maintained line and Phaser 3 is the fallback with a documented migration path |

## Open questions

- [ ] Title — "Fimbulvetr" (the great winter before Ragnarök) fits the seasons and the Rime King; alternatives welcome.
- [ ] Embla as companion in Act II: story-only (she stays at the Refuge) or does she follow the hero into dungeons 6–8?
- [ ] Is the Kolbeinn spare/kill choice worth the extra ending scene, or cut for scope?
- [ ] Season length: 6 in-game days (~2.4 h) as proposed, or tie seasons to story acts instead of the clock?
- [ ] Should night spawns scale with player progress, or stay fixed per region?
- [ ] Art: commission the hero sheet and tileset up front, or grey-box through milestone 3 first?
- [ ] Languages at launch: Swedish + English only, or plan for more?
- [ ] Browser-only forever, or keep a Tauri desktop wrapper on the roadmap for Steam?
- [ ] Difficulty modes (normal / hero) or a single tuned difficulty?

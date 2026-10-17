import type { MusicId } from '@content/music';
import type { ScreenId } from '@content/world/screens';
import type { DungeonId, EnemyId, RegionId } from '@content/ids';
import { isNight, seasonAt } from '../clock/clock';
import type { Season } from '../clock/types';
import type { Sim } from '../sim/sim';

/** What decides the music: which screens are towns, which bosses fight the last battle, how near is a threat. */
export interface MusicRules {
  readonly towns: readonly ScreenId[];
  readonly finalBosses: readonly EnemyId[];
  /** A living foe this close to the hero (px) brings in the combat drums. */
  readonly threatRadius: number;
}

/** Everything about the moment that the music depends on. */
export interface MusicScene {
  readonly screen: ScreenId;
  readonly region: RegionId;
  readonly dungeon?: DungeonId;
  readonly season: Season;
  readonly night: boolean;
  /** Under the open sky: not indoors, not in a cave or a dungeon. */
  readonly outdoors: boolean;
  readonly boss: { readonly id: string; readonly mini: boolean } | null;
  readonly threat: boolean;
  readonly credits: boolean;
}

/** A track and its two adaptive stems: combat adds a percussion layer, night a low drone. */
export interface MusicCue {
  readonly track: MusicId;
  readonly combat: boolean;
  readonly night: boolean;
}

export function chooseMusic(s: MusicScene, rules: MusicRules): MusicCue {
  if (s.credits) return { track: 'music_credits', combat: false, night: false };
  if (s.boss !== null && !s.boss.mini) {
    const final = (rules.finalBosses as readonly string[]).includes(s.boss.id);
    return { track: final ? 'music_final' : 'music_boss', combat: false, night: false };
  }
  const combat = s.threat || s.boss !== null;
  if (s.dungeon !== undefined) return { track: `music_${s.dungeon}`, combat, night: false };
  const night = s.night && s.outdoors;
  if (rules.towns.includes(s.screen)) return { track: 'music_town', combat, night };
  const track: MusicId = s.season === 'winter' ? `music_${s.region}_winter` : `music_${s.region}`;
  return { track, combat, night };
}

/** The music for the sim as it stands. */
export function musicOf(sim: Sim, rules: MusicRules): MusicCue {
  const def = sim.db.screens[sim.screen.id];
  const hero = sim.hero.pos;
  const r2 = rules.threatRadius * rules.threatRadius;
  let boss: MusicScene['boss'] = null;
  let threat = false;
  for (const e of sim.enemies) {
    if (e.hp <= 0 || e.faction !== 'enemy') continue;
    const b = sim.db.enemies[e.def as EnemyId].boss;
    if (b !== undefined && boss === null) boss = { id: e.def, mini: b.mini === true };
    const dx = e.pos.x - hero.x;
    const dy = e.pos.y - hero.y;
    if (dx * dx + dy * dy <= r2) threat = true;
  }
  return chooseMusic(
    {
      screen: def.id,
      region: def.region,
      ...(def.dungeon === undefined ? {} : { dungeon: def.dungeon }),
      season: seasonAt(sim.state.clock, def.region, sim.db.clock, sim.state.flags),
      night: isNight(sim.state.clock, sim.db.clock),
      outdoors: def.indoor !== true && def.dark !== true,
      boss,
      threat,
      credits: sim.storyUi()?.k === 'credits',
    },
    rules,
  );
}

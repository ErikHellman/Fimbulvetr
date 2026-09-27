import { seasonAt } from '../../clock/clock';
import type { RegionId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { WeatherKind } from '../../clock/types';
import { weatherAt, windAt } from '../../clock/weather';
import type { Vec } from '../../math/vec';
import { evalCond } from '../../story/cond';
import type { SimRt } from '../rt';

/** Whether the current screen is under the sky (not indoors, not in a dungeon). */
export function outdoors(rt: SimRt): boolean {
  const def = rt.db.screens[rt.screen.id];
  return def.indoor !== true && def.dungeon === undefined;
}

/**
 * The sky over the current screen's region, indoors too: the dev override, then story weather (first rule
 * that holds), then — when rolling is on — the region's roll for the day, else clear.
 */
export function skyOf(rt: SimRt): WeatherKind {
  return skyAt(rt, rt.db.screens[rt.screen.id].region, rt.state.clock.minute);
}

/** The sky over a region at a minute of today (see `skyOf`). */
export function skyAt(rt: SimRt, region: RegionId, minute: number): WeatherKind {
  if (rt.weatherOverride !== undefined) return rt.weatherOverride;
  // Story rules see no weather, so a rule can never depend on itself.
  const ctx = { state: rt.state, quests: rt.db.quests };
  const story = rt.db.weather.find((r) => evalCond(r.when, ctx));
  if (story !== undefined) return story.kind;
  if (!rt.rolled) return 'clear';
  const c = rt.state.clock;
  return weatherAt(rt.state.seed, c.day, minute, region, seasonAt(c, region, rt.db.clock), rt.db.clock);
}

/** A wet day on a screen: spring, and the morning's sky was not clear (mud stands all day). */
export function wetDay(rt: SimRt, id: ScreenId): boolean {
  const region = rt.db.screens[id].region;
  return seasonAt(rt.state.clock, region, rt.db.clock) === 'spring' && skyAt(rt, region, 0) !== 'clear';
}

/** The wind on the current screen (still indoors and in dungeons). */
export function windOf(rt: SimRt): Vec {
  if (!outdoors(rt)) return { x: 0, y: 0 };
  return windAt(rt.state.seed, rt.state.clock.day, rt.db.screens[rt.screen.id].region, skyOf(rt));
}

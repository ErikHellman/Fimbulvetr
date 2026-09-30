import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import type { ContentDb } from '@core/sim/db';
import type { StoryUi } from '@core/sim/systems/story';
import { FISHING } from '@core/story/fishing';

export type FishUi = Extract<NonNullable<StoryUi>, { k: 'fish' }>;

/** What the fishing panel shows: a line of text, and while reeling the tension and distance bars. */
export interface FishPanel {
  readonly text: string;
  /** Tension 0…1, the safe band as shares of the bar, and whether it has left the band. */
  readonly tension: {
    readonly at: number;
    readonly band: readonly [number, number];
    readonly danger: boolean;
  } | null;
  /** How far out the fish is, 0 (at the rod) … 1 (gone). */
  readonly dist: number | null;
}

export function fishPanel(ui: FishUi, db: ContentDb, lang: Lang): FishPanel {
  const none = { tension: null, dist: null } as const;
  switch (ui.phase) {
    case 'idle':
      return { text: t(UI.fish_idle, lang), ...none };
    case 'cast':
      return { text: t(UI.fish_cast, lang), ...none };
    case 'wait':
      return { text: t(UI.fish_wait, lang), ...none };
    case 'bite':
      return { text: t(UI.fish_bite, lang), ...none };
    case 'reel': {
      const max = FISHING.tensionMax;
      return {
        text: t(ui.surging ? UI.fish_surge : UI.fish_reel, lang),
        tension: {
          at: Math.min(1, ui.tension / max),
          band: [ui.band[0] / max, ui.band[1] / max],
          danger: ui.tension < ui.band[0] || ui.tension > ui.band[1],
        },
        dist: ui.maxDist > 0 ? Math.max(0, Math.min(1, ui.dist / ui.maxDist)) : null,
      };
    }
    case 'result': {
      if (ui.result === 'landed' && ui.fish !== null) {
        const fish = db.fish[ui.fish];
        return { text: t(UI.fish_landed, lang, { fish: t(fish.name, lang), silver: fish.silver }), ...none };
      }
      const said = {
        spooked: UI.fish_spooked,
        missed: UI.fish_missed,
        snapped: UI.fish_snapped,
        slipped: UI.fish_slipped,
        landed: UI.fish_slipped,
      } as const;
      return { text: ui.result === null ? '' : t(said[ui.result], lang), ...none };
    }
  }
}

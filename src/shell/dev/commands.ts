import { isFlagId } from '@content/flags';
import { isScreenId } from '@content/world/screens';
import { isSeason } from '@core/clock/types';
import { parseClockTime } from '@core/dev/query';
import { LANGS } from '@core/i18n/t';
import { tileFeet } from '@core/world/screen';
import { browserStorage, saveSettings } from '@shell/platform/settings';
import type { DevBridge } from './bridge';

export const HELP =
  'warp <screen> [x y] · time <HH:MM|day|night> · season <name> · flag <id> <value> · lang <en|sv> · volume <0..1>';

/** Runs one console line. Returns the reply; `_print` is for replies that arrive later (unused for now). */
export function runCommand(b: DevBridge, line: string, _print: (text: string) => void): string {
  const [cmd = '', ...args] = line.trim().split(/\s+/);
  switch (cmd) {
    case 'help':
      return HELP;
    case 'warp': {
      const [screen = '', x = '20', y = '11'] = args;
      if (!isScreenId(screen)) return `unknown screen '${screen}'`;
      const p = tileFeet({ x: Number(x), y: Number(y) });
      b.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
      return `warped to ${screen} ${x},${y}`;
    }
    case 'time': {
      const text = args[0] ?? '';
      const minute = parseClockTime(text);
      if (minute === null) return 'usage: time HH:MM | day | night';
      b.sim.command({ t: 'setMinute', minute });
      return `time ${text}`;
    }
    case 'season': {
      const s = args[0] ?? '';
      if (!isSeason(s)) return `unknown season '${s}'`;
      b.sim.command({ t: 'setSeason', season: s });
      return `season ${s}`;
    }
    case 'flag': {
      const [id = '', raw = 'true'] = args;
      if (!isFlagId(id)) return `unknown flag '${id}'`;
      const value = raw === 'true' ? true : raw === 'false' ? false : Number(raw);
      if (typeof value === 'number' && !Number.isInteger(value))
        return 'value must be true, false or an integer';
      b.sim.command({ t: 'setFlag', flag: id, value });
      return `flag ${id} = ${String(value)}`;
    }
    case 'lang': {
      const lang = LANGS.find((l) => l === args[0]);
      if (lang === undefined) return `languages: ${LANGS.join(', ')}`;
      b.settings.lang = lang;
      saveSettings(browserStorage(), b.settings);
      return `language ${lang}`;
    }
    case 'volume': {
      const v = Number(args[0]);
      if (!Number.isFinite(v) || v < 0 || v > 1) return 'usage: volume 0..1';
      b.settings.volume = v;
      saveSettings(browserStorage(), b.settings);
      return `volume ${v}`;
    }
    default:
      return `unknown command '${cmd}' — try help`;
  }
}

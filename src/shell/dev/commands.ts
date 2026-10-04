import { isFlagId } from '@content/flags';
import { UI } from '@content/i18n/ui';
import { isScreenId } from '@content/world/screens';
import { ITEMS, type ItemId } from '@content/ids';
import { WEATHER_KINDS, isSeason, type WeatherKind } from '@core/clock/types';
import { parseClockTime } from '@core/dev/query';
import { LANGS, t } from '@core/i18n/t';
import { cloneState } from '@core/state/save';
import { tileFeet } from '@core/world/screen';
import { importMessageKey, pickSaveFile } from '@shell/platform/exportImport';
import { browserStorage, saveSettings } from '@shell/platform/settings';
import type { DevBridge } from './bridge';

export const HELP =
  'warp <screen> [x y] · time <HH:MM|day|night> · season <name> · flag <id> <value> · give <item> [n] · slot <1|2> <item|none> · hp <n> · god [on|off] · weather <kind|off> · kill · lang <en|sv> · volume <0..1> · save · export · import';

const isItem = (s: string): s is ItemId => (ITEMS as readonly string[]).includes(s);
const isWeather = (s: string): s is WeatherKind => (WEATHER_KINDS as readonly string[]).includes(s);

/** Runs one console line. Returns the reply; `print` is for replies that arrive later (save, import). */
export function runCommand(b: DevBridge, line: string, print: (text: string) => void): string {
  const [cmd = '', ...args] = line.trim().split(/\s+/);
  switch (cmd) {
    case 'help':
      return HELP;
    case 'warp': {
      const [screen = '', xRaw = '20', yRaw = '11'] = args;
      if (!isScreenId(screen)) return `unknown screen '${screen}'`;
      const x = Number(xRaw);
      const y = Number(yRaw);
      if (!Number.isInteger(x) || !Number.isInteger(y)) return 'usage: warp <screen> [x y]';
      const p = tileFeet({ x, y });
      b.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
      return `warped to ${screen} ${xRaw},${yRaw}`;
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
    case 'give': {
      const [item = '', raw = '1'] = args;
      const n = Number(raw);
      if (!isItem(item)) return `unknown item '${item}'`;
      if (!Number.isInteger(n) || n < 1) return 'usage: give <item> [n]';
      b.sim.command({ t: 'give', item, n });
      return `gave ${String(n)} ${item}`;
    }
    case 'slot': {
      const [which = '', item = ''] = args;
      if (which !== '1' && which !== '2') return 'usage: slot <1|2> <item|none>';
      if (item !== 'none' && !isItem(item)) return `unknown item '${item}'`;
      b.sim.command({ t: 'equip', slot: which === '1' ? 0 : 1, item: item === 'none' ? null : item });
      return `slot ${which}: ${item}`;
    }
    case 'hp': {
      const n = Number(args[0]);
      if (!Number.isInteger(n) || n < 0) return 'usage: hp <quarter hearts>';
      b.sim.command({ t: 'setHp', hp: n });
      return `hp ${String(n)}`;
    }
    case 'god': {
      const on = args[0] !== 'off';
      b.sim.command({ t: 'god', on });
      return `god ${on ? 'on' : 'off'}`;
    }
    case 'weather': {
      const kind = args[0] ?? '';
      if (kind === 'off') {
        b.sim.command({ t: 'weather', kind: null });
        return 'weather follows the story';
      }
      if (!isWeather(kind)) return `weather: ${WEATHER_KINDS.join(', ')}, off`;
      b.sim.command({ t: 'weather', kind });
      return `weather ${kind}`;
    }
    case 'kill':
      b.sim.command({ t: 'killAll' });
      return 'killed every enemy here';
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
    case 'save':
      b.saves.autosaver.request(b.sim.snapshot());
      void b.saves.autosaver.flush().then(() => {
        print('saved');
      });
      return 'saving…';
    case 'export':
      b.saves.download(b.sim.snapshot());
      return 'download started';
    case 'import':
      void pickSaveFile().then((text) => {
        if (text === null) {
          print('import cancelled');
          return;
        }
        const result = b.saves.importText(text);
        const detail = result.ok ? '' : result.error.detail;
        print(t(UI[importMessageKey(result)], b.settings.lang, { detail }));
        if (result.ok) {
          b.saves.autosaver.request(cloneState(result.state));
          b.restart(result.state);
        }
      });
      return 'choose a save file…';
    default:
      return `unknown command '${cmd}' — try help`;
  }
}

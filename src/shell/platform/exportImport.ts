import type { UiKey } from '@content/i18n/ui';
import type { LoadResult, SaveData } from '@core/state/save';

export function saveFileName(save: SaveData, slot: string): string {
  return `fimbulvetr-${slot}-${save.savedAt.slice(0, 10)}.json`;
}

/** Offers the save as a file download (works in every browser; no File System Access API needed). */
export function downloadSave(save: SaveData, slot: string): void {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = saveFileName(save, slot);
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Lets the player pick a .json file; resolves to its text, or null if cancelled. */
export function pickSaveFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file === undefined) {
        resolve(null);
        return;
      }
      file.text().then(resolve, () => {
        resolve(null);
      });
    });
    input.addEventListener('cancel', () => {
      resolve(null);
    });
    input.click();
  });
}

export function importMessageKey(result: LoadResult): UiKey {
  if (result.ok) return result.checksumOk ? 'import_ok' : 'import_checksum';
  switch (result.error.code) {
    case 'not-a-save':
      return 'import_bad_file';
    case 'too-new':
      return 'import_too_new';
    case 'invalid':
      return 'import_invalid';
  }
}

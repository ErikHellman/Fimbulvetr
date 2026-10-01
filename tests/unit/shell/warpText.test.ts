import { describe, expect, it } from 'vitest';
import { warpLines } from '@shell/ui/warpText';

describe('warpLines', () => {
  it('lists the woken stones by region, then "stay", with the cursor and the cost', () => {
    const lines = warpLines({ k: 'warps', rows: ['haugar', 'myrland'], cursor: 1 }, 4, 'en');
    expect(lines).toEqual([
      'Farvegr: which stone calls?',
      '',
      '  Haugar',
      '> Mýrland',
      '  Stay here',
      '',
      'Costs 4 seiðr.',
    ]);
    expect(warpLines({ k: 'warps', rows: [], cursor: 0 }, 4, 'sv')).toContain('> Stanna här');
  });
});

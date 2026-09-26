import type { GaldrDef } from '@core/items/defs';
import type { GaldrId } from './ids';

export const GALDR_DEFS = {
  eldr: { name: { en: 'Eldr — fire', sv: 'Eldr — eld' }, cost: 2 },
  is: { name: { en: 'Ís — ice', sv: 'Ís — is' }, cost: 3 },
  farvegr: { name: { en: 'Farvegr — the way', sv: 'Farvegr — vägen' }, cost: 4 },
  hlif: { name: { en: 'Hlíf — shelter', sv: 'Hlíf — skydd' }, cost: 3 },
  skjalfti: { name: { en: 'Skjálfti — tremor', sv: 'Skjálfti — skalv' }, cost: 5 },
  ljos: { name: { en: 'Ljós — light', sv: 'Ljós — ljus' }, cost: 2 },
  vindr: { name: { en: 'Vindr — wind', sv: 'Vindr — vind' }, cost: 3 },
  bragd: { name: { en: 'Bragð — sword beam', sv: 'Bragð — svärdsstråle' }, cost: 4 },
} as const satisfies Record<GaldrId, GaldrDef>;

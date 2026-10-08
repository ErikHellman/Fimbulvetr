import type { L10n } from '@core/i18n/t';
import type { ScriptDef } from '@core/story/script';
import type { FlagId } from '../flags';
import type { ScriptId } from '../ids';

/**
 * A bauta-stone (M11a, `q_record`): the first reading adds its name to the count; later ones only read it
 * again.
 */
function bauta(read: FlagId, text: L10n): ScriptDef {
  return {
    steps: [
      { k: 'say', who: null, text },
      {
        k: 'if',
        when: { k: 'not', c: { k: 'flag', id: read } },
        then: [
          {
            k: 'do',
            effects: [
              { k: 'set', flag: read, value: true },
              { k: 'add', flag: 'q_record', n: 1 },
              { k: 'sfx', id: 'sfx_itemget' },
            ],
          },
        ],
      },
    ],
  };
}

/** The four stones raised for the huscarls who fell at the first binding. */
export const RECORD_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  bauta_myr: bauta('st_bauta_myr', {
    en: 'A bauta-stone, green with moss. The runes read: “Hallveig raised this stone for Arnfinnr, her husband. He went up the mountain with the goði and did not come down.”',
    sv: 'En bautasten, grön av mossa. Runorna lyder: ”Hallveig reste denna sten efter Arnfinnr, sin make. Han gick upp på berget med goden och kom inte ner.”',
  }),
  bauta_hau: bauta('st_bauta_hau', {
    en: 'A bauta-stone among the barrows. The runes read: “Eiríkr and Ari raised this stone for Sæmundr, their brother, who held the line at the binding.”',
    sv: 'En bautasten bland högarna. Runorna lyder: ”Eiríkr och Ari reste denna sten efter Sæmundr, sin bror, som höll leden vid bindningen.”',
  }),
  bauta_sae: bauta('st_bauta_sae', {
    en: 'A bauta-stone by the landing, its foot in the reeds. The runes read: “Þóra raised this stone for Þorvaldr, her son. The lake did not take him; the mountain did.”',
    sv: 'En bautasten vid bryggan, med foten i vassen. Runorna lyder: ”Þóra reste denna sten efter Þorvaldr, sin son. Sjön tog honom inte; berget gjorde det.”',
  }),
  bauta_hrf: bauta('st_bauta_hrf', {
    en: 'A bauta-stone under a skin of rime. The runes read: “Gunnarr lies here, nearest the King. His friends could carry him no further.”',
    sv: 'En bautasten under en hinna av rimfrost. Runorna lyder: ”Här ligger Gunnarr, närmast Kungen. Hans vänner orkade inte bära honom längre.”',
  }),
};

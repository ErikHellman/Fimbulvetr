import type { VerseDef } from '@core/world/mapModel';

/** Bragi's price for one verse, in silver. */
export const VERSE_PRICE = 30;

/**
 * The wandering skald's verses (M6a): each one, once bought, marks a secret on the pause map until its
 * heart piece is found. Three of the fog, then four of the wider world (M11a).
 */
export const VERSES: readonly VerseDef[] = [
  {
    flag: 'w_verse_deadwood',
    screen: 'nif_deadwood',
    piece: 'hp_nif_deadwood',
    text: {
      en: '“In the drowned wood where dead trees stand, a path runs under the mist. No foot finds it in the fog; only light lays it bare.”',
      sv: '”I den drunknade skogen där döda träd står går en stig under dimman. Ingen fot finner den i diset; bara ljus lägger den bar.”',
    },
  },
  {
    flag: 'w_verse_cairns',
    screen: 'nif_cairns',
    piece: 'hp_nif_cairns',
    text: {
      en: '“Among the sunken cairns a still pool keeps a heart. Water bears no one, until the frost lays a floor on it.”',
      sv: '”Bland de sjunkna rösena gömmer en stilla göl ett hjärta. Vatten bär ingen, förrän frosten lägger ett golv på det.”',
    },
  },
  {
    flag: 'w_verse_gjoll',
    screen: 'nif_gjoll',
    piece: 'hp_nif_gjoll',
    text: {
      en: '“By the Gjöll’s bones an island holds what the river kept. Feet cannot cross the black water; a chain can.”',
      sv: '”Vid Gjölls ben håller en holme det som floden behöll. Fötter tar sig inte över det svarta vattnet; en kedja kan.”',
    },
  },
  {
    flag: 'w_verse_sinkhole',
    screen: 'hau_gully',
    piece: 'hp_hau_sinkhole',
    text: {
      en: '“In Haugar’s gully the ground fell in, and a heart was left on a ledge no foot can reach. The miners drove iron into either lip; a chain finds it.”',
      sv: '”I Haugars ravin rasade marken, och ett hjärta blev kvar på en avsats ingen fot når. Gruvfolket slog järn i vardera kanten; en kedja hittar dit.”',
    },
  },
  {
    flag: 'w_verse_store',
    screen: 'dvg_ledges',
    piece: 'hp_dvg_store',
    text: {
      en: '“On the dwarves’ ledges a store is cut in the rock, and a stake bars its door. No hand pulls a dwarf’s stake; a hammer drives it home.”',
      sv: '”På dvärgarnas avsatser är ett förråd uthugget i berget, och en påle spärrar dess dörr. Ingen hand drar upp en dvärgs påle; en hammare driver ner den.”',
    },
  },
  {
    flag: 'w_verse_slag',
    screen: 'dvg_slag',
    piece: 'hp_dvg_slag',
    text: {
      en: '“Among the slag-heaps a pool of fire never cooled, and a heart lies dry in its eye. Fire bears no foot, until the ice-song lays a crust on it.”',
      sv: '”Bland slagghögarna har en göl av eld aldrig svalnat, och ett hjärta ligger torrt i dess öga. Eld bär ingen fot, förrän issången lägger en skorpa på den.”',
    },
  },
  {
    flag: 'w_verse_thaw',
    screen: 'hrf_saddle',
    piece: 'hp_hrf_thaw',
    text: {
      en: '“In the saddle under Hrímfjöll a tarn-eye sleeps under the rime, and keeps a heart on its bottom. It wakes when the mountain wakes.”',
      sv: '”I sadeln under Hrímfjöll sover ett tjärnöga under rimfrosten och gömmer ett hjärta på botten. Det vaknar när berget vaknar.”',
    },
  },
];

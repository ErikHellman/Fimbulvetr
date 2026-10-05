import type { AchievementDef } from '@core/progress/achievements';
import type { Cond } from '@core/story/cond';
import { all, atLeast, flag } from './dialogue/util';
import { GALDR, type QuestId } from './ids';
import { QUEST_DEFS, SIDE_QUESTS } from './quests';
import { SCREENS } from './world/registry';

/** Every heart piece in the game (nine hearts' worth). */
export const PIECE_TOTAL = 36;
/** One warp stone per region. */
export const WARP_TOTAL = new Set(
  Object.values(SCREENS).flatMap((s) => s.things.flatMap((t) => (t.k === 'warp' ? [t.region] : []))),
).size;

/** The quest's last stage reached: done. */
export function questDone(id: QuestId): Cond {
  const q = QUEST_DEFS[id];
  if (q === undefined) throw new Error(`no quest ${id}`);
  return { k: 'quest', id, gte: q.stages.length - 1 };
}

/** The 24 achievements (M11a), in the order the list shows them. */
export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  {
    id: 'ach_raid',
    name: { en: 'The long night', sv: 'Den långa natten' },
    hint: { en: 'Live through the raid on Askdalr.', sv: 'Överlev räden mot Askdalr.' },
    when: flag('st_raid_done'),
  },
  {
    id: 'ach_stone1',
    name: { en: 'The first fire', sv: 'Den första elden' },
    hint: { en: 'Light the first runestone.', sv: 'Tänd den första runstenen.' },
    when: flag('st_stone1_lit'),
  },
  {
    id: 'ach_stones',
    name: { en: 'Three fires', sv: 'Tre eldar' },
    hint: { en: 'Light all three runestones.', sv: 'Tänd alla tre runstenarna.' },
    when: all(flag('st_stone1_lit'), flag('st_stone2_lit'), flag('st_stone3_lit')),
  },
  {
    id: 'ach_thane1',
    name: { en: 'Thane-bane', sv: 'Tegnens bane' },
    hint: { en: 'Kill one of the Rime King’s thanes.', sv: 'Döda en av Rimkungens tegnar.' },
    when: atLeast('q_thanes', 1),
  },
  {
    id: 'ach_thanes',
    name: { en: 'Four thanes', sv: 'Fyra tegnar' },
    hint: { en: 'Kill all four of the Rime King’s thanes.', sv: 'Döda alla fyra av Rimkungens tegnar.' },
    when: atLeast('q_thanes', 4),
  },
  {
    id: 'ach_embla',
    name: { en: 'Found', sv: 'Funnen' },
    hint: { en: 'Find Embla.', sv: 'Hitta Embla.' },
    when: flag('st_embla_found'),
  },
  {
    id: 'ach_king',
    name: { en: 'The winter ends', sv: 'Vintern tar slut' },
    hint: { en: 'Defeat Hrímnir, the Rime King.', sv: 'Besegra Hrímnir, Rimkungen.' },
    when: flag('st_hrimnir_dead'),
  },
  {
    id: 'ach_spared',
    name: { en: 'Mercy', sv: 'Nåd' },
    hint: { en: 'Spare Kolbeinn.', sv: 'Skona Kolbeinn.' },
    when: flag('st_kolbeinn_spared'),
  },
  {
    id: 'ach_slain',
    name: { en: 'Wergild', sv: 'Mansbot' },
    hint: { en: 'Slay Kolbeinn.', sv: 'Dräp Kolbeinn.' },
    when: flag('st_kolbeinn_slain'),
  },
  {
    id: 'ach_stay',
    name: { en: 'Home', sv: 'Hemma' },
    hint: { en: 'Stay in Askdalr.', sv: 'Stanna i Askdalr.' },
    when: flag('st_end_stay'),
  },
  {
    id: 'ach_go',
    name: { en: 'The sea road', sv: 'Havsvägen' },
    hint: { en: 'Say you will sail with Embla.', sv: 'Säg att du seglar med Embla.' },
    when: flag('st_end_go'),
  },
  {
    id: 'ach_captives',
    name: { en: 'Everyone home', sv: 'Alla hemma' },
    hint: { en: 'Free all eight captives.', sv: 'Befria alla åtta fångar.' },
    when: atLeast('q_captives', 8),
  },
  {
    id: 'ach_letters',
    name: { en: 'Her letters', sv: 'Hennes brev' },
    hint: { en: 'Find all of Embla’s letters.', sv: 'Hitta alla Emblas brev.' },
    when: atLeast('q_letters', 3),
  },
  {
    id: 'ach_trade',
    name: { en: 'The long trade', sv: 'Den långa handeln' },
    hint: { en: 'Finish the chain of trades.', sv: 'Gör klart bytesraden.' },
    when: questDone('q_trade'),
  },
  {
    id: 'ach_farm',
    name: { en: 'The farm stands', sv: 'Gården står' },
    hint: { en: 'Rebuild the whole farm.', sv: 'Bygg upp hela gården.' },
    when: questDone('q_farm'),
  },
  {
    id: 'ach_loom',
    name: { en: 'The Norns’ thread', sv: 'Nornornas tråd' },
    hint: { en: 'Bring Urðr her three threads.', sv: 'Ge Urðr hennes tre trådar.' },
    when: flag('st_loom_woven'),
  },
  {
    id: 'ach_gamli',
    name: { en: 'Gamli', sv: 'Gamle' },
    hint: { en: 'Catch the old pike.', sv: 'Fånga den gamla gäddan.' },
    when: flag('q_fish_gamli'),
  },
  {
    id: 'ach_galdr',
    name: { en: 'Every song', sv: 'Varje sång' },
    hint: { en: 'Learn every galdr.', sv: 'Lär dig alla galdrar.' },
    when: { k: 'all', of: GALDR.map((id) => ({ k: 'galdr', id }) as const) },
  },
  {
    id: 'ach_warps',
    name: { en: 'Every stone awake', sv: 'Alla stenar vakna' },
    hint: { en: 'Wake every warp stone.', sv: 'Väck alla färdstenar.' },
    when: { k: 'warps', gte: WARP_TOTAL },
  },
  {
    id: 'ach_pieces',
    name: { en: 'A whole heart', sv: 'Ett helt hjärta' },
    hint: { en: 'Find every piece of heart.', sv: 'Hitta alla hjärtbitar.' },
    when: { k: 'pieces', gte: PIECE_TOTAL },
  },
  {
    id: 'ach_side',
    name: { en: 'Good neighbour', sv: 'God granne' },
    hint: { en: 'Finish every side quest.', sv: 'Gör klart alla sidouppdrag.' },
    when: { k: 'all', of: SIDE_QUESTS.map(questDone) },
  },
  {
    id: 'ach_silver',
    name: { en: 'Hoard', sv: 'Skatt' },
    hint: { en: 'Carry 500 silver.', sv: 'Bär 500 silver.' },
    when: { k: 'silver', gte: 500 },
  },
  {
    id: 'ach_record',
    name: { en: 'The names', sv: 'Namnen' },
    hint: { en: 'Bring Gyða the names from the bauta-stones.', sv: 'Ge Gyða namnen från bautastenarna.' },
    when: flag('q_record_done'),
  },
  {
    id: 'ach_feast',
    name: { en: 'The spring feast', sv: 'Vårgillet' },
    hint: { en: 'Sit at Askdalr’s spring feast.', sv: 'Sitt med vid Askdalrs vårgille.' },
    when: flag('q_feast_done'),
  },
];

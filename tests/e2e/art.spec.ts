import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { boot, collectErrors } from './helpers';

const FIXTURES = new URL('../fixtures/atlases/', import.meta.url);
const types: Record<string, string> = { png: 'image/png', json: 'application/json' };

// The service worker would answer for the atlas files once installed; routes must see every request.
test.use({ serviceWorkers: 'block' });

test('real art listed in atlases/manifest.json replaces frames and tiles by name', async ({ page }) => {
  const errors = collectErrors(page);
  await page.route('**/atlases/*', (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    const ext = file.split('.').pop() ?? '';
    return route.fulfill({
      body: readFileSync(new URL(file, FIXTURES)),
      contentType: types[ext] ?? 'application/octet-stream',
    });
  });
  await boot(page, 'nosave&preset=m0&screen=test_a&at=13,11');
  const overrides = await page.evaluate(() => window.__fimbul?.artOverrides());
  expect(overrides?.tiles).toEqual(['grass']);
  expect([...(overrides?.frames ?? [])].sort()).toEqual(['hero_axe_idle_s_0', 'hero_idle_s_0']);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});

test('the shipped manifest replaces the hero, villager, decor, wilds-foe and dungeon-foe frames and the Askdalr, Myrkviðr, Mýrland, Haugar, Niflmýrr, Sævatn, Dvergagröf and Hrímfjöll ground, the Forge, Rótarhellir, Konungshaugr, Sökkva Kvern, the hof and Útgarðr', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&preset=m0&screen=test_a&at=13,11');
  const overrides = await page.evaluate(() => window.__fimbul?.artOverrides());
  expect(overrides?.tiles).toEqual([
    'grass',
    'path',
    'yard',
    'field',
    'fence',
    'rock',
    'roof',
    'water',
    'ford',
    'tree',
    'ledge',
    'wall',
    'door',
    'door_shut',
    'window',
    'chimney',
    'floor',
    'wall_int',
    'jetty',
    'pine',
    'well',
    'trough',
    'stump',
    'menhir',
    'runestone',
    'birch',
    'boulder',
    'bed',
    'table',
    'hearth',
    'moss',
    'bog',
    'reeds',
    'mound',
    'cave_mouth',
    'kiln',
    'rapids',
    'sand',
    'peat',
    'silt',
    'spring',
    'shoal',
    'planks',
    'palisade',
    'mill',
    'boat',
    'anvil',
    'stall',
    'thingstone',
    'heath',
    'barrow',
    'flagstone',
    'drystone',
    'cairn',
    'tent',
    'mire',
    'blackwater',
    'drowned_path',
    'snag',
    'current_n',
    'current_e',
    'current_s',
    'current_w',
    'surge_n',
    'surge_e',
    'surge_s',
    'surge_w',
    'scree',
    'cave_floor',
    'cave_wall',
    'firn',
    'glaze',
    'rime',
    'tower_floor',
    'tower_wall',
    'clear_ice',
    'forge_floor',
    'forge_wall',
    'lava',
    'belt_n',
    'belt_e',
    'belt_s',
    'belt_w',
    'sap',
    'roots',
    'crypt_floor',
    'crypt_wall',
    'pit',
    'ghost',
    'sluice',
    'sluice_hi',
    'race',
    'race_hi',
    'boards',
    'mill_wall',
    'hof_floor',
    'hof_floor_hi',
    'arch',
    'giant_floor',
    'giant_wall',
  ]);
  expect(overrides?.frames).toContain('hero_idle_s_0');
  expect(overrides?.frames).toContain('hero_fork_attack1_e_2');
  expect(overrides?.frames).toContain('npc_embla_walk_e_3');
  expect(overrides?.frames).toContain('npc_halvar_idle_n_1');
  expect(overrides?.frames).toContain('decor_well_idle_s_3');
  expect(overrides?.frames).toContain('decor_hearth_idle_s_3');
  expect(overrides?.frames).toContain('decor_kiln_idle_s_0');
  expect(overrides?.frames).toContain('decor_mill_idle_s_0');
  expect(overrides?.frames).toContain('enemy_vargr_walk_e_2');
  expect(overrides?.frames).toContain('enemy_troll_smash_s_1');
  expect(overrides?.frames).toContain('enemy_draugr_rise_n_3');
  expect(overrides?.frames).toContain('fx_poof_idle_s_3');
  expect(overrides?.frames).toContain('enemy_root_biter_bite_s_1');
  expect(overrides?.frames).toContain('enemy_lindormr_coil_e_0');
  expect(overrides?.frames).toContain('enemy_haugkonungr_charge_w_1');
  expect(overrides?.frames).toContain('enemy_myrljos_tell_n_0');
  expect(overrides?.frames).toContain('enemy_nykr_whirl_s_1');
  expect(overrides?.frames).toContain('enemy_garmr_lunge_w_0');
  expect(overrides?.frames).toContain('enemy_mara_ride_e_0');
  expect(overrides?.frames).toContain('enemy_nykr_foal_flounder_n_1');
  expect(overrides?.frames).toContain('enemy_ivaldi_hotwalk_w_2');
  expect(overrides?.frames).toContain('enemy_frostvaettr_tell_e_0');
  expect(overrides?.frames).toContain('enemy_hrimgerdr_cast_s_1');
  expect(overrides?.frames).toContain('enemy_hrimnir_open_n_0');
  expect(overrides?.frames).toContain('enemy_rime_pillar_fall_s_1');
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});

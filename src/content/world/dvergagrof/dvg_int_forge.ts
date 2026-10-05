import type { ScreenDef } from '@core/world/screen';

export const dvgIntForge: ScreenDef = {
  id: 'dvg_int_forge',
  region: 'dvergagrof',
  purpose:
    "Inside Sindri's smithy: the forge and its great bellows, the anvil, and racks of dwarf-work. Sindri forges the ember byrnie and the dwarf-forged blade here.",
  indoor: true,
  things: [
    { k: 'door', at: { x: 19, y: 16 }, dir: 's', to: 'dvg_camp', arrive: { x: 29, y: 6 }, facing: 's' },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXwwwwwwwwwwwwwwwwwwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwfhhfffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwfhhfffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffafffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffttffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwffffffffffffffffwXXXXXXXXXXX',
    'XXXXXXXXXXXwwwwwwwwDwwwwwwwwwXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};

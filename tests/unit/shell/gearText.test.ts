import { describe, expect, it } from 'vitest';
import { TEST_START } from '@content/start';
import { newGame } from '@core/state/gameState';
import { gearLines } from '@shell/ui/gearText';

describe('the Gear page', () => {
  it('shows the arm-ring worn, with its icon, and nothing when none is', () => {
    const s = newGame(1, TEST_START);
    expect(gearLines(s, 'en').some((l) => l.text.startsWith('Arm-ring'))).toBe(false);
    s.inv.ring = 'ring_stamina';
    expect(gearLines(s, 'en')).toContainEqual({
      icon: 'ring_stamina',
      text: 'Arm-ring: Arm-ring of stamina',
    });
    expect(gearLines(s, 'sv')).toContainEqual({
      icon: 'ring_stamina',
      text: 'Armring: Armring av uthållighet',
    });
  });
});

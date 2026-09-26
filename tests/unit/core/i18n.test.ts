import { describe, expect, it } from 'vitest';
import { t } from '@core/i18n/t';

describe('t', () => {
  it('picks the language', () => {
    expect(t({ en: 'Save', sv: 'Spara' }, 'sv')).toBe('Spara');
  });

  it('fills variables', () => {
    expect(t({ en: 'Hi {name}', sv: 'Hej {name}' }, 'en', { name: 'Ask' })).toBe('Hi Ask');
  });

  it('leaves unknown variables visible', () => {
    expect(t({ en: 'Hi {missing}', sv: 'Hej {missing}' }, 'en')).toBe('Hi {missing}');
  });
});

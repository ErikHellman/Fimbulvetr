import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

/** The spring feast (M11a, `q_feast`): Askdalr at Halvar's table, the evening after it is all brought. */
const endFeast: ScriptDef = {
  steps: [
    { k: 'fade', out: true },
    { k: 'do', effects: [{ k: 'setMinute', minute: 20 * 60 }] },
    {
      k: 'card',
      text: { en: 'That evening, at Halvar’s table…', sv: 'Den kvällen, vid Halvars bord…' },
    },
    { k: 'fade', out: false },
    {
      k: 'say',
      who: null,
      text: {
        en: 'The longhouse is fuller than it has been in Ask’s lifetime. The mead goes round, Kári’s burbot goes round, and the dwarves’ ale goes round twice.',
        sv: 'Långhuset är fullare än det har varit i hela Asks liv. Mjödet går runt, Káris lake går runt, och dvärgarnas öl går runt två gånger.',
      },
    },
    {
      k: 'say',
      who: 'halvar',
      text: {
        en: 'A toast. To the forty who went up the mountain, and to the one who went up after them and came back down.',
        sv: 'En skål. För de fyrtio som gick upp på berget, och för den som gick upp efter dem och kom ner igen.',
      },
    },
    {
      k: 'say',
      who: 'gyda',
      text: {
        en: 'I have cut it into the record already, child. Do not let it go to your head.',
        sv: 'Jag har redan ristat in det i krönikan, barn. Låt det inte stiga dig åt huvudet.',
      },
    },
    {
      k: 'say',
      who: 'sigrun',
      text: {
        en: 'That cask was worth every summer I kept it.',
        sv: 'Den kaggen var värd varenda sommar jag sparade på den.',
      },
    },
    {
      k: 'if',
      when: { k: 'flag', id: 'st_end_go' },
      then: [
        {
          k: 'say',
          who: 'embla',
          text: {
            en: 'One more night of mead, and then the sea. The boat will wait for us.',
            sv: 'En natt till med mjöd, och sedan havet. Båten väntar på oss.',
          },
        },
      ],
      else: [
        {
          k: 'say',
          who: 'embla',
          text: {
            en: 'Next spring, the same table. And the one after.',
            sv: 'Nästa vår, samma bord. Och våren efter den.',
          },
        },
      ],
    },
    {
      k: 'say',
      who: 'halvar',
      text: {
        en: 'And this. My mother sewed it into my cloak the day I went up the mountain. I think it was meant for you.',
        sv: 'Och det här. Min mor sydde in det i min mantel den dag jag gick upp på berget. Jag tror att det var menat för dig.',
      },
    },
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'q_feast_done', value: true },
        { k: 'piece', id: 'hp_feast' },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
  ],
};

export const FEAST_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  end_feast: endFeast,
};

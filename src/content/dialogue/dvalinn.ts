import type { DialogueDef } from '@core/story/dialogue';
import { atLeast } from './util';

/**
 * Dvalinn the foreman (M8a): his crew is trapped in the old workings behind a cave-in. His chain
 * (`q_foreman`): 1 asked, 2 the cave-in cleared, 3 Hekla goes with Ask, 4 the crew is out, 5 the cart road
 * open.
 */
export const DVALINN: DialogueDef = {
  entry: [
    { when: atLeast('q_foreman', 5), node: 'after' },
    { when: atLeast('q_foreman', 4), node: 'road' },
    { when: atLeast('q_foreman', 3), node: 'waiting' },
    { when: atLeast('q_foreman', 2), node: 'hekla' },
    { when: atLeast('q_foreman', 1), node: 'again' },
    { node: 'ask' },
  ],
  nodes: {
    ask: {
      text: {
        en: 'A long-legs, over the chasm? Then you climb better than my crew digs. Six of them are behind the fall at the mine mouth, and the iron wardens walk the camp at night.',
        sv: 'En långben, över klyftan? Då klättrar du bättre än mitt lag gräver. Sex av dem sitter bakom raset vid gruvmynningen, och järnväktarna går runt lägret om natten.',
      },
      next: 'ask2',
    },
    ask2: {
      text: {
        en: 'If you have powder to break rock, break that fall. Ívaldi’s forge has eaten all of ours.',
        sv: 'Om du har krut som spränger sten, spräng då raset. Ívaldis smedja har ätit upp allt vårt.',
      },
      do: [{ k: 'set', flag: 'q_foreman', value: 1 }],
    },
    again: {
      text: {
        en: 'The fall is at the mine mouth, north of the camp. Every hour it stands is an hour of lamp-oil gone.',
        sv: 'Raset ligger vid gruvmynningen, norr om lägret. Varje timme det står kvar är en timme lampolja som brinner bort.',
      },
    },
    hekla: {
      text: {
        en: 'You broke it? Then listen. The old workings run crooked, and only my Hekla knows the way to the lamp-room where they will have sheltered.',
        sv: 'Har du sprängt det? Lyssna då. De gamla gångarna slingrar sig, och bara min Hekla hittar vägen till lampsalen där de har tagit skydd.',
      },
      next: 'hekla2',
    },
    hekla2: {
      text: {
        en: 'She is waiting at the mine mouth. Keep the wardens off her, long-legs. She is all I have left of her mother.',
        sv: 'Hon väntar vid gruvmynningen. Håll väktarna borta från henne, långben. Hon är allt jag har kvar av hennes mor.',
      },
      do: [{ k: 'set', flag: 'q_foreman', value: 3 }],
    },
    waiting: {
      text: {
        en: 'Hekla waits at the mine mouth. If she runs, she runs back there; she is not a fool.',
        sv: 'Hekla väntar vid gruvmynningen. Om hon springer, springer hon dit; hon är ingen dåre.',
      },
    },
    road: {
      text: {
        en: 'Six, all six, and my girl with them. Take this ore; it is the best we cut this year.',
        sv: 'Sex, alla sex, och min flicka med dem. Ta den här malmen; den är det bästa vi har brutit i år.',
      },
      next: 'road2',
    },
    road2: {
      text: {
        en: 'And the cart road east of the mine mouth is open again, down under the hills to the smiths of Uppvík. Use it both ways.',
        sv: 'Och kärrvägen öster om gruvmynningen är öppen igen, ner under bergen till smederna i Uppvík. Använd den åt båda hållen.',
      },
      do: [
        { k: 'give', item: 'ore', n: 6 },
        { k: 'set', flag: 'q_foreman', value: 5 },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    after: {
      text: {
        en: 'The crew digs again. The forge-gate east still glows, though. Whatever Ívaldi beats on in there, it is not iron.',
        sv: 'Laget gräver igen. Smedjeporten i öster glöder ändå. Vad Ívaldi än slår på därinne så är det inte järn.',
      },
    },
  },
};

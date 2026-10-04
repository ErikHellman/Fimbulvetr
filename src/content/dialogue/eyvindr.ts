import type { DialogueDef } from '@core/story/dialogue';
import { all, evening, flag, not } from './util';

/** Eyvindr fishes off the jetty by day and tells stories in the mead hall by night. */
export const EYVINDR: DialogueDef = {
  entry: [
    { when: not(flag('n_eyvindr_met')), node: 'meet' },
    { when: flag('q_burbot_done'), node: 'burbot_after' },
    { when: all(flag('q_burbot_asked'), flag('q_burbot_caught')), node: 'burbot' },
    { when: flag('q_burbot_asked'), node: 'burbot_wait' },
    { when: all(flag('st_pass_open'), not(evening)), node: 'burbot_ask' },
    { when: evening, node: 'night' },
    { when: flag('n_kari_met'), node: 'kari' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { node: 'day' },
  ],
  nodes: {
    burbot_ask: {
      text: {
        en: 'Frozen to the bottom, they say. Not my bay. Under the ice the burbot are spawning, the only fish that loves the cold.',
        sv: 'Bottenfrusen, säger de. Inte min vik. Under isen leker lakerna, den enda fisken som älskar kylan.',
      },
      next: 'burbot_ask2',
    },
    burbot_ask2: {
      text: {
        en: 'I cut a hole off the jetty’s end, but my hands are too cold to feel a bite. They take the bait after dark. Land me one?',
        sv: 'Jag högg upp en vak vid bryggans ände, men mina händer är för kalla för att känna ett napp. De tar betet efter mörkrets inbrott. Drar du upp en åt mig?',
      },
      do: [
        { k: 'set', flag: 'q_burbot_asked', value: true },
        { k: 'set', flag: 'q_burbot_caught', value: false },
      ],
    },
    burbot_wait: {
      text: {
        en: 'The hole off the jetty’s end, in winter, after dark. Strike when the float goes under, and do not haul against a running fish.',
        sv: 'Vaken vid bryggans ände, på vintern, efter mörkrets inbrott. Hugg när flötet går under, och dra inte emot en fisk som rusar.',
      },
    },
    burbot: {
      text: {
        en: 'A burbot, out of my frozen bay! Then the bay still lives, whatever the mountain says. Here, I found this in a net once. It is yours.',
        sv: 'En lake, ur min frusna vik! Då lever viken ännu, vad berget än säger. Här, den här hittade jag i ett nät en gång. Den är din.',
      },
      do: [
        { k: 'set', flag: 'q_burbot_done', value: true },
        { k: 'piece', id: 'hp_upp_bay' },
      ],
    },
    burbot_after: {
      text: {
        en: 'I fish the hole myself now, in two pairs of mittens. Nothing yet. But something.',
        sv: 'Jag fiskar i vaken själv nu, i två par vantar. Ingenting än. Men något.',
      },
    },
    kari: {
      text: {
        en: 'You met old Kári down in Mýrland? He says his pike weighs as much as a calf. Liar. It weighs as much as two.',
        sv: 'Har du träffat gamle Kári nere i Mýrland? Han säger att hans gädda väger som en kalv. Lögnare. Den väger som två.',
      },
    },
    meet: {
      text: {
        en: 'Quiet, you will scare the fish. Eyvindr. Not that there are fish. The bay freezes earlier every winter.',
        sv: 'Tyst, du skrämmer fisken. Eyvindr. Inte för att det finns någon fisk. Viken fryser tidigare varje vinter.',
      },
      do: [{ k: 'set', flag: 'n_eyvindr_met', value: true }],
    },
    day: {
      text: {
        en: 'My grandfather fished this bay in his shirt all summer. I wear two cloaks in the harvest month.',
        sv: 'Min farfar fiskade i viken i bara skjortan hela sommaren. Jag bär två kappor i skördemånaden.',
      },
    },
    night: {
      text: {
        en: 'Out on the jetty at night I hear bells under the water. Glúmr says that is the mead. I drink less than Glúmr.',
        sv: 'Ute på bryggan om natten hör jag klockor under vattnet. Glúmr säger att det är mjödet. Jag dricker mindre än Glúmr.',
      },
    },
    rain: {
      text: {
        en: 'Fish do not mind the rain. I do. So here I sit, dry and fishless.',
        sv: 'Fisken bryr sig inte om regnet. Det gör jag. Så här sitter jag, torr och fisklös.',
      },
    },
  },
};

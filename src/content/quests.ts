import type { QuestDef } from '@core/story/quests';
import { afterRaid, all, atLeast, choresDone, day, eve, flag, paid } from './dialogue/util';
import type { QuestId } from './ids';

const home = { en: 'Evening. Go home to the longhouse.', sv: 'Kväll. Gå hem till långhuset.' };
const sleep = { en: 'Sleep. There will be more work tomorrow.', sv: 'Sov. I morgon blir det mer arbete.' };
const tell = { en: 'Tell Halvar the work is done.', sv: 'Berätta för Halvar att arbetet är gjort.' };

/** Quest definitions. Stages are derived from flags; the last one whose condition holds is current. */
export const QUEST_DEFS: Readonly<Partial<Record<QuestId, QuestDef>>> = {
  q_chores: {
    id: 'q_chores',
    name: { en: 'Farm chores', sv: 'Sysslor på gården' },
    stages: [
      {
        when: atLeast('st_farm_day', 1),
        text: { en: 'Pen the five sheep and fill the trough.', sv: 'Driv in de fem fåren och fyll tråget.' },
      },
      { when: all(day(1), choresDone(1)), text: tell },
      { when: flag(paid(1)), text: home },
      { when: flag(eve(1)), text: sleep },
      {
        when: atLeast('st_farm_day', 2),
        text: { en: 'Split the firewood by the chopping block.', sv: 'Klyv veden vid huggkubben.' },
      },
      { when: all(day(2), choresDone(2)), text: tell },
      { when: flag(paid(2)), text: home },
      { when: flag(eve(2)), text: sleep },
      {
        when: atLeast('st_farm_day', 3),
        text: { en: 'Drive the ravens off the barley.', sv: 'Jaga bort korparna från kornet.' },
      },
      { when: all(day(3), choresDone(3)), text: tell },
      { when: flag(paid(3)), text: home },
      { when: flag(eve(3)), text: sleep },
      {
        when: flag('st_raid_begun'),
        text: { en: 'A horn in the night. Something is wrong.', sv: 'Ett horn i natten. Något är fel.' },
      },
    ],
  },
  q_legend: {
    id: 'q_legend',
    name: { en: 'The raid', sv: 'Räden' },
    stages: [
      {
        when: afterRaid,
        text: { en: 'Halvar is asking for you.', sv: 'Halvar frågar efter dig.' },
      },
      {
        when: flag('st_seax_given'),
        text: { en: 'Go to the hof and hear what Gyða knows.', sv: 'Gå till hovet och hör vad Gyða vet.' },
      },
      {
        when: flag('st_legend_told'),
        text: {
          en: 'Kolbeinn took Embla and eight villagers for the Rime King.',
          sv: 'Kolbeinn tog Embla och åtta bybor åt Rimkungen.',
        },
      },
    ],
  },
  q_runestone_1: {
    id: 'q_runestone_1',
    name: { en: 'The first runestone', sv: 'Den första runstenen' },
    stages: [
      {
        when: flag('st_legend_told'),
        text: {
          en: 'Find Rótarhellir, the root cave in Myrkviðr, and light the first runestone again.',
          sv: 'Hitta Rótarhellir, rotgrottan i Myrkviðr, och tänd den första runstenen igen.',
        },
      },
      {
        when: flag('st_d1_entered'),
        text: {
          en: 'Find a way down through the roots of Rótarhellir to whatever keeps the stone dark.',
          sv: 'Hitta en väg ner genom Rótarhellirs rötter till det som håller stenen mörk.',
        },
      },
      {
        when: flag('st_d1_boss_dead'),
        text: {
          en: 'Rótvættr is dead. Lay a hand on the runestone behind its lair.',
          sv: 'Rótvættr är död. Lägg handen på runstenen bakom dess lya.',
        },
      },
      {
        when: flag('st_stone1_lit'),
        text: {
          en: 'The first runestone burns again. Two remain dark.',
          sv: 'Den första runstenen brinner igen. Två är fortfarande mörka.',
        },
      },
    ],
  },
  q_uppvik: {
    id: 'q_uppvik',
    name: { en: 'The road north', sv: 'Vägen norrut' },
    stages: [
      {
        when: flag('st_stone1_lit'),
        text: {
          en: 'A fallen pine blocks the road north. Önundr the woodcutter might clear it.',
          sv: 'En fallen tall spärrar vägen norrut. Önundr vedhuggaren kan kanske röja den.',
        },
      },
      {
        when: flag('st_road_open'),
        text: {
          en: 'The road north is open. Follow it past the deep pines to Uppvík, the trading town.',
          sv: 'Vägen norrut är öppen. Följ den förbi de djupa tallarna till Uppvík, handelsstaden.',
        },
      },
      {
        when: flag('st_uppvik_reached'),
        text: {
          en: 'Uppvík at last. Find the mead hall and its keeper.',
          sv: 'Äntligen Uppvík. Leta upp mjödhallen och den som håller den.',
        },
      },
      {
        when: flag('w_horn_thordis'),
        text: {
          en: 'Þórdís gave you a mead horn. The traders and craftsmen keep shop by day.',
          sv: 'Þórdís gav dig ett mjödhorn. Handlarna och hantverkarna håller öppet om dagen.',
        },
      },
    ],
  },
  q_volva: {
    id: 'q_volva',
    name: { en: 'The völva’s brew', sv: 'Völvans brygd' },
    stages: [
      {
        when: flag('q_volva_asked'),
        text: {
          en: 'Heiðr the völva wants three clumps of fen-moss. It grows in the fen in autumn.',
          sv: 'Völvan Heiðr vill ha tre tuvor kärrmossa. Den växer i kärret om hösten.',
        },
      },
      {
        when: flag('q_volva_done'),
        text: {
          en: 'Heiðr brews blue mead now: it heals and fills the seiðr bar.',
          sv: 'Heiðr brygger blått mjöd nu: det läker och fyller på seiðr.',
        },
      },
    ],
  },
  q_huldra: {
    id: 'q_huldra',
    name: { en: 'The huldra’s bargain', sv: 'Huldrans handel' },
    stages: [
      {
        when: flag('n_huldra_met'),
        text: {
          en: 'A woman in the birch glade offers a winter cloak for a promise, only at night.',
          sv: 'En kvinna i björkgläntan erbjuder en vinterkappa mot ett löfte, bara om natten.',
        },
      },
      {
        when: flag('q_huldra_refused'),
        text: {
          en: 'You turned the huldra down. She will ask again another night.',
          sv: 'Du sa nej till huldran. Hon frågar igen en annan natt.',
        },
      },
      {
        when: flag('q_huldra_promise'),
        text: {
          en: 'The huldra’s cloak keeps the snow off. One day she will come to collect your promise.',
          sv: 'Huldrans kappa håller snön borta. En dag kommer hon för att kräva ditt löfte.',
        },
      },
    ],
  },
  q_runestone_2: {
    id: 'q_runestone_2',
    name: { en: 'The second runestone', sv: 'Den andra runstenen' },
    stages: [
      {
        when: flag('st_stone1_lit'),
        text: {
          en: 'The second stone sleeps where water turns stone. Önundr’s brook runs south past a weir to Mýrland, where a mill drowned.',
          sv: 'Den andra stenen sover där vatten vänder sten. Önundrs bäck rinner söderut förbi en damm till Mýrland, där en kvarn drunknade.',
        },
      },
      {
        when: flag('st_myrland_reached'),
        text: {
          en: 'Find the drowned mill in Mýrland, and whoever knew it.',
          sv: 'Hitta den drunknade kvarnen i Mýrland, och någon som kände till den.',
        },
      },
      {
        when: flag('q_rs2_mill'),
        text: {
          en: 'The stone lies in the cellar of Sökkva Kvern, the drowned mill. The plank walk on the millpond leads to its door.',
          sv: 'Stenen ligger i källaren under Sökkva Kvern, den drunknade kvarnen. Plankgången på kvarndammen leder till dess dörr.',
        },
      },
      {
        when: flag('st_d2_entered'),
        text: {
          en: 'Turn the mill’s wheels to raise and lower the water, and find the way down to the stone.',
          sv: 'Vrid kvarnens hjul för att höja och sänka vattnet, och hitta vägen ner till stenen.',
        },
      },
      {
        when: flag('st_d2_boss_dead'),
        text: {
          en: 'Lindormr is dead. Lay a hand on the runestone beyond its pond.',
          sv: 'Lindormr är död. Lägg handen på runstenen bortom dess damm.',
        },
      },
      {
        when: flag('st_stone2_lit'),
        text: {
          en: 'The second runestone burns again. One remains dark.',
          sv: 'Den andra runstenen brinner igen. En är fortfarande mörk.',
        },
      },
    ],
  },
  q_runestone_3: {
    id: 'q_runestone_3',
    name: { en: 'The third runestone', sv: 'Den tredje runstenen' },
    stages: [
      {
        when: flag('st_stone2_lit'),
        text: {
          en: 'The last stone lies east, in Haugar, the barrow hills. A rockfall blocks the path out of the birch glade; a bomb would clear it.',
          sv: 'Den sista stenen ligger österut, i Haugar, gravkullarna. Ett stenras spärrar stigen ut ur björkgläntan; en bomb skulle rensa den.',
        },
      },
      {
        when: flag('st_haugar_reached'),
        text: {
          en: 'Haugar: heather and grave-hills. Somebody here must know where the third stone lies.',
          sv: 'Haugar: ljung och gravkullar. Någon här måste veta var den tredje stenen ligger.',
        },
      },
      {
        when: flag('q_rs3_watch'),
        text: {
          en: 'The stone lies in Konungshaugr, the King’s Barrow. Keep the barrow-watch: stand by its door at night and put the three risen dead back in the ground.',
          sv: 'Stenen ligger i Konungshaugr, Kungens hög. Håll gravvakt: stå vid dess dörr om natten och lägg de tre uppståndna döda tillbaka i jorden.',
        },
      },
      {
        when: flag('st_barrow_open'),
        text: {
          en: 'The watch is kept, and the King’s Barrow stands open.',
          sv: 'Vakten är hållen, och Kungens hög står öppen.',
        },
      },
      {
        when: flag('st_d3_entered'),
        text: {
          en: 'Konungshaugr: find the way down to the King under the hill. Take nothing that wakes the dead, unless you mean to.',
          sv: 'Konungshaugr: hitta vägen ner till kungen under kullen. Ta inget som väcker de döda, om du inte menar det.',
        },
      },
      {
        when: flag('st_d3_boss_dead'),
        text: {
          en: 'The Haugbúi King is dust. Lay a hand on the runestone beyond his hall.',
          sv: 'Högbokungen är stoft. Lägg handen på runstenen bortom hans sal.',
        },
      },
      {
        when: flag('st_stone3_lit'),
        text: {
          en: 'The third runestone burns again. The pass knows it.',
          sv: 'Den tredje runstenen brinner igen. Passet vet om det.',
        },
      },
    ],
  },
  q_huscarl: {
    id: 'q_huscarl',
    name: { en: 'The old huscarl', sv: 'Den gamle huskarlen' },
    stages: [
      {
        when: flag('n_styrr_met'),
        text: {
          en: 'Styrr, who carried a shield for the old jarl, teaches sword-craft for silver: first the dash thrust, then the parry.',
          sv: 'Styrr, som bar sköld åt den gamle jarlen, lär ut svärdskonst mot silver: först utfallsstöten, sedan pareringen.',
        },
      },
      {
        when: flag('t_dash'),
        text: {
          en: 'You know the dash thrust: strike in the middle of a roll, and it pierces a shield. Styrr will teach the parry next.',
          sv: 'Du kan utfallsstöten: hugg mitt i en rullning, så går den genom en sköld. Styrr lär ut pareringen härnäst.',
        },
      },
      {
        when: flag('t_parry'),
        text: {
          en: 'You know the parry: raise the shield just as a blow lands, and its dealer stands open. Styrr has more to teach, one day.',
          sv: 'Du kan pareringen: lyft skölden precis när ett hugg träffar, så står den som högg öppen. Styrr har mer att lära ut, en dag.',
        },
      },
      {
        when: flag('q_duel_asked'),
        text: {
          en: 'Styrr has one lesson left, and he does not sell it: beat him in a duel in his yard. Pierce his shield with the thrust, and parry his heavy blow.',
          sv: 'Styrr har en lektion kvar, och den säljer han inte: besegra honom i en tvekamp på hans gård. Genomborra hans sköld med stöten, och parera hans tunga hugg.',
        },
      },
      {
        when: flag('st_bragd_learned'),
        text: {
          en: 'You beat Styrr in his yard and learned Bragð: sung, the blade sends a beam that pierces a shield.',
          sv: 'Du besegrade Styrr på hans gård och lärde dig Bragð: sjungen sänder klingan en stråle som genomborrar en sköld.',
        },
      },
    ],
  },
  q_fimbulvetr: {
    id: 'q_fimbulvetr',
    name: { en: 'The Fimbulvetr', sv: 'Fimbulvintern' },
    stages: [
      {
        when: flag('st_stone3_lit'),
        text: {
          en: 'Three stones burn. Go to the runestone pass, north of the barrows.',
          sv: 'Tre stenar brinner. Gå till runstenspasset, norr om högarna.',
        },
      },
      {
        when: flag('st_pass_open'),
        text: {
          en: 'The pass is open, and the mountain breathed winter over the land. Go home to Askdalr.',
          sv: 'Passet är öppet, och berget andades vinter över landet. Gå hem till Askdalr.',
        },
      },
      {
        when: flag('st_home_winter'),
        text: {
          en: 'Askdalr lies in rime. Halvar knows this cold, and Gyða may know why it came.',
          sv: 'Askdalr ligger i rimfrost. Halvar känner igen den här kölden, och Gyða vet kanske varför den kom.',
        },
      },
      {
        when: flag('st_blood_told'),
        text: {
          en: 'The pass is open, but the road north is buried in rime.',
          sv: 'Passet är öppet, men vägen norrut ligger begravd i rimfrost.',
        },
      },
    ],
  },
  q_fisher: {
    id: 'q_fisher',
    name: { en: 'Gamli', sv: 'Gamle' },
    stages: [
      {
        when: flag('n_kari_met'),
        text: {
          en: 'Kári lent you his rod. Fish from his jetty; he buys every catch. Gamli, the old pike, bites in autumn at dawn and dusk.',
          sv: 'Kári lånade ut sitt spö. Fiska från hans brygga; han köper allt du fångar. Gamle, den gamla gäddan, nappar om hösten i gryning och skymning.',
        },
      },
      {
        when: flag('q_fish_gamli'),
        text: { en: 'You landed Gamli! Tell Kári.', sv: 'Du har landat Gamle! Berätta för Kári.' },
      },
      {
        when: flag('q_fisher_done'),
        text: {
          en: 'Kári gave you a piece of heart for Gamli, and let the old pike go.',
          sv: 'Kári gav dig en hjärtbit för Gamle, och släppte den gamla gäddan fri.',
        },
      },
    ],
  },
  q_vargar: {
    id: 'q_vargar',
    name: { en: 'The vargar hunt', sv: 'Vargjakten' },
    stages: [
      {
        when: flag('q_vargar_taken'),
        text: {
          en: 'Kill the vargr pack leader on the north road. Dagný the huntress knows the vargar.',
          sv: 'Fäll vargflockens ledare vid norra vägen. Jägarinnan Dagný känner vargarna.',
        },
      },
      {
        when: flag('q_vargar_tracked'),
        text: {
          en: 'The pack leader howls its pack in: strike it mid-howl. Roll from its lunge.',
          sv: 'Flockens ledare ylar in flocken: hugg den mitt i ylet. Rulla undan språnget.',
        },
      },
      {
        when: flag('q_vargar_alpha'),
        text: {
          en: 'The pack leader is dead. Bersi pays the bounty at Uppvík’s gate.',
          sv: 'Flockens ledare är död. Bersi betalar belöningen vid Uppvíks port.',
        },
      },
      {
        when: flag('q_vargar_done'),
        text: {
          en: 'Bersi paid the bounty, and a purse that holds 300 silver.',
          sv: 'Bersi betalade belöningen, och en pung som rymmer 300 silver.',
        },
      },
    ],
  },
  q_eldr: {
    id: 'q_eldr',
    name: { en: 'Sölvi’s lesson', sv: 'Sölvis lektion' },
    stages: [
      {
        when: flag('q_eldr_asked'),
        text: {
          en: 'Sölvi the rune-carver needs a stave charred in Skeggi’s kiln, in Myrkviðr.',
          sv: 'Runristaren Sölvi behöver en stav som förkolnat i Skeggis mila i Myrkviðr.',
        },
      },
      {
        when: { k: 'item', id: 'charred_stave' },
        text: {
          en: 'Bring the charred stave back to Sölvi in Uppvík.',
          sv: 'Ta med den förkolnade staven tillbaka till Sölvi i Uppvík.',
        },
      },
      {
        when: flag('st_eldr_learned'),
        text: {
          en: 'You know Eldr, the fire-song. Seiðr feeds it; green mead and a hof’s stone fill it again.',
          sv: 'Du kan Eldr, eldsången. Seiðr när den; grönt mjöd och ett hovs sten fyller på igen.',
        },
      },
    ],
  },
  q_farm: {
    id: 'q_farm',
    name: { en: 'The farm', sv: 'Gården' },
    stages: [
      {
        when: flag('st_farm_asked'),
        text: {
          en: 'Halvar wants the farm rebuilt, the longhouse roof first: turf and timber for 150 silver.',
          sv: 'Halvar vill bygga upp gården igen, först långhusets tak: torv och timmer för 150 silver.',
        },
      },
      {
        when: atLeast('q_farm', 1),
        text: {
          en: 'The longhouse has its roof again. The fold and byre next, for 250 silver: a bigger purse will be needed.',
          sv: 'Långhuset har tak igen. Fållan och fähuset härnäst, för 250 silver: det behövs en större pung.',
        },
      },
      {
        when: atLeast('q_farm', 2),
        text: {
          en: 'The longhouse and the fold stand again, and Hildr winters her flock in the pasture. The rest must wait for ore.',
          sv: 'Långhuset och fållan står igen, och Hildr har sin hjord i hagen över vintern. Resten får vänta på malm.',
        },
      },
    ],
  },
  q_trade: {
    id: 'q_trade',
    name: { en: 'Trades', sv: 'Byteshandel' },
    stages: [
      {
        when: { k: 'item', id: 'trade_bell' },
        text: {
          en: 'Ulf’s sheep’s bell, from the ashes of the fold. Someone who still has sheep could use it.',
          sv: 'Ulfs fårskälla, ur fållans aska. Någon som fortfarande har får kunde ha nytta av den.',
        },
      },
      {
        when: atLeast('q_trade', 1),
        text: {
          en: 'Hildr gave a raw fleece for the bell. Someone in Uppvík spins.',
          sv: 'Hildr gav en fäll råull för skällan. Någon i Uppvík spinner.',
        },
      },
      {
        when: atLeast('q_trade', 2),
        text: {
          en: 'Jórunn spun the fleece into yarn, too coarse for a cloak but good for nets. Kári in Mýrland mends his.',
          sv: 'Jórunn spann ullen till garn, för grovt till en mantel men bra till nät. Kári i Mýrland lagar sina.',
        },
      },
      {
        when: atLeast('q_trade', 3),
        text: {
          en: 'Kári gave Gamli’s bone hook for the yarn. A seal-hunter past the pass would kill for it.',
          sv: 'Kári gav Gamles benkrok för garnet. En sälfångare bortom passet skulle döda för den.',
        },
      },
      {
        when: atLeast('q_trade', 7),
        text: { en: 'Every trade is made.', sv: 'Alla byten är gjorda.' },
      },
    ],
  },
};

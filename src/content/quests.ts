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
        when: atLeast('q_trade', 4),
        text: {
          en: 'Hrafn the seal-hunter gave a walrus-ivory comb for the hook, for someone who still combs her hair for a reason.',
          sv: 'Sälfångaren Hrafn gav en kam av valrossben för kroken, åt någon som fortfarande kammar sitt hår av en anledning.',
        },
      },
      {
        when: atLeast('q_trade', 5),
        text: {
          en: 'Embla gave her sail-needle for the comb: for a dwarf who mends bellows and swears at them.',
          sv: 'Embla gav sin segelnål för kammen: till en dvärg som lagar blåsbälgar och svär åt dem.',
        },
      },
      {
        when: atLeast('q_trade', 6),
        text: {
          en: 'Sindri mended his bellows with the needle and gave a lens of dwarf-glass: for whoever watches the frost on the high road.',
          sv: 'Sindri lagade sin blåsbälg med nålen och gav en lins av dvärgglas: åt den som vaktar frosten på höga vägen.',
        },
      },
      {
        when: atLeast('q_trade', 7),
        text: { en: 'Every trade is made.', sv: 'Alla byten är gjorda.' },
      },
    ],
  },
  q_herd: {
    id: 'q_herd',
    name: { en: 'The scattered flock', sv: 'Den skingrade hjorden' },
    stages: [
      {
        when: flag('q_herd_asked'),
        text: {
          en: 'The cold scattered Hildr’s flock across the heath. Pen six in her hurdles before the sand runs out.',
          sv: 'Kölden skingrade Hildrs hjord över heden. Driv in sex innanför hennes gärdsgård innan sanden runnit ut.',
        },
      },
      {
        when: flag('q_herd_done'),
        text: {
          en: 'Hildr’s flock is gathered in the hurdles. She gave Ask her mother’s keepsake.',
          sv: 'Hildrs hjord är samlad innanför gärdsgården. Hon gav Ask sin mors minnessak.',
        },
      },
    ],
  },
  q_pages: {
    id: 'q_pages',
    name: { en: 'The lost leaves', sv: 'De förlorade bladen' },
    stages: [
      {
        when: flag('st_blood_told'),
        text: {
          en: 'Four leaves of Gyða’s rune-record are lost in the lowlands: on Askdalr’s ridge, in Myrkviðr’s drifts, in Mýrland behind stone, in a Haugar cairn.',
          sv: 'Fyra blad ur Gyðas runkrönika är borta i låglandet: på Askdalrs ås, i Myrkviðrs drivor, i Mýrland bakom sten, i ett röse i Haugar.',
        },
      },
      {
        when: { k: 'item', id: 'rune_leaf', gte: 4 },
        text: {
          en: 'All four leaves found. Bring them to Gyða.',
          sv: 'Alla fyra bladen hittade. Ge dem till Gyða.',
        },
      },
      {
        when: flag('q_pages_done'),
        text: {
          en: 'The jarl’s men swore the binding on their blood, “for us, and for all who come after us”. Gyða gave Ask a seiðr vessel.',
          sv: 'Jarlens män svor bindningen på sitt blod, ”för oss, och för alla som kommer efter oss”. Gyða gav Ask ett seiðrkärl.',
        },
      },
    ],
  },
  q_trolls: {
    id: 'q_trolls',
    name: { en: 'Troll stones', sv: 'Trollstenar' },
    stages: [
      {
        when: flag('q_trolls_asked'),
        text: {
          en: 'Önundr wants five trolls caught by the sunrise in the troll wood, over as many nights as it takes.',
          sv: 'Önundr vill att fem troll fångas av soluppgången i trollskogen, under så många nätter det behövs.',
        },
      },
      {
        when: atLeast('q_trolls_stoned', 5),
        text: { en: 'Five troll stones. Tell Önundr.', sv: 'Fem trollstenar. Berätta för Önundr.' },
      },
      {
        when: flag('q_trolls_done'),
        text: {
          en: 'Önundr gave Ask an arm-ring of stamina for the five troll stones.',
          sv: 'Önundr gav Ask en armring av uthållighet för de fem trollstenarna.',
        },
      },
    ],
  },
  q_steinn: {
    id: 'q_steinn',
    name: { en: 'An old clasp', sv: 'Ett gammalt spänne' },
    stages: [
      {
        when: flag('q_steinn_asked'),
        text: {
          en: 'Steinn gave Ask a clasp from his old ring-mail, for Halvar. He wants to know if Halvar remembers what they swore.',
          sv: 'Steinn gav Ask ett spänne från sin gamla brynja, till Halvar. Han vill veta om Halvar minns vad de svor.',
        },
      },
      {
        when: flag('q_steinn_answer'),
        text: {
          en: 'Halvar’s answer: “Every word, and I wish I did not.” Bring it to Steinn in Uppvík’s mead hall.',
          sv: 'Halvars svar: ”Varje ord, och jag önskar att jag inte gjorde det.” Ta det till Steinn i Uppvíks mjödhall.',
        },
      },
      {
        when: flag('q_steinn_done'),
        text: {
          en: 'Steinn heard Halvar’s answer and paid Ask 150 silver. What they swore stays between them and the mountain.',
          sv: 'Steinn hörde Halvars svar och betalade Ask 150 silver. Det de svor stannar mellan dem och berget.',
        },
      },
    ],
  },
  q_barrow_ring: {
    id: 'q_barrow_ring',
    name: { en: 'The grave-ring', sv: 'Gravringen' },
    stages: [
      {
        when: flag('q_ring_given'),
        text: {
          en: 'Geirmundr stole a ring from the north-west mound in the barrow field. Lay it back on the mound at night.',
          sv: 'Geirmundr stal en ring från högen i nordväst på gravfältet. Lägg tillbaka den på högen om natten.',
        },
      },
      {
        when: flag('q_ring_laid'),
        text: {
          en: 'The ring is back on its mound, and its wights rose. Tell Geirmundr.',
          sv: 'Ringen ligger på sin hög igen, och dess vättar steg upp. Berätta för Geirmundr.',
        },
      },
      {
        when: flag('q_barrow_ring_done'),
        text: {
          en: 'Geirmundr sleeps again, and gave Ask a quiver for more arrows.',
          sv: 'Geirmundr sover igen, och gav Ask ett koger för fler pilar.',
        },
      },
    ],
  },
  q_crates: {
    id: 'q_crates',
    name: { en: 'Sigrún’s crates', sv: 'Sigrúns lårar' },
    stages: [
      {
        when: flag('q_crates_asked'),
        text: {
          en: 'The storm scattered three of Sigrún’s crates: in the farmyard, by the hof, by the brook. Carry them to her door.',
          sv: 'Stormen skingrade tre av Sigrúns lårar: på gårdsplanen, vid hovet, vid bäcken. Bär dem till hennes dörr.',
        },
      },
      {
        when: atLeast('q_crates_home', 3),
        text: {
          en: 'All three crates are home. Tell Sigrún.',
          sv: 'Alla tre lårarna är hemma. Säg till Sigrún.',
        },
      },
      {
        when: flag('q_crates_done'),
        text: {
          en: 'Sigrún has her crates back, and sells Embla’s cheese again. She gave Ask a piece of heart.',
          sv: 'Sigrún har fått tillbaka sina lårar och säljer Emblas ost igen. Hon gav Ask en bit hjärta.',
        },
      },
    ],
  },
  q_honey: {
    id: 'q_honey',
    name: { en: 'Wild honey', sv: 'Vildhonung' },
    stages: [
      {
        when: flag('q_honey_asked'),
        text: {
          en: 'Þórdís wants the comb of the wild hive in the Myrkviðr pines, east of the forest road. Summer or autumn only; smoke the bees with the lantern.',
          sv: 'Þórdís vill ha vaxkakan från den vilda kupan bland tallarna i Myrkviðr, öster om skogsvägen. Bara sommar eller höst; rök bina med lyktan.',
        },
      },
      {
        when: { k: 'item', id: 'honey' },
        text: {
          en: 'A slab of wild honeycomb. Bring it to Þórdís in Uppvík’s mead hall.',
          sv: 'En kaka vild honung. Ta den till Þórdís i Uppvíks mjödhall.',
        },
      },
      {
        when: flag('q_honey_done'),
        text: {
          en: 'Þórdís brews honey-mead, and gave Ask a mead horn.',
          sv: 'Þórdís brygger honungsmjöd, och gav Ask ett mjödhorn.',
        },
      },
    ],
  },
  q_amber: {
    id: 'q_amber',
    name: { en: 'Amber for the south', sv: 'Bärnsten till södern' },
    stages: [
      {
        when: flag('q_amber_asked'),
        text: {
          en: 'Ragna wants three lumps of Mýrland amber for her ship’s hold: in Auðr’s cut reeds, under Ljótr’s peat, and in the mud by the warm springs (spring only).',
          sv: 'Ragna vill ha tre klumpar bärnsten från Mýrland till skeppets lastrum: i Auðrs skurna vass, under Ljótrs torv och i leran vid de varma källorna (bara på våren).',
        },
      },
      {
        when: { k: 'item', id: 'amber', gte: 3 },
        text: {
          en: 'Three lumps of amber. Bring them to Ragna by Uppvík’s shore.',
          sv: 'Tre klumpar bärnsten. Ta dem till Ragna vid Uppvíks strand.',
        },
      },
      {
        when: flag('q_amber_done'),
        text: {
          en: 'Ragna has her amber, and gave Ask the arm-ring of thrift.',
          sv: 'Ragna har fått sin bärnsten, och gav Ask armringen av sparsamhet.',
        },
      },
    ],
  },
  q_burbot: {
    id: 'q_burbot',
    name: { en: 'A fish under the ice', sv: 'En fisk under isen' },
    stages: [
      {
        when: flag('q_burbot_asked'),
        text: {
          en: 'Eyvindr wants a burbot from the hole in the ice off Uppvík’s jetty. Winter only, after dark.',
          sv: 'Eyvindr vill ha en lake ur vaken i isen vid Uppvíks brygga. Bara på vintern, efter mörkrets inbrott.',
        },
      },
      {
        when: flag('q_burbot_caught'),
        text: {
          en: 'A burbot landed through the ice. Tell Eyvindr on the jetty.',
          sv: 'En lake uppdragen genom isen. Berätta för Eyvindr på bryggan.',
        },
      },
      {
        when: flag('q_burbot_done'),
        text: {
          en: 'Eyvindr’s bay still lives. He gave Ask a piece of heart.',
          sv: 'Eyvindrs vik lever ännu. Han gav Ask en bit hjärta.',
        },
      },
    ],
  },
  q_ljos: {
    id: 'q_ljos',
    name: { en: 'Lights in the marsh', sv: 'Ljus i kärret' },
    stages: [
      {
        when: flag('q_ljos_asked'),
        text: {
          en: 'Heiðr wants three wisp embers from Niflmýrr, the dead who could not cross. They drift over the marsh only at night; lift one to jar it.',
          sv: 'Heiðr vill ha tre irrbloss-glöder från Niflmýrr, de döda som inte kunde ta sig över. De svävar över kärret bara om natten; lyft en för att fånga den i krukan.',
        },
      },
      {
        when: { k: 'item', id: 'wisp_ember', gte: 3 },
        text: {
          en: 'Three wisp embers burn in the jar. Bring them to Heiðr in Myrkviðr.',
          sv: 'Tre irrbloss-glöder brinner i krukan. Ta dem till Heiðr i Myrkviðr.',
        },
      },
      {
        when: flag('q_ljos_done'),
        text: {
          en: 'Heiðr sang the embers into Ljós, the light-song: it burns off fog and shows what hides.',
          sv: 'Heiðr sjöng glöderna till Ljós, ljussången: den bränner bort dimma och visar det som gömmer sig.',
        },
      },
    ],
  },
  q_sealskin: {
    id: 'q_sealskin',
    name: { en: 'The seal-skin', sv: 'Sälskinnet' },
    stages: [
      {
        when: flag('q_sealskin_asked'),
        text: {
          en: 'A marbendill climbs Niflmýrr’s strand every night and tears Hrafn’s nets. Drive it off three nights, after dark.',
          sv: 'En marbendill klättrar upp på Niflmýrrs strand varje natt och river Hrafns nät. Driv bort den tre nätter, efter mörkrets inbrott.',
        },
      },
      {
        when: atLeast('q_seal_nights', 3),
        text: {
          en: 'Three nights, and the nets still whole. Go and tell Hrafn in his hut.',
          sv: 'Tre nätter, och näten är fortfarande hela. Gå och berätta det för Hrafn i hans hydda.',
        },
      },
      {
        when: flag('q_sealskin_done'),
        text: {
          en: 'Hrafn gave Ask his late wife’s seal-skin. In it the lake carries Ask, and a roll dives under.',
          sv: 'Hrafn gav Ask sin döda hustrus sälskinn. I det bär sjön Ask, och en rullning dyker under.',
        },
      },
    ],
  },
  q_letters: {
    id: 'q_letters',
    name: { en: 'Embla’s letters', sv: 'Emblas brev' },
    stages: [
      {
        when: atLeast('q_letters', 1),
        text: {
          en: 'Embla’s first letter: she left something in the split pine west of the birch ring in Myrkviðr’s glade.',
          sv: 'Emblas första brev: hon lämnade något i den kluvna tallen väster om björkringen i Myrkviðrs glänta.',
        },
      },
      {
        when: flag('st_letter1_found'),
        text: {
          en: 'In the split pine lay a carved box with a seiðr vessel. Embla will write again.',
          sv: 'I den kluvna tallen låg en snidad ask med ett seiðkärl. Embla kommer att skriva igen.',
        },
      },
      {
        when: atLeast('q_letters', 2),
        text: {
          en: 'Embla’s second letter: under the top stone of the cairn by Haugar’s tarn, where we hid from Halvar.',
          sv: 'Emblas andra brev: under översta stenen på röset vid Haugars tjärn, där vi gömde oss för Halvar.',
        },
      },
      {
        when: flag('st_letter2_found'),
        text: {
          en: 'Under the cairn’s top stone lay a piece of a heart, wrapped in birch bark.',
          sv: 'Under rösets översta sten låg en bit av ett hjärta, insvept i näver.',
        },
      },
    ],
  },
  q_loom: {
    id: 'q_loom',
    name: { en: "The Norns' loom", sv: 'Nornornas vävstol' },
    stages: [
      {
        when: flag('q_loom_asked'),
        text: {
          en: 'Under the well in the north water three women sit at a loom. Urðr wants three threads: one in Myrkviðr behind a web, one on the bottom of Mýrland’s ferry channel, one in the barrows that only shows at night to one who knows Ljós.',
          sv: 'Under brunnen i det norra vattnet sitter tre kvinnor vid en vävstol. Urðr vill ha tre trådar: en i Myrkviðr bakom en väv, en på botten av färjeleden i Mýrland, en bland gravhögarna som bara syns om natten för den som kan Ljós.',
        },
      },
      {
        when: { k: 'item', id: 'norn_thread', gte: 3 },
        text: {
          en: 'Ask carries all three threads. Bring them to Urðr at her loom.',
          sv: 'Ask bär alla tre trådarna. Ta dem till Urðr vid hennes vävstol.',
        },
      },
      {
        when: flag('st_loom_woven'),
        text: {
          en: 'The Norns wove the threads into a seiðr vessel. At any hof, after a prayer, Ask may now ask the year to turn to another season.',
          sv: 'Nornorna vävde trådarna till ett seiðkärl. Vid vilket hov som helst kan Ask nu, efter en bön, be året vända sig till en annan årstid.',
        },
      },
    ],
  },
  q_foreman: {
    id: 'q_foreman',
    name: { en: 'The foreman’s crew', sv: 'Förmannens lag' },
    stages: [
      {
        when: atLeast('q_foreman', 1),
        text: {
          en: 'Dvalinn’s crew is trapped behind a cave-in at Dvergagröf’s mine mouth. Something that breaks rock would clear it.',
          sv: 'Dvalinns lag sitter fast bakom ett ras vid Dvergagröfs gruvmynning. Något som spränger sten skulle rensa det.',
        },
      },
      {
        when: atLeast('q_foreman', 2),
        text: {
          en: 'The cave-in is cleared. Dvalinn should hear the way into the old workings is open.',
          sv: 'Raset är bortsprängt. Dvalinn borde få höra att vägen in i de gamla gångarna är öppen.',
        },
      },
      {
        when: atLeast('q_foreman', 3),
        text: {
          en: 'Hekla waits at the mine mouth. Take her through the old workings to the lamp-room, and keep the foes off her.',
          sv: 'Hekla väntar vid gruvmynningen. Led henne genom de gamla gångarna till lampsalen, och håll fienderna borta från henne.',
        },
      },
      {
        when: atLeast('q_foreman', 4),
        text: {
          en: 'The crew is out of the lamp-room. Dvalinn is waiting at the camp.',
          sv: 'Laget är ute ur lampsalen. Dvalinn väntar i lägret.',
        },
      },
      {
        when: atLeast('q_foreman', 5),
        text: {
          en: 'Dvalinn opened the cart road from the mine mouth to Uppvík’s smiths.',
          sv: 'Dvalinn öppnade kärrvägen från gruvmynningen till smederna i Uppvík.',
        },
      },
    ],
  },
  q_forge: {
    id: 'q_forge',
    name: { en: 'The forge under the mountain', sv: 'Smedjan under berget' },
    stages: [
      {
        when: flag('st_dvg_reached'),
        text: {
          en: 'Over the chasm east of Haugar’s tarn lies Dvergagröf, and deep in the mountain something beats iron.',
          sv: 'Över klyftan öster om Haugars tjärn ligger Dvergagröf, och djupt inne i berget slår något på järn.',
        },
      },
      {
        when: atLeast('q_foreman', 1),
        text: {
          en: 'Dvalinn the foreman says Ívaldi’s forge has eaten all the dwarves’ powder. Its great door is east of the mine mouth.',
          sv: 'Förmannen Dvalinn säger att Ívaldis smedja har ätit upp allt dvärgarnas krut. Dess stora port ligger öster om gruvmynningen.',
        },
      },
    ],
  },
  q_holmr: {
    id: 'q_holmr',
    name: { en: 'The island', sv: 'Ön' },
    stages: [
      {
        when: flag('q_sealskin_done'),
        text: {
          en: 'The seal-skin is Ask’s. Somebody keeps a fire on Holmr, past the warm water in the middle of Sævatn.',
          sv: 'Sälskinnet är Asks. Någon håller en eld brinnande på Holmr, bortom det varma vattnet mitt i Sævatn.',
        },
      },
      {
        when: flag('st_embla_found'),
        text: {
          en: 'Embla is alive, at the Refuge on Holmr. She says the thane under the lake keeps the drowned hof whose spire stands in the drowned village.',
          sv: 'Embla lever, på Tillflykten på Holmr. Hon säger att hövdingen under sjön håller det drunknade hovet vars spira står i den drunknade byn.',
        },
      },
      {
        when: flag('st_d5_entered'),
        text: {
          en: 'Ask has dived into Sökkva Hof, the drowned hof.',
          sv: 'Ask har dykt ner i Sökkva Hov, det drunknade hovet.',
        },
      },
      {
        when: { k: 'galdr', id: 'vindr' },
        text: {
          en: 'Ask has learned Vindr in the drowned hof. Its thane, Nykr, waits deeper down.',
          sv: 'Ask har lärt sig Vindr i det drunknade hovet. Dess hövding, Nykr, väntar längre ner.',
        },
      },
      {
        when: flag('st_thane_nykr'),
        text: {
          en: 'Nykr is dead. Two thanes down. Embla says the third keeps a forge under the mountain.',
          sv: 'Nykr är död. Två hövdingar fällda. Embla säger att den tredje håller en smedja under berget.',
        },
      },
    ],
  },
  q_axes: {
    id: 'q_axes',
    name: { en: 'The axe range', sv: 'Yxbanan' },
    stages: [
      {
        when: flag('q_axes_asked'),
        text: {
          en: 'Ketill’s range by Uppvík’s lower houses: hit five straw men with thrown axes in forty-five seconds.',
          sv: 'Ketills bana vid Uppvíks nedre hus: träffa fem halmgubbar med kastade yxor på fyrtiofem sekunder.',
        },
      },
      {
        when: flag('q_axes_done'),
        text: {
          en: 'Five for five at Ketill’s range. He gave Ask a piece of heart.',
          sv: 'Fem av fem på Ketills bana. Han gav Ask en bit hjärta.',
        },
      },
    ],
  },
  q_act2: {
    id: 'q_act2',
    name: { en: 'The road north', sv: 'Vägen norrut' },
    stages: [
      {
        when: flag('st_rime_open'),
        text: {
          en: 'Eldr melted the rime across the gorge. The road goes on north, into the fog.',
          sv: 'Eldr smälte rimfrosten i klyftan. Vägen fortsätter norrut, in i dimman.',
        },
      },
      {
        when: flag('st_niflmyrr_reached'),
        text: {
          en: 'Niflmýrr: a marsh of fog and the restless dead. Somewhere in it are the captives, and Embla.',
          sv: 'Niflmýrr: ett kärr av dimma och rastlösa döda. Någonstans där finns de tillfångatagna, och Embla.',
        },
      },
      {
        when: flag('st_twist_heard'),
        text: {
          en: 'The captives are being bled to unmake the oath that holds the Rime King. Embla got away, west over the lake. Helgrind’s gate stands north of the Gjöll.',
          sv: 'De tillfångatagna tappas på blod för att lösa eden som håller Rimkungen. Embla kom undan, västerut över sjön. Helgrinds port står norr om Gjöll.',
        },
      },
      {
        when: flag('st_d4_entered'),
        text: {
          en: 'Inside Helgrind. Somewhere past the Gjöll’s rapids its thane keeps two of the captives.',
          sv: 'Inne i Helgrind. Någonstans bortom Gjölls forsar håller dess hövding två av de tillfångatagna.',
        },
      },
      {
        when: flag('st_thane_nastrond'),
        text: {
          en: 'One thane down, three to go. Embla is somewhere ahead.',
          sv: 'En hövding fälld, tre kvar. Embla är någonstans längre fram.',
        },
      },
    ],
  },
};

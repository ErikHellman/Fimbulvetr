import type { ScreenDef } from '@core/world/screen';

export const myrBrook: ScreenDef = {
  id: 'myr_brook',
  region: 'myrkvidr',
  purpose:
    'A forest brook with a ford. It tumbles out from under the pines as rapids that never freeze, and falls away south to the weir into Mýrland; a bank path follows it down. A piece of heart lies on an islet in the pool, out of reach until something can fetch it (the boomerang, M1c).',
  things: [
    { k: 'piece', id: 'hp_myr_brook', at: { x: 25, y: 16 } },
    { k: 'enemy', id: 'vargr', at: { x: 10, y: 14 } },
  ],
  map: [
    'PPTTPTTPTTPP...PPPPTTPTPvvvvPTPTPPTPPTTP',
    'PPPPPPPTPPTT...PTTTPPPPTvvvvPTPPTTPTPTPT',
    'TTPTPPPPPTTT...PTPPPPTTTvvvvPPPPPTPPPPPP',
    'PPPTPP..%.PT....T.%.TP..~~~~P.T.P...PPTP',
    'TPPT.%....%.............~~~~........PPPT',
    'PPPT....................~~~~.........PTP',
    'TPP...............%T%...~~~~.........TPT',
    'PPP................%....~~~~.........PPT',
    'TTPT....................~~~~.........PPP',
    'PTP..%T%......%.........oooo............',
    'PPPP..%......TT.........oooo....T.......',
    'TTP...........%.........oooo....T.......',
    'PTPP....................oooo............',
    'PPPPT...............~~~~~~~~~~~~.....TPP',
    'PPT%%..........T....~~~~~~~~~~~~.....PPT',
    'TPP.......T%........~~~~~..~~~~~.....PPP',
    'PPP.................~~~~~..~~~~~.....PTT',
    'PTP%....%.%.T.......~~~~~~~~~~~~.....TPT',
    'TTP.%P..P.T..P....%%~~~~~~~~~~~~.P...PPP',
    'PTPPPTPPTPPPPPPPPPPT~~~~vvvv~~~~PP,,,TPT',
    'PTPPTPPTTPPPPPPTPPPPTPPPvvvvTPPPTP,,,PPP',
    'TTPTTTPTTPPTTTPTPTPTTPTPvvvvPPPPTP,,,PPP',
  ],
};

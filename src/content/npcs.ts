import type { NpcDef } from '@core/actors/npc';
import type { NpcId } from './ids';

/** Who lives where, and when. The first place whose condition holds is where an NPC stands. */
export const NPC_DEFS: Readonly<Partial<Record<NpcId, NpcDef>>> = {};

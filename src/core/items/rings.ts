import type { FlagId } from '@content/flags';
import type { RingId } from '@content/ids';

/** The flag that records an arm-ring as owned (rings worn come only from these). */
export const ringFlag = (id: RingId): FlagId => `w_${id}` as FlagId;

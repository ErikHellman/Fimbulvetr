import { renderScore } from '@art/music/render';
import { MUSIC_SCORES } from '@art/music/scores';
import type { MusicId } from '@content/music';

/** Renders placeholder music off the main thread: a track takes about a second to compose. */

export interface MusicRequest {
  readonly id: MusicId;
  readonly sampleRate: number;
}

interface WorkerScope {
  onmessage: ((e: MessageEvent<MusicRequest>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;
scope.onmessage = (e) => {
  const { id, sampleRate } = e.data;
  const r = renderScore(MUSIC_SCORES[id], sampleRate);
  scope.postMessage({ id, ...r }, [r.left.buffer, r.right.buffer, r.combat.buffer, r.night.buffer]);
};

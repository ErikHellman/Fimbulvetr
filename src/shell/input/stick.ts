import { bit } from '@core/input/actions';
import { deadzone } from './gamepad';

/** A floating thumb stick, in CSS pixels: it starts where the thumb lands. */
export interface Stick {
  readonly ox: number;
  readonly oy: number;
  readonly x: number;
  readonly y: number;
}

/** Of the stick's radius, how far the thumb goes before the hero moves. */
export const STICK_DEADZONE = 0.2;
/** Past this share of the radius a stick direction also presses the d-pad actions, for the menus. */
const DIR_PRESS = 0.5;
/** sin 22.5°: a direction counts while the stick is within 67.5° of it, so diagonals press two. */
const DIR_SLICE = 0.383;

export function startStick(x: number, y: number): Stick {
  return { ox: x, oy: y, x, y };
}

/** The thumb moved. Past the radius the stick's centre is dragged along behind it. */
export function moveStick(s: Stick, x: number, y: number, radius: number): Stick {
  const dx = x - s.ox;
  const dy = y - s.oy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len <= radius) return { ...s, x, y };
  const k = (len - radius) / len;
  return { ox: s.ox + dx * k, oy: s.oy + dy * k, x, y };
}

/** The stick as a pad axis pair in [-1, 1], with a radial dead zone. */
export function stickAxes(s: Stick, radius: number): [number, number] {
  if (radius <= 0) return [0, 0];
  const ax = Math.max(-1, Math.min(1, (s.x - s.ox) / radius));
  const ay = Math.max(-1, Math.min(1, (s.y - s.oy) / radius));
  return deadzone(ax, ay, STICK_DEADZONE);
}

/** The d-pad actions the axes press: eight ways, once the stick is past half way. */
export function stickBits(ax: number, ay: number): number {
  const len = Math.sqrt(ax * ax + ay * ay);
  if (len < DIR_PRESS) return 0;
  const nx = ax / len;
  const ny = ay / len;
  let bits = 0;
  if (ny < -DIR_SLICE) bits |= bit('up');
  if (ny > DIR_SLICE) bits |= bit('down');
  if (nx < -DIR_SLICE) bits |= bit('left');
  if (nx > DIR_SLICE) bits |= bit('right');
  return bits;
}

import { cellAt } from '@core/world/textmap';
import { TILE } from '@core/world/dims';
import type { DevBridge } from './bridge';

export function overlayText(b: DevBridge): string {
  const { sim } = b;
  const h = sim.hero;
  const c = sim.state.clock;
  const s = b.stats.summary();
  const tx = Math.floor(h.pos.x / TILE);
  const ty = Math.floor(h.pos.y / TILE);
  const hh = String(Math.floor(c.minute / 60)).padStart(2, '0');
  const mm = String(c.minute % 60).padStart(2, '0');
  return [
    `screen ${sim.screen.id} (${sim.mode})  tile ${tx},${ty} ${cellAt(sim.screen.terrain, tx, ty) ?? '-'}`,
    `hero ${h.fsm.s}/${h.anim} ${h.facing}  pos ${h.pos.x.toFixed(1)},${h.pos.y.toFixed(1)}  hp ${h.hp}/${h.maxHp}  iframes ${h.iframes}`,
    `day ${c.day} ${hh}:${mm} ${c.season} (${c.policy})  light ${b.lightLevel().toFixed(2)}`,
    `fps ${s.fps.toFixed(0)}  frame p95 ${s.p95.toFixed(1)} ms  sim ${s.simMs.toFixed(2)} ms  entities ${sim.entities.length}`,
  ].join('\n');
}

/** F1 toggles a DOM overlay (DOM so Playwright can read it and it never affects the game's pixels). */
export function createOverlay(current: () => DevBridge | null): void {
  const el = document.createElement('pre');
  el.id = 'dev-overlay';
  el.hidden = true;
  Object.assign(el.style, {
    position: 'fixed',
    left: '4px',
    top: '4px',
    margin: '0',
    padding: '6px 8px',
    font: '11px/1.35 ui-monospace, monospace',
    color: '#f2ead8',
    background: 'rgba(0, 0, 0, 0.65)',
    pointerEvents: 'none',
    zIndex: '20',
  });
  document.body.append(el);
  const render = (): void => {
    const b = current();
    if (el.hidden || b === null) return;
    el.textContent = overlayText(b);
  };
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'F1') return;
    e.preventDefault();
    el.hidden = !el.hidden;
    render();
  });
  window.setInterval(render, 250);
}

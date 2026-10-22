import { TOUCH_CAPS, TOUCH_TEXT } from '@content/i18n/touch';
import { t, type Lang } from '@core/i18n/t';
import type { Action } from '@core/input/actions';
import type { Settings } from '@shell/platform/settings';
import { GAME_H, GAME_W } from '@shell/scale';
import type { TouchSnapshot } from './mapper';
import { TapTargets, tapScript } from './tapTargets';
import {
  MOVABLE,
  layout,
  type Insets,
  type Movable,
  type Offsets,
  type PlayButton,
  type TouchContext,
  type TouchLayout,
} from './touchLayout';
import { TouchTracker } from './touchTracker';

/**
 * The on-screen controls: a DOM layer over the canvas (crisp at any zoom, free to sit in the letterbox
 * bars). Every finger is read from window pointer events and handed to the pure `TouchTracker`; the
 * elements here only draw. A tap that lands on no control goes to the menus' tap targets. Mouse clicks
 * reach the tap targets too, but never show the controls.
 */

export interface TouchDeps {
  readonly settings: Settings;
  /** `?touch=1`: show the controls whatever the setting (for trying them at a desk). */
  readonly force: boolean;
  /** Stores the settings after the layout editor changed them. */
  readonly save: () => void;
}

const EMPTY: TouchLayout = { d: 0, buttons: [], stick: null };

const CSS = `
#touch { position: fixed; inset: 0; pointer-events: none; z-index: 5; user-select: none;
  -webkit-user-select: none; font: 600 14px/1 system-ui, sans-serif; color: #f2ead8; }
#touch[hidden], #touch [hidden] { display: none; }
#touch .tb, #touch .stick, #touch .knob { position: absolute; border-radius: 50%; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; text-align: center; }
#touch .tb { background: rgba(27, 21, 34, 0.45); border: 2px solid rgba(217, 179, 74, 0.7);
  text-shadow: 0 1px 2px #000; }
#touch .tb.down { background: rgba(217, 179, 74, 0.55); color: #1b1522; text-shadow: none; }
#touch .stick { border: 2px solid rgba(217, 179, 74, 0.45); background: rgba(27, 21, 34, 0.25); }
#touch .stick.idle { opacity: 0.45; }
#touch .knob { background: rgba(217, 179, 74, 0.6); border: 2px solid rgba(242, 234, 216, 0.6); }
#touch-rotate { position: fixed; inset: 0; z-index: 9; display: flex; align-items: center;
  justify-content: center; padding: 2rem; background: #0b0a14; color: #f2ead8; text-align: center;
  font: 18px/1.5 system-ui, sans-serif; }
#touch-rotate[hidden] { display: none; }
#touch-edit { position: fixed; inset: 0; z-index: 8; background: rgba(11, 10, 20, 0.6);
  touch-action: none; font: 600 14px/1 system-ui, sans-serif; color: #f2ead8; }
#touch-edit[hidden] { display: none; }
#touch-edit .tb { position: absolute; border-radius: 50%; box-sizing: border-box; display: flex;
  align-items: center; justify-content: center; background: rgba(27, 21, 34, 0.7);
  border: 2px dashed #d9b34a; cursor: grab; }
#touch-edit .bar { position: absolute; left: 50%; top: max(12px, env(safe-area-inset-top));
  transform: translateX(-50%); display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;
  justify-content: center; max-width: 90vw; }
#touch-edit .bar span { font-weight: 400; text-shadow: 0 1px 2px #000; }
#touch-edit button { font: inherit; padding: 0.5rem 1rem; border: 0; border-radius: 4px;
  background: #d9b34a; color: #1b1522; }
#touch-edit button.alt { background: #4a4258; color: #f2ead8; }
#touch-safe { position: fixed; visibility: hidden; pointer-events: none;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
`;

function el(tag: string, cls: string, parent: HTMLElement): HTMLElement {
  const e = document.createElement(tag);
  if (cls !== '') e.className = cls;
  parent.appendChild(e);
  return e;
}

const place = (e: HTMLElement, x: number, y: number, r: number): void => {
  e.style.left = `${String(x - r)}px`;
  e.style.top = `${String(y - r)}px`;
  e.style.width = `${String(2 * r)}px`;
  e.style.height = `${String(2 * r)}px`;
};

export class TouchControls {
  /** What the menus offer to taps this frame; the scenes fill it as they draw. */
  readonly targets = new TapTargets();
  private readonly tracker = new TouchTracker(EMPTY);
  /** Mouse clicks: a tracker with no controls, so every click is a tap. */
  private readonly mouse = new TouchTracker(EMPTY);
  private readonly root: HTMLElement;
  private readonly rotate: HTMLElement;
  private readonly safe: HTMLElement;
  private readonly buttons = new Map<Action, HTMLElement>();
  private readonly stickBase: HTMLElement;
  private readonly knob: HTMLElement;
  private editor: HTMLElement | null = null;
  /** Presses a menu tap queued, one per frame the game reads. */
  private script: number[] = [];
  /** A tap (game pixels) that came while a script still ran: it waits until the menu has caught up. */
  private pendingTap: { readonly x: number; readonly y: number } | null = null;
  /** The last input was a touch (auto mode shows the controls only then). */
  private touched: boolean;
  private context: TouchContext = 'menu';
  private hidden: ReadonlySet<Action> = new Set();
  private extras: readonly PlayButton[] = [];
  private lang: Lang;
  private current: TouchLayout = EMPTY;
  private layoutKey = '';

  constructor(private readonly deps: TouchDeps) {
    this.lang = deps.settings.lang;
    this.touched = matchMedia('(hover: none) and (pointer: coarse)').matches;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.root = el('div', '', document.body);
    this.root.id = 'touch';
    this.root.setAttribute('aria-hidden', 'true');
    this.stickBase = el('div', 'stick idle', this.root);
    this.knob = el('div', 'knob', this.root);
    this.rotate = el('div', '', document.body);
    this.rotate.id = 'touch-rotate';
    this.safe = el('div', '', document.body);
    this.safe.id = 'touch-safe';
    this.attach();
    this.render();
  }

  /** The controls are on screen (prompts then name them). */
  shown(): boolean {
    const mode = this.deps.force ? 'on' : this.deps.settings.touch;
    return mode === 'on' || (mode === 'auto' && this.touched);
  }

  /** A key or pad button was used: in auto mode the controls step aside until the next touch. */
  otherInput(): void {
    if (!this.touched) return;
    this.touched = false;
    this.render();
  }

  /**
   * Called once per frame by the running scene before it samples input: which controls it needs, and
   * which play buttons to leave out. Starts this frame's tap targets afresh.
   */
  frame(
    context: TouchContext,
    hidden: ReadonlySet<Action>,
    lang: Lang,
    extras: readonly PlayButton[] = [],
  ): void {
    this.context = context;
    this.hidden = hidden;
    this.extras = extras;
    this.lang = lang;
    if (this.script.length === 0 && this.pendingTap !== null) {
      this.resolveTap(this.pendingTap.x, this.pendingTap.y);
      this.pendingTap = null;
    }
    this.targets.clear();
    this.render();
  }

  /** This frame's touch input for the mapper, or null when nothing touches. */
  snapshot(): TouchSnapshot | null {
    if (this.editor !== null) return null;
    const scripted = this.script[0] ?? 0;
    const held = this.tracker.take() | scripted;
    const [ax, ay] = this.tracker.axes();
    return held === 0 && ax === 0 && ay === 0 ? null : { held, ax, ay };
  }

  /** The game read a frame: the next scripted press is due. */
  advance(): void {
    this.script.shift();
  }

  /** A short buzz (Android; iOS has no vibration for web pages). */
  vibrate(ms: number): void {
    if (!this.shown() || !this.deps.settings.haptics) return;
    try {
      navigator.vibrate(ms);
    } catch {
      // Not supported, or refused: no matter.
    }
  }

  private attach(): void {
    const handled = (e: PointerEvent): boolean => {
      const target = e.target as Element | null;
      if (target === null || this.editor !== null) return false;
      if (target === document.body || target === document.documentElement) return true;
      return target.closest('#game, #touch') !== null;
    };
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (!handled(e)) return;
        if (e.pointerType === 'mouse') {
          this.mouse.down(e.pointerId, e.clientX, e.clientY);
          return;
        }
        if (!this.touched) {
          this.touched = true;
          this.render();
        }
        this.tracker.down(e.pointerId, e.clientX, e.clientY);
        this.draw();
      },
      { capture: true },
    );
    window.addEventListener(
      'pointermove',
      (e) => {
        const tr = e.pointerType === 'mouse' ? this.mouse : this.tracker;
        tr.move(e.pointerId, e.clientX, e.clientY);
        if (tr === this.tracker) this.draw();
      },
      { capture: true },
    );
    const up = (e: PointerEvent): void => {
      const tr = e.pointerType === 'mouse' ? this.mouse : this.tracker;
      const tap = tr.up(e.pointerId);
      if (tap !== null) this.tap(tap.x, tap.y);
      this.draw();
    };
    window.addEventListener('pointerup', up, { capture: true });
    window.addEventListener(
      'pointercancel',
      (e) => {
        this.tracker.cancel(e.pointerId);
        this.mouse.cancel(e.pointerId);
        this.draw();
      },
      { capture: true },
    );
    // No page scrolling, pinch zoom, magnifier or long-press menu over the game.
    const inGame = (e: Event): boolean => {
      const target = e.target as Element | null;
      return (
        target !== null && (target === document.body || target.closest('#game, #touch, #touch-edit') !== null)
      );
    };
    document.addEventListener(
      'touchmove',
      (e) => {
        if (inGame(e)) e.preventDefault();
      },
      { passive: false },
    );
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });
    window.addEventListener('contextmenu', (e) => {
      if (inGame(e)) e.preventDefault();
    });
    window.addEventListener('resize', () => {
      this.render();
    });
    window.addEventListener('blur', () => {
      this.tracker.clear();
      this.draw();
    });
  }

  /** A tap in CSS pixels: on the canvas, it goes to whatever menu line or box is under it. */
  private tap(x: number, y: number): void {
    const canvas = document.querySelector('#game canvas');
    if (canvas === null) return;
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    const gx = ((x - r.left) * GAME_W) / r.width;
    const gy = ((y - r.top) * GAME_H) / r.height;
    if (this.script.length > 0) this.pendingTap = { x: gx, y: gy };
    else this.resolveTap(gx, gy);
  }

  /** A tap against what the menus drew last: the presses it makes start next frame. */
  private resolveTap(gx: number, gy: number): void {
    const target = this.targets.hit(gx, gy);
    if (target !== null) this.script = tapScript(target, gx);
  }

  private insets(): Insets {
    const cs = getComputedStyle(this.safe);
    const px = (v: string): number => Number.parseFloat(v) || 0;
    return {
      top: px(cs.paddingTop),
      right: px(cs.paddingRight),
      bottom: px(cs.paddingBottom),
      left: px(cs.paddingLeft),
    };
  }

  private layoutFor(
    context: TouchContext,
    hidden: ReadonlySet<Action>,
    offsets: Offsets,
    extras: readonly PlayButton[] = [],
  ): TouchLayout {
    const s = this.deps.settings;
    return layout({
      w: window.innerWidth,
      h: window.innerHeight,
      insets: this.insets(),
      size: s.touchSize,
      leftHanded: s.touchLeft,
      offsets,
      context,
      hidden,
      extras,
    });
  }

  /** Lays the controls out again when anything they depend on changed. */
  private render(): void {
    const s = this.deps.settings;
    const shown = this.shown();
    const portrait = window.innerHeight > window.innerWidth;
    this.rotate.hidden = !(shown && portrait);
    this.rotate.textContent = t(TOUCH_TEXT.rotate, this.lang);
    const key = [
      shown,
      this.context,
      [...this.hidden].sort().join(),
      this.extras.join(),
      window.innerWidth,
      window.innerHeight,
      s.touchSize,
      s.touchLeft,
      JSON.stringify(s.touchLayout),
      this.lang,
      this.insets().bottom,
    ].join('|');
    if (key === this.layoutKey) {
      this.draw();
      return;
    }
    this.layoutKey = key;
    this.root.hidden = !shown;
    this.current = shown ? this.layoutFor(this.context, this.hidden, s.touchLayout, this.extras) : EMPTY;
    this.tracker.setLayout(this.current);
    for (const e of this.buttons.values()) e.remove();
    this.buttons.clear();
    for (const b of this.current.buttons) {
      const e = el('div', 'tb', this.root);
      e.textContent = t(TOUCH_CAPS[b.action], this.lang);
      e.style.fontSize = `${String(Math.max(11, Math.round(b.r * 0.42)))}px`;
      place(e, b.x, b.y, b.r);
      this.buttons.set(b.action, e);
    }
    this.draw();
  }

  /** Pressed buttons light up; the stick follows the thumb or rests faintly in its corner. */
  private draw(): void {
    for (const [action, e] of this.buttons) e.classList.toggle('down', this.tracker.pressing(action));
    const home = this.current.stick;
    const thumb = this.tracker.stick();
    this.stickBase.hidden = home === null;
    this.knob.hidden = home === null;
    if (home === null) return;
    const ox = thumb?.ox ?? home.x;
    const oy = thumb?.oy ?? home.y;
    let kx = thumb?.x ?? ox;
    let ky = thumb?.y ?? oy;
    const dx = kx - ox;
    const dy = ky - oy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > home.r) {
      kx = ox + (dx * home.r) / len;
      ky = oy + (dy * home.r) / len;
    }
    place(this.stickBase, ox, oy, home.r);
    place(this.knob, kx, ky, Math.round(home.r * 0.45));
    this.stickBase.classList.toggle('idle', thumb === null);
  }

  /** The layout editor: every play control drawn over a dimmed screen, dragged where the thumbs want. */
  arrange(): void {
    if (this.editor !== null) return;
    this.tracker.clear();
    this.root.hidden = true;
    const s = this.deps.settings;
    let offsets: Offsets = { ...s.touchLayout };
    const editor = el('div', '', document.body);
    editor.id = 'touch-edit';
    this.editor = editor;
    const bar = el('div', 'bar', editor);
    el('span', '', bar).textContent = t(TOUCH_TEXT.arrange_help, this.lang);
    const reset = el('button', 'alt', bar);
    reset.textContent = t(TOUCH_TEXT.arrange_reset, this.lang);
    const done = el('button', '', bar);
    done.textContent = t(TOUCH_TEXT.arrange_done, this.lang);
    const items = new Map<Movable, HTMLElement>();
    for (const id of MOVABLE) {
      const e = el('div', 'tb', editor);
      e.textContent = id === 'stick' ? '✥' : t(TOUCH_CAPS[id], this.lang);
      e.dataset.id = id;
      items.set(id, e);
    }
    const draw = (): void => {
      const l = this.layoutFor('play', new Set(), offsets);
      for (const b of l.buttons) {
        const e = items.get(b.action as Movable);
        if (e !== undefined) place(e, b.x, b.y, b.r);
      }
      const st = l.stick;
      const se = items.get('stick');
      if (st !== null && se !== undefined) place(se, st.x, st.y, st.r);
      return;
    };
    draw();
    let drag: { id: Movable; pointer: number; x: number; y: number; dx: number; dy: number } | null = null;
    editor.addEventListener('pointerdown', (e) => {
      const id = (e.target as HTMLElement).dataset.id as Movable | undefined;
      if (id === undefined) return;
      const o = offsets[id] ?? { dx: 0, dy: 0 };
      drag = { id, pointer: e.pointerId, x: e.clientX, y: e.clientY, dx: o.dx, dy: o.dy };
      editor.setPointerCapture(e.pointerId);
    });
    editor.addEventListener('pointermove', (e) => {
      if (drag === null || e.pointerId !== drag.pointer) return;
      const d = this.layoutFor('play', new Set(), {}).d || 1;
      const flip = s.touchLeft ? -1 : 1;
      // Stored in button widths, kept within what the settings accept (the layout keeps it on screen).
      const keep = (v: number): number => Math.round(Math.max(-20, Math.min(20, v)) * 100) / 100;
      offsets = {
        ...offsets,
        [drag.id]: {
          dx: keep(drag.dx + (flip * (e.clientX - drag.x)) / d),
          dy: keep(drag.dy + (e.clientY - drag.y) / d),
        },
      };
      draw();
    });
    const drop = (): void => {
      drag = null;
    };
    editor.addEventListener('pointerup', drop);
    editor.addEventListener('pointercancel', drop);
    reset.addEventListener('click', () => {
      offsets = {};
      draw();
    });
    done.addEventListener('click', () => {
      s.touchLayout = { ...offsets };
      this.deps.save();
      editor.remove();
      this.editor = null;
      this.layoutKey = '';
      this.render();
    });
  }

  /** The layout editor is open (the menus wait under it). */
  arranging(): boolean {
    return this.editor !== null;
  }
}

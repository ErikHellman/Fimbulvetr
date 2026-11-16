export interface KeyEventLike {
  readonly code: string;
  readonly target: EventTarget | null;
  preventDefault(): void;
  /** The event's path through shadow roots; `target` is only the shadow host. */
  composedPath?(): readonly unknown[];
}

/** Keys the browser would otherwise use to scroll or move focus. */
const CAPTURED = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** True for elements that take text input (the dev console); the game ignores keys typed there. */
export function isTextInput(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;
  const el = target as { tagName?: unknown; isContentEditable?: unknown };
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/** Marks a page element (a dialog over the game) whose keys the game leaves alone. */
export const IGNORE_KEYS_ATTR = 'data-game-ignore-keys';

function marked(node: unknown): boolean {
  const el = node as { hasAttribute?: unknown } | null;
  return (
    typeof el?.hasAttribute === 'function' && (el.hasAttribute as (a: string) => boolean)(IGNORE_KEYS_ATTR)
  );
}

/** True when the key goes to a text field (also inside a shadow root) or to an element marked to be left alone. */
function forThePage(e: KeyEventLike): boolean {
  const path = e.composedPath?.() ?? [];
  return isTextInput(path[0] ?? e.target) || isTextInput(e.target) || path.some(marked) || marked(e.target);
}

/** Physical keys currently held, by KeyboardEvent.code, so WASD works on every keyboard layout. */
export class KeyboardState {
  private readonly held = new Set<string>();
  /** Keys pressed since the last `takeCodes()`, so a tap shorter than a frame is never lost. */
  private readonly tapped = new Set<string>();

  down(e: KeyEventLike): void {
    if (forThePage(e)) return;
    this.held.add(e.code);
    this.tapped.add(e.code);
    if (CAPTURED.has(e.code)) e.preventDefault();
  }

  up(e: Pick<KeyEventLike, 'code'>): void {
    this.held.delete(e.code);
  }

  /** Call when the window loses focus: key-ups that happen in another window never arrive. */
  clear(): void {
    this.held.clear();
    this.tapped.clear();
  }

  codes(): ReadonlySet<string> {
    return this.held;
  }

  /**
   * Held keys plus any tapped (pressed and released) since the last call, then clears the pending
   * taps. Sampling `codes()` alone once per rendered frame can miss a keydown+keyup pair that both
   * land between two frames; this never does.
   */
  takeCodes(): ReadonlySet<string> {
    const codes = this.tapped.size === 0 ? this.held : new Set([...this.held, ...this.tapped]);
    this.tapped.clear();
    return codes;
  }
}

export function attachKeyboard(win: Window, keys: KeyboardState): () => void {
  const onDown = (e: KeyboardEvent): void => {
    keys.down(e);
  };
  const onUp = (e: KeyboardEvent): void => {
    keys.up(e);
  };
  const onBlur = (): void => {
    keys.clear();
  };
  const onVisibility = (): void => {
    if (win.document.visibilityState === 'hidden') keys.clear();
  };
  win.addEventListener('keydown', onDown);
  win.addEventListener('keyup', onUp);
  win.addEventListener('blur', onBlur);
  win.document.addEventListener('visibilitychange', onVisibility);
  return () => {
    win.removeEventListener('keydown', onDown);
    win.removeEventListener('keyup', onUp);
    win.removeEventListener('blur', onBlur);
    win.document.removeEventListener('visibilitychange', onVisibility);
  };
}

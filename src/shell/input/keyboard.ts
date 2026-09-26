export interface KeyEventLike {
  readonly code: string;
  readonly target: EventTarget | null;
  preventDefault(): void;
}

/** Keys the browser would otherwise use to scroll or move focus. */
const CAPTURED = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** True for elements that take text input (the dev console); the game ignores keys typed there. */
export function isTextInput(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;
  const el = target as { tagName?: unknown; isContentEditable?: unknown };
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/** Physical keys currently held, by KeyboardEvent.code, so WASD works on every keyboard layout. */
export class KeyboardState {
  private readonly held = new Set<string>();

  down(e: KeyEventLike): void {
    if (isTextInput(e.target)) return;
    this.held.add(e.code);
    if (CAPTURED.has(e.code)) e.preventDefault();
  }

  up(e: Pick<KeyEventLike, 'code'>): void {
    this.held.delete(e.code);
  }

  /** Call when the window loses focus: key-ups that happen in another window never arrive. */
  clear(): void {
    this.held.clear();
  }

  codes(): ReadonlySet<string> {
    return this.held;
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

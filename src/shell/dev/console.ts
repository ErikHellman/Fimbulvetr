import type { DevBridge } from './bridge';
import { runCommand } from './commands';

/** Backquote toggles a one-line command console. Keys typed into it never reach the game. */
export function createConsole(current: () => DevBridge | null): void {
  const box = document.createElement('div');
  box.id = 'dev-console';
  box.hidden = true;
  Object.assign(box.style, {
    position: 'fixed',
    left: '4px',
    right: '4px',
    bottom: '4px',
    padding: '6px 8px',
    font: '12px/1.4 ui-monospace, monospace',
    color: '#f2ead8',
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: '21',
  });
  const log = document.createElement('pre');
  log.style.margin = '0 0 4px';
  const input = document.createElement('input');
  input.id = 'dev-console-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  Object.assign(input.style, {
    width: '100%',
    font: 'inherit',
    color: 'inherit',
    background: '#1b1522',
    border: '1px solid #d9b34a',
  });
  box.append(log, input);
  document.body.append(box);

  const print = (text: string): void => {
    const lines = log.textContent.split('\n').filter((l) => l !== '');
    log.textContent = [...lines, text].slice(-6).join('\n');
  };

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Backquote') return;
    e.preventDefault();
    box.hidden = !box.hidden;
    if (box.hidden) input.blur();
    else input.focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      box.hidden = true;
      input.blur();
      return;
    }
    if (e.code !== 'Enter') return;
    const line = input.value.trim();
    input.value = '';
    const b = current();
    if (line === '' || b === null) return;
    print(`> ${line}`);
    print(runCommand(b, line, print));
  });
}

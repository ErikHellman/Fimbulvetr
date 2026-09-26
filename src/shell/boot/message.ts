export interface MessageAction {
  readonly label: string;
  readonly run: () => void;
}

/** Shows a centred message over the game (the `#msg` element). Returns a function that hides it. */
export function showMessage(text: string, actions: readonly MessageAction[] = []): () => void {
  const found = document.getElementById('msg');
  if (!found) throw new Error('#msg element missing from index.html');
  const box: HTMLElement = found;
  const hide = (): void => {
    box.hidden = true;
    box.replaceChildren();
  };
  box.replaceChildren();
  const p = document.createElement('p');
  p.textContent = text;
  box.append(p);
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      hide();
      action.run();
    });
    box.append(button);
  }
  box.hidden = false;
  return hide;
}

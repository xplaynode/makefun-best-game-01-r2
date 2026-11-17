// Keyboard and pointer input: movement keys are held state, menu keys are one-shot actions.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;
export const ACTION_HOWTO = 16;
export const ACTION_CHOOSE_1 = 32;
export const ACTION_CHOOSE_2 = 64;
export const ACTION_CHOOSE_3 = 128;

const HELD = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
  KeyE: 'light',
};
const ACTIONS = {
  Enter: ACTION_CONFIRM, Space: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE, KeyR: ACTION_RESTART, KeyH: ACTION_HOWTO,
  Digit1: ACTION_CHOOSE_1, Digit2: ACTION_CHOOSE_2, Digit3: ACTION_CHOOSE_3,
};

/** Attach listeners to the window and the canvas; returns the input reader. */
export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  const clicks = [];
  window.addEventListener('keydown', (event) => {
    if (HELD[event.code]) { held.add(HELD[event.code]); event.preventDefault(); }
    if (ACTIONS[event.code] && !event.repeat) { actions |= ACTIONS[event.code]; event.preventDefault(); }
  });
  window.addEventListener('keyup', (event) => {
    if (HELD[event.code]) held.delete(HELD[event.code]);
  });
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    clicks.push({
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    });
  });
  return {
    /** Held movement as a unit-ish vector plus the run and light flags. */
    move() {
      return {
        x: (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0),
        y: (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0),
        run: held.has('run'),
        light: held.has('light'),
      };
    },
    takeActions() { const taken = actions; actions = 0; return taken; },
    takeClicks() { return clicks.splice(0, clicks.length); },
  };
}

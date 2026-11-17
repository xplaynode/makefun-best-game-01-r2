// Boot and the one loop for The Last Lamplighter: fixed-step simulation, screens for
// title, how-to, play, pause, dawn, defeat and victory, WebAudio cues drained from
// the state's event list, and the deterministic ?shot= scenes for screenshots.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createGame, chooseUpgrade, scoreOf, stepGame } from './state.js';
import { createInput, ACTION_CHOOSE_1, ACTION_CHOOSE_2, ACTION_CHOOSE_3, ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART } from './input.js';
import { createAudio } from './audio.js';
import * as Screens from './screens.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage off: best lasts this visit */ }
}

if (shot) {
  const state = createGame(createRandom(seed), seed);
  const screen = stageShot(shot, state);
  let painted = 0;
  const paint = () => {
    Screens.drawScreen(ctx, state, screen, { best: readBest(), muted: false });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paint);
} else {
  const input = createInput(canvas);
  let state = createGame(createRandom(seed), seed);
  let screen = Screens.SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  const announce = (message) => { status.textContent = message; };
  function finishRun(won) {
    const score = scoreOf(state);
    if (score > best) { best = score; saveBest(best); }
    screen = won ? Screens.SCREEN_VICTORY : Screens.SCREEN_DEFEAT;
    announce(won ? `Victory. Score ${score}.` : `Defeat on night ${state.night}. Score ${score}.`);
  }
  function restart() {
    state = createGame(createRandom(Math.floor(Math.random() * 4294967296)), seed);
    screen = Screens.SCREEN_PLAY;
    announce('A new run begins. Night 1.');
  }
  function beginFromMenu() { screen = Screens.SCREEN_PLAY; audio.unlock(); announce('Night 1. Keep the lamps lit.'); }
  function pickUpgrade(index) {
    if (chooseUpgrade(state, index) === 'victory') finishRun(true);
    else { screen = Screens.SCREEN_PLAY; announce(`Night ${state.night}.`); }
  }
  function drainEvents() {
    for (const event of state.events.splice(0)) {
      if (event === 'lamp') audio.chime();
      else if (event === 'house') audio.swell();
      else if (event === 'gust') audio.whoosh();
      else if (event === 'refill') audio.refill();
    }
  }
  function handleClicks() {
    for (const click of input.takeClicks()) {
      audio.unlock();
      for (const b of Screens.buttons) {
        if (click.x < b.x || click.x > b.x + b.w || click.y < b.y || click.y > b.y + b.h) continue;
        if (b.id === 'begin') beginFromMenu();
        else if (b.id === 'howto') screen = Screens.SCREEN_HOWTO;
        else if (b.id === 'resume') screen = Screens.SCREEN_PLAY;
        else if (b.id === 'again') restart();
        else if (b.id.startsWith('upgrade-')) pickUpgrade(Number(b.id.slice(8)));
      }
    }
  }
  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) announce(audio.toggleMute() ? 'Muted.' : 'Sound on.');
    if (actions & ACTION_PAUSE) {
      if (screen === Screens.SCREEN_PLAY) { screen = Screens.SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === Screens.SCREEN_PAUSED) { screen = Screens.SCREEN_PLAY; announce('Playing.'); }
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === Screens.SCREEN_TITLE || screen === Screens.SCREEN_HOWTO) beginFromMenu();
      else if (screen === Screens.SCREEN_PAUSED) screen = Screens.SCREEN_PLAY;
    }
    if (screen === Screens.SCREEN_DAWN) {
      if (actions & ACTION_CHOOSE_1) pickUpgrade(0);
      else if (actions & ACTION_CHOOSE_2) pickUpgrade(1);
      else if (actions & ACTION_CHOOSE_3) pickUpgrade(2);
    }
    if ((actions & ACTION_RESTART) && (screen === Screens.SCREEN_DEFEAT || screen === Screens.SCREEN_VICTORY || screen === Screens.SCREEN_DAWN)) restart();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    if (screen === Screens.SCREEN_PLAY) {
      while (accumulator >= STEP && screen === Screens.SCREEN_PLAY) {
        const result = stepGame(state, input.move(), STEP);
        accumulator -= STEP;
        if (result === 'dawn') {
          audio.dawn();
          if (state.night >= 10) finishRun(true);
          else { screen = Screens.SCREEN_DAWN; announce(`Dawn. Night ${state.night} survived. Choose an upgrade.`); }
          break;
        }
        if (result === 'defeat') { finishRun(false); break; }
      }
      drainEvents();
      audio.update(true);
    } else accumulator = 0;
    Screens.drawScreen(ctx, state, screen, { best, muted: audio.muted });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === Screens.SCREEN_PLAY) { screen = Screens.SCREEN_PAUSED; announce('Paused.'); }
  });
  // A read handle for automated play-tests (the game itself never reads it).
  window.__lamplighter = { get state() { return state; }, get screen() { return screen; } };
  announce('The Last Lamplighter. Press Enter or click Begin the night.');
  requestAnimationFrame(frame);
}

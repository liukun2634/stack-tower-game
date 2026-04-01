import { Game } from './game.js';
import { AudioManager } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 480;
const GAME_HEIGHT = 854;
const MUTE_BTN = { x: 422, y: 26, size: 46 };

let _lastDisplayW = 0;
let _lastDisplayH = 0;

function resizeCanvas() {
  const availW = window.innerWidth;
  const availH = window.innerHeight;
  const gameAspect = GAME_WIDTH / GAME_HEIGHT;

  // On wide screens, side panels take space — estimate available canvas width
  let canvasAreaW = availW;
  if (availW >= 900) {
    canvasAreaW = Math.min(480, availW - 320); // 160px per panel
  }
  if (availW >= 1100) {
    canvasAreaW = Math.min(480, availW - 400); // 200px per panel
  }
  const canvasAreaH = availH;
  const areaAspect = canvasAreaW / canvasAreaH;

  let displayW, displayH;
  if (areaAspect > gameAspect) {
    displayH = canvasAreaH;
    displayW = Math.round(displayH * gameAspect);
  } else {
    displayW = Math.min(canvasAreaW, GAME_WIDTH);
    displayH = Math.round(displayW / gameAspect);
  }

  // Clamp to max game resolution
  if (displayW > GAME_WIDTH) {
    displayW = GAME_WIDTH;
    displayH = GAME_HEIGHT;
  }

  // Only touch canvas if size actually changed
  if (canvas.width !== GAME_WIDTH || canvas.height !== GAME_HEIGHT) {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
  }
  if (displayW !== _lastDisplayW || displayH !== _lastDisplayH) {
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    _lastDisplayW = displayW;
    _lastDisplayH = displayH;
  }
}

const audio = new AudioManager();
const game = new Game(ctx, audio);
game.start();

function gameLoop() {
  game.update();
  game.render();
  requestAnimationFrame(gameLoop);
}

function toCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = GAME_WIDTH / rect.width;
  const scaleY = GAME_HEIGHT / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function isMuteHit(x, y) {
  return x >= MUTE_BTN.x && x <= MUTE_BTN.x + MUTE_BTN.size &&
         y >= MUTE_BTN.y && y <= MUTE_BTN.y + MUTE_BTN.size;
}

function handleInteraction(e) {
  audio.init();
  const pos = toCanvasCoords(e);
  if (isMuteHit(pos.x, pos.y)) {
    audio.toggle();
  } else {
    game.handleTap();
  }
}

canvas.addEventListener('click', handleInteraction);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInteraction(e);
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    audio.init();
    game.handleTap();
  }
  if (e.code === 'KeyM') {
    audio.init();
    audio.toggle();
  }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
gameLoop();

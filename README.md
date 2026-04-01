# Stack Tower 🏗️

A casual arcade stacking game built with vanilla HTML5 Canvas. A block swings from a crane — tap to drop it onto the tower. Overhang gets cut off, making precision crucial. Features adaptive AI difficulty, procedural building skins, background music, and sound effects.

**[Play Now](https://liukun2634.github.io/stack-tower-game/)**

## How to Play

1. **Tap / Click / Space** to start the game
2. Watch the block swing from the crane
3. **Tap / Click / Space** to release the block
4. Land it on the tower as precisely as possible
5. Overhang gets cut off — the tower narrows with each miss
6. **Perfect landing** (>95% overlap) earns bonus points and combo multipliers
7. Game ends when you miss the tower completely

## Game Features

- **Swinging crane mechanics** — block swings on a rope pendulum
- **Adaptive difficulty** — game gets harder as you improve, eases off when you struggle
- **Procedural building skins** — each floor has unique colors, windows, doors, and decorations
- **Combo system** — consecutive perfect landings multiply your score (Nice! / Amazing! / Legendary!)
- **Score popups** — floating "+N" text on each landing
- **Background music** — cheerful procedural melody (~40s loop) with bass line
- **Sound effects** — landing, perfect, combo milestone, game over
- **Mute toggle** — click icon or press M, persists across sessions
- **Smooth camera** — parallax clouds and auto-scrolling as your tower grows
- **Best score** — saved locally, persists across sessions

## Controls

| Input | Action |
|---|---|
| Click / Tap | Drop block / Start / Retry |
| Space | Drop block / Start / Retry |
| M | Toggle mute |
| Mute icon (top-right) | Toggle mute |

## Run Locally

### Option 1: Local HTTP Server (Recommended)

The game uses ES modules, which require a server in most browsers.

**Using Node.js:**

```bash
npx serve stack-tower-game
```

Then open http://localhost:3000 in your browser.

**Using Python:**

```bash
cd stack-tower-game
python -m http.server 8080
```

Then open http://localhost:8080 in your browser.

### Option 2: VS Code Live Server

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

## Project Structure

```
stack-tower-game/
├── index.html          # Entry point
├── css/
│   └── style.css       # Responsive layout
└── js/
    ├── main.js         # Init, events, game loop
    ├── game.js         # State machine, scoring, combos
    ├── block.js        # Swing, drop, landing mechanics
    ├── tower.js        # Block stack + camera scrolling
    ├── renderer.js     # All Canvas drawing
    ├── ai.js           # Difficulty scaling + procedural skins
    ├── audio.js        # Web Audio API synthesis (BGM + SFX)
    └── utils.js        # Math helpers
```

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript (ES modules)
- Web Audio API (procedural synthesis, zero audio files)
- Zero external dependencies
- Total size < 100KB

## Debug

1. Open the game in your browser
2. Press `F12` to open DevTools
3. **Console tab** — check for errors
4. **Sources tab** — set breakpoints in any JS file

### Common Issues

| Issue | Fix |
|---|---|
| Blank screen | Check console for module import errors. Use a local server. |
| Modules not loading | ES modules require HTTP/HTTPS, not `file://`. |
| Touch not working | Ensure `touch-action: none` in CSS. Test on actual device or DevTools mobile emulation. |

## License

MIT

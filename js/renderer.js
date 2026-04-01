import { BLOCK_HEIGHT } from './block.js';
import { lerp } from './utils.js';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 854;
const GROUND_BASE_Y = 754;
const SAFE_AREA_TOP = 16;
const CRANE_ARM_Y = 80;
const CRANE_MAST_X = GAME_WIDTH - 56;
const CRANE_ARM_END_X = CRANE_MAST_X - 138;
const CRANE_PULLEY_X = CRANE_ARM_END_X + 8;
const CRANE_PULLEY_Y = CRANE_ARM_Y;
const MIN_OVERLAP = 12;

const SKYLINE_BUILDINGS = [
  { x: -8, w: 58, h: 130 },
  { x: 42, w: 38, h: 94 },
  { x: 74, w: 66, h: 150 },
  { x: 132, w: 42, h: 108 },
  { x: 166, w: 70, h: 168 },
  { x: 230, w: 54, h: 124 },
  { x: 276, w: 62, h: 154 },
  { x: 332, w: 46, h: 112 },
  { x: 368, w: 72, h: 142 },
  { x: 434, w: 54, h: 98 },
];

// --- Color palette ---
const CLOUD_WHITE = 'rgba(255, 255, 255, 0.7)';
const CLOUD_SHADOW = 'rgba(180, 210, 240, 0.3)';

const CRANE_BODY = '#F5C542';
const CRANE_DARK = '#D4A12A';
const CRANE_CABIN = '#E8B830';
const CRANE_METAL = '#5A6672';
const ROPE_COLOR = '#4A3728';

const HUD_BG = 'rgba(15, 25, 40, 0.72)';
const HUD_BORDER = 'rgba(255, 255, 255, 0.08)';
const HUD_LABEL = 'rgba(160, 195, 255, 0.85)';
const HUD_VALUE = '#FFFFFF';
const ACCENT_GOLD = '#FFB800';

const FONT = 'sans-serif';

// Sky color stops for altitude progression
const SKY_STAGES = [
  { top: '#4A90D9', mid: '#87CEEB', bottom: '#FCEABB', base: '#F8D89A' },  // ground level: warm day
  { top: '#3A78C2', mid: '#6BB5DE', bottom: '#E8D4A0', base: '#E0C888' },  // mid: cooler
  { top: '#2B5EA8', mid: '#5098C8', bottom: '#C8B8A0', base: '#B8A888' },  // high: cold blue
  { top: '#1E3F78', mid: '#3A6E9E', bottom: '#8090A5', base: '#6A7888' },  // very high: twilight
];

function lerpColor(a, b, t) {
  const pa = parseInt, s = 1;
  const ar = pa(a.slice(1, 3), 16), ag = pa(a.slice(3, 5), 16), ab = pa(a.slice(5, 7), 16);
  const br = pa(b.slice(1, 3), 16), bg = pa(b.slice(3, 5), 16), bb = pa(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function getSkyColors(cameraY) {
  const progress = Math.min(cameraY / 2000, 1); // 0..1 over 2000px of camera scroll (~50 floors)
  const stages = SKY_STAGES;
  const t = progress * (stages.length - 1);
  const i = Math.min(Math.floor(t), stages.length - 2);
  const frac = t - i;
  return {
    top: lerpColor(stages[i].top, stages[i + 1].top, frac),
    mid: lerpColor(stages[i].mid, stages[i + 1].mid, frac),
    bottom: lerpColor(stages[i].bottom, stages[i + 1].bottom, frac),
    base: lerpColor(stages[i].base, stages[i + 1].base, frac),
  };
}

export { MIN_OVERLAP };

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this._frameCount = 0;

    // Offscreen canvas for static background
    this._bgCanvas = document.createElement('canvas');
    this._bgCanvas.width = GAME_WIDTH;
    this._bgCanvas.height = GAME_HEIGHT;
    this._bgCtx = this._bgCanvas.getContext('2d');
    this._bgCameraY = -9999; // force first render

    // Offscreen canvas for crane (fully static)
    this._craneCanvas = document.createElement('canvas');
    this._craneCanvas.width = GAME_WIDTH;
    this._craneCanvas.height = GAME_HEIGHT;
    this._craneCtx = this._craneCanvas.getContext('2d');
    this._craneDrawn = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this._frameCount++;
  }

  // ==================== BACKGROUND ====================

  drawBackground(cameraY) {
    // Only re-render background if camera moved enough to be visible
    if (Math.abs(cameraY - this._bgCameraY) > 4) {
      this._renderBackground(cameraY);
      this._bgCameraY = cameraY;
    }
    this.ctx.drawImage(this._bgCanvas, 0, 0);
  }

  _renderBackground(cameraY) {
    const ctx = this._bgCtx;
    const sky = getSkyColors(cameraY);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, sky.top);
    skyGrad.addColorStop(0.45, sky.mid);
    skyGrad.addColorStop(0.85, sky.bottom);
    skyGrad.addColorStop(1, sky.base);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sun glow
    const sunX = 100;
    const sunY = 120 - cameraY * 0.04;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
    sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255, 230, 150, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 220, 100, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - 120, Math.max(0, sunY - 120), 240, 240);

    // Sun disc
    ctx.fillStyle = 'rgba(255, 245, 200, 0.95)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    this._drawClouds(ctx, cameraY);

    // Skyline
    this._drawSkyline(ctx, cameraY);

    // Ground
    const groundY = GROUND_BASE_Y + cameraY;
    if (groundY < GAME_HEIGHT) {
      const groundGrad = ctx.createLinearGradient(0, groundY - 8, 0, groundY + 200);
      groundGrad.addColorStop(0, '#6B9B37');
      groundGrad.addColorStop(0.08, '#5A8A2E');
      groundGrad.addColorStop(0.2, '#8A7455');
      groundGrad.addColorStop(1, '#6A5540');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY - 6, GAME_WIDTH, GAME_HEIGHT - groundY + 220);

      ctx.fillStyle = 'rgba(120, 180, 60, 0.5)';
      ctx.fillRect(0, groundY - 6, GAME_WIDTH, 4);
    }

    // Atmospheric haze
    const hazeGrad = ctx.createLinearGradient(0, GAME_HEIGHT * 0.82, 0, GAME_HEIGHT);
    hazeGrad.addColorStop(0, 'rgba(60, 50, 40, 0)');
    hazeGrad.addColorStop(1, 'rgba(50, 40, 30, 0.12)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, GAME_HEIGHT * 0.82, GAME_WIDTH, GAME_HEIGHT * 0.18);
  }

  _drawClouds(ctx, cameraY) {
    const layerA = -cameraY * 0.14;
    const layerB = -cameraY * 0.09;
    const layerC = -cameraY * 0.05;

    ctx.fillStyle = CLOUD_SHADOW;
    this._drawCloud(ctx, 340, 190 + layerC, 50);
    this._drawCloud(ctx, 420, 150 + layerC, 38);

    ctx.fillStyle = CLOUD_WHITE;
    this._drawCloud(ctx, 64, 96 + layerA, 80);
    this._drawCloud(ctx, 222, 128 + layerA, 48);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this._drawCloud(ctx, 150, 165 + layerB, 68);
  }

  _drawSkyline(ctx, cameraY) {
    const skylineBaseY = 680 + cameraY * 0.1;

    // Far layer
    ctx.fillStyle = 'rgba(60, 75, 100, 0.12)';
    for (const b of SKYLINE_BUILDINGS) {
      ctx.fillRect(b.x + 10, skylineBaseY - b.h * 0.7, b.w * 0.8, b.h * 0.7);
    }

    // Near layer with simplified windows
    for (const b of SKYLINE_BUILDINGS) {
      ctx.fillStyle = 'rgba(70, 85, 115, 0.18)';
      ctx.fillRect(b.x, skylineBaseY - b.h, b.w, b.h);

      // Sparse window dots (every other row/col)
      ctx.fillStyle = 'rgba(255, 240, 180, 0.12)';
      for (let wy = skylineBaseY - b.h + 12; wy < skylineBaseY - 10; wy += 20) {
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 14) {
          ctx.fillRect(wx, wy, 4, 5);
        }
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(b.x, skylineBaseY - b.h, b.w, 2);
    }
  }

  _drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.52, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.22, size * 0.38, 0, Math.PI * 2);
    ctx.arc(x + size * 0.76, y - size * 0.05, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==================== CRANE ====================

  drawCraneBody() {
    // Crane is fully static — render once to offscreen canvas
    if (!this._craneDrawn) {
      this._renderCrane(this._craneCtx);
      this._craneDrawn = true;
    }
    this.ctx.drawImage(this._craneCanvas, 0, 0);
  }

  _renderCrane(ctx) {
    const mastX = CRANE_MAST_X;
    const mastTopY = CRANE_ARM_Y - 68;
    const armY = CRANE_ARM_Y;
    const armEndX = CRANE_ARM_END_X;

    // Mast shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(mastX - 5, mastTopY + 4, 16, GAME_HEIGHT - mastTopY + 20);

    // Mast body
    ctx.fillStyle = CRANE_BODY;
    ctx.fillRect(mastX - 8, mastTopY, 16, GAME_HEIGHT - mastTopY + 20);

    // Mast lattice — batch into single path
    ctx.strokeStyle = CRANE_DARK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let y = mastTopY + 12; y < GAME_HEIGHT; y += 18) {
      ctx.moveTo(mastX - 8, y);
      ctx.lineTo(mastX + 8, y + 10);
      ctx.moveTo(mastX + 8, y);
      ctx.lineTo(mastX - 8, y + 10);
    }
    ctx.stroke();

    // Mast edge highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(mastX - 8, mastTopY, 2, GAME_HEIGHT - mastTopY + 20);

    // Arm shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(mastX - 2, armY + 3);
    ctx.lineTo(armEndX + 2, armY + 3);
    ctx.stroke();

    // Arm body
    ctx.strokeStyle = CRANE_BODY;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(mastX - 4, armY);
    ctx.lineTo(armEndX, armY);
    ctx.stroke();

    // Arm highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mastX - 4, armY - 3);
    ctx.lineTo(armEndX, armY - 3);
    ctx.stroke();

    // Arm truss — batch
    ctx.strokeStyle = CRANE_DARK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const trussStep = 16;
    for (let x = armEndX; x <= mastX - 4; x += trussStep) {
      ctx.moveTo(x, armY + 2);
      ctx.lineTo(Math.min(x + trussStep, mastX - 4), armY - 10);
    }
    ctx.stroke();

    // Support cables
    ctx.strokeStyle = ROPE_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mastX, mastTopY);
    ctx.lineTo(armEndX + 20, armY);
    ctx.moveTo(mastX, mastTopY);
    ctx.lineTo(mastX + 20, armY);
    ctx.stroke();

    // Cabin
    ctx.fillStyle = CRANE_CABIN;
    this._fillRR(ctx, mastX - 44, armY - 4, 32, 24, 5);
    ctx.fillStyle = 'rgba(200, 235, 255, 0.85)';
    this._fillRR(ctx, mastX - 41, armY - 1, 26, 11, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(mastX - 39, armY, 8, 4);

    // Counterweight
    ctx.fillStyle = CRANE_METAL;
    this._fillRR(ctx, mastX + 11, armY - 2, 22, 18, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(mastX + 13, armY, 18, 2);

    // Pulley
    ctx.fillStyle = CRANE_METAL;
    ctx.beginPath();
    ctx.arc(CRANE_PULLEY_X, CRANE_PULLEY_Y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(CRANE_PULLEY_X - 1, CRANE_PULLEY_Y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3E4A54';
    ctx.beginPath();
    ctx.arc(CRANE_PULLEY_X, CRANE_PULLEY_Y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _fillRR(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  drawRopeAndHook(attachX, attachY, cameraY) {
    const ctx = this.ctx;
    const drawAttachY = attachY + cameraY;
    const ropeTopY = CRANE_PULLEY_Y + 8;

    // Rope shadow + main + highlight in fewer calls
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CRANE_PULLEY_X + 1, ropeTopY + 1);
    ctx.lineTo(attachX + 1, drawAttachY + 1);
    ctx.stroke();

    ctx.strokeStyle = ROPE_COLOR;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(CRANE_PULLEY_X, ropeTopY);
    ctx.lineTo(attachX, drawAttachY);
    ctx.stroke();

    // Hook
    ctx.strokeStyle = CRANE_METAL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(attachX, drawAttachY - 12);
    ctx.lineTo(attachX, drawAttachY - 1);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(attachX + 3, drawAttachY + 2, 5, Math.PI * 0.6, Math.PI * 2);
    ctx.stroke();
  }

  // ==================== BLOCKS ====================

  drawBlock(block, cameraY, skin) {
    const ctx = this.ctx;
    const x = block.x;
    const y = block.y + cameraY;
    const w = block.width;
    const h = block.height;

    // Viewport culling
    if (y + h < -10 || y > GAME_HEIGHT + 10) return;

    // Block shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(x + 3, y + 3, w, h);

    // Main wall
    ctx.fillStyle = skin ? skin.wallColor : '#C4756B';
    ctx.fillRect(x, y, w, h);

    // 3D edges: top + left highlight, bottom + right shadow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(x + w - 2, y, 2, h);

    // Outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    if (skin) {
      this.drawBuildingSkin(x, y, w, h, skin);
    }
  }

  drawBuildingSkin(x, y, width, height, skin) {
    const ctx = this.ctx;
    const padding = 6;
    const windowWidth = Math.min(12, (width - padding * 2) / (skin.windows.length * 2));
    const windowHeight = height * 0.5;
    const windowY = y + (height - windowHeight) / 2;

    if (skin.hasDoor) {
      const doorWidth = windowWidth * 1.4;
      const doorHeight = height * 0.78;
      const doorX = x + (width - doorWidth) / 2;
      const doorY = y + height - doorHeight;

      ctx.fillStyle = '#4A2C15';
      ctx.fillRect(doorX - 1, doorY - 1, doorWidth + 2, doorHeight + 1);
      ctx.fillStyle = '#6B3E22';
      ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const totalWindowsWidth = skin.windows.length * windowWidth + (skin.windows.length - 1) * (windowWidth * 0.8);
    let winStartX = x + (width - totalWindowsWidth) / 2;

    for (let i = 0; i < skin.windows.length; i++) {
      const wx = winStartX + i * (windowWidth + windowWidth * 0.8);
      if (wx + windowWidth > x + width - padding) break;

      ctx.fillStyle = skin.windows[i].lit ? '#FFE4A0' : '#3A4A6C';
      ctx.fillRect(wx, windowY, windowWidth, windowHeight);

      // Simplified cross
      ctx.strokeStyle = 'rgba(80, 80, 80, 0.35)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(wx + windowWidth / 2, windowY);
      ctx.lineTo(wx + windowWidth / 2, windowY + windowHeight);
      ctx.moveTo(wx, windowY + windowHeight / 2);
      ctx.lineTo(wx + windowWidth, windowY + windowHeight / 2);
      ctx.stroke();
    }

    if (skin.decoration === 'ac_unit') {
      ctx.fillStyle = '#C8C8C8';
      ctx.fillRect(x + width - 17, y + height - 15, 13, 11);
    } else if (skin.decoration === 'plant') {
      ctx.fillStyle = '#2D8B3C';
      ctx.beginPath();
      ctx.arc(x + width - 10, y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.decoration === 'awning') {
      ctx.fillStyle = '#CC3333';
      ctx.beginPath();
      ctx.moveTo(x + 4, y);
      ctx.lineTo(x + width * 0.4, y);
      ctx.lineTo(x + width * 0.4, y + 9);
      ctx.lineTo(x + 4, y);
      ctx.fill();
    }

    if (skin.divider === 'thick') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(x, y + height - 3, width, 3);
    } else if (skin.divider === 'thin') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + height - 1);
      ctx.lineTo(x + width, y + height - 1);
      ctx.stroke();
    } else if (skin.divider === 'decorative') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x, y + height - 4, width, 4);
    }
  }

  drawRooftop(block, cameraY) {
    const ctx = this.ctx;
    const x = block.x;
    const y = block.y + cameraY;
    const w = block.width;

    if (y < -30 || y > GAME_HEIGHT + 10) return;

    ctx.fillStyle = '#545D68';
    ctx.fillRect(x + w / 2 - 1.5, y - 22, 3, 22);

    ctx.fillStyle = '#E83030';
    this.fillRoundedRect(x + w / 2 + 2, y - 22, 14, 9, 2);

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 23, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==================== HUD ====================

  drawHUD(score, combo, floor) {
    const ctx = this.ctx;
    const topY = SAFE_AREA_TOP + 10;
    const margin = 12;
    const pillW = 100;
    const pillH = 46;
    const gap = 8;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Row 1: SCORE + FLOOR (same size, aligned)
    this._drawHUDPill(margin, topY, pillW, pillH);
    ctx.fillStyle = HUD_LABEL;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillText('SCORE', margin + pillW / 2, topY + 14);
    ctx.fillStyle = HUD_VALUE;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText(`${score}`, margin + pillW / 2, topY + 34);

    const floorX = margin + pillW + gap;
    this._drawHUDPill(floorX, topY, pillW, pillH);
    ctx.fillStyle = HUD_LABEL;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillText('FLOOR', floorX + pillW / 2, topY + 14);
    ctx.fillStyle = HUD_VALUE;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText(`${floor}`, floorX + pillW / 2, topY + 34);

    // Row 2: COMBO (only if active)
    if (combo > 1) {
      const row2Y = topY + pillH + gap;
      this._drawHUDPill(margin, row2Y, pillW, pillH, true);
      ctx.fillStyle = 'rgba(255, 184, 0, 0.8)';
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillText('COMBO', margin + pillW / 2, row2Y + 14);
      ctx.fillStyle = ACCENT_GOLD;
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText(`x${combo}`, margin + pillW / 2, row2Y + 34);
    }
  }

  _drawHUDPill(x, y, w, h, isAccent) {
    const ctx = this.ctx;
    const r = 10;
    ctx.fillStyle = isAccent ? 'rgba(255, 184, 0, 0.12)' : HUD_BG;
    this.fillRoundedRect(x, y, w, h, r);
    ctx.strokeStyle = isAccent ? 'rgba(255, 184, 0, 0.3)' : HUD_BORDER;
    ctx.lineWidth = 1;
    this.strokeRoundedRect(x, y, w, h, r);
  }

  drawMuteButton(muted) {
    const ctx = this.ctx;
    const s = 46;
    const r = 10;
    const x = GAME_WIDTH - s - 12;
    const y = SAFE_AREA_TOP + 10;

    ctx.fillStyle = HUD_BG;
    this.fillRoundedRect(x, y, s, s, r);
    ctx.strokeStyle = HUD_BORDER;
    ctx.lineWidth = 1;
    this.strokeRoundedRect(x, y, s, s, r);

    const cx = x + s / 2;
    const cy = y + s / 2;

    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 4);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.lineTo(cx + 3, cy - 9);
    ctx.lineTo(cx + 3, cy + 9);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.lineTo(cx - 8, cy + 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(240, 240, 240, 0.9)';
    if (muted) {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy - 5);
      ctx.lineTo(cx + 13, cy + 5);
      ctx.moveTo(cx + 13, cy - 5);
      ctx.lineTo(cx + 6, cy + 5);
      ctx.stroke();
    } else {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 5, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 10, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }
  }

  // ==================== EFFECTS ====================

  drawPerfectFlash() {
    this.ctx.fillStyle = 'rgba(255, 255, 205, 0.2)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  drawParticles(particles, cameraY) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      if (p.type === 'sparkle') {
        ctx.save();
        ctx.translate(p.x, p.y + cameraY);
        ctx.rotate(p.life * 0.3);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y + cameraY - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawMilestoneText(milestone) {
    if (!milestone || milestone.timer <= 0) return;
    const ctx = this.ctx;
    const alpha = Math.min(1, milestone.timer / (milestone.maxTimer * 0.3));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillText(milestone.text, GAME_WIDTH / 2 + 2, milestone.y + 2);
    ctx.fillStyle = ACCENT_GOLD;
    ctx.fillText(milestone.text, GAME_WIDTH / 2, milestone.y);
    ctx.restore();
  }

  drawScorePopups(popups, cameraY) {
    const ctx = this.ctx;
    for (const sp of popups) {
      const alpha = Math.min(1, sp.timer / (sp.maxTimer * 0.25));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = sp.isPerfect ? `bold 22px ${FONT}` : `bold 18px ${FONT}`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(sp.text, sp.x + 1, sp.y + cameraY + 1);
      ctx.fillStyle = sp.isPerfect ? ACCENT_GOLD : '#FFFFFF';
      ctx.fillText(sp.text, sp.x, sp.y + cameraY);
      ctx.restore();
    }
  }

  // ==================== OVERLAY SCREENS ====================

  drawStartScreen(bestScore) {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.45)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cardW = 340;
    const cardH = 310;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = GAME_HEIGHT / 2 - 155;

    this._drawCard(cardX, cardY, cardW, cardH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#1A2332';
    ctx.font = `bold 42px ${FONT}`;
    ctx.fillText('Stack Tower', GAME_WIDTH / 2, cardY + 52);

    ctx.fillStyle = 'rgba(74, 144, 217, 0.8)';
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillText('B U I L D   H I G H E R', GAME_WIDTH / 2, cardY + 76);

    this._drawDivider(ctx, cardX, cardW, cardY + 92);

    ctx.fillStyle = '#5C6778';
    ctx.font = `15px ${FONT}`;
    ctx.fillText('Tap to drop blocks on the tower', GAME_WIDTH / 2, cardY + 122);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#8090A5';
    ctx.fillText('Land precisely for combos & bonus points', GAME_WIDTH / 2, cardY + 144);

    if (bestScore > 0) {
      ctx.fillStyle = 'rgba(74, 144, 217, 0.08)';
      this.fillRoundedRect(cardX + 30, cardY + 166, cardW - 60, 48, 10);

      ctx.fillStyle = 'rgba(74, 144, 217, 0.7)';
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillText('PERSONAL BEST', GAME_WIDTH / 2, cardY + 182);

      ctx.fillStyle = '#1A2332';
      ctx.font = `bold 28px ${FONT}`;
      ctx.fillText(`${bestScore}`, GAME_WIDTH / 2, cardY + 206);
    }

    const btnY = bestScore > 0 ? cardY + 232 : cardY + 190;
    this._drawButton(GAME_WIDTH / 2 - 80, btnY, 160, 48, 'TAP TO PLAY');
  }

  drawGameOver(score, floor, bestScore, isNewRecord) {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.55)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cardW = 340;
    const cardH = 370;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = GAME_HEIGHT / 2 - 185;

    this._drawCard(cardX, cardY, cardW, cardH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#1A2332';
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillText('Game Over', GAME_WIDTH / 2, cardY + 45);

    this._drawDivider(ctx, cardX, cardW, cardY + 62);

    // Score box
    ctx.fillStyle = 'rgba(74, 144, 217, 0.08)';
    this.fillRoundedRect(cardX + 30, cardY + 78, cardW - 60, 64, 12);

    ctx.fillStyle = 'rgba(74, 144, 217, 0.7)';
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillText('YOUR SCORE', GAME_WIDTH / 2, cardY + 95);

    ctx.fillStyle = '#1A2332';
    ctx.font = `bold 36px ${FONT}`;
    ctx.fillText(`${score}`, GAME_WIDTH / 2, cardY + 128);

    ctx.fillStyle = '#7A8A9E';
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`${floor} floors stacked`, GAME_WIDTH / 2, cardY + 166);

    if (isNewRecord) {
      ctx.fillStyle = 'rgba(255, 184, 0, 0.12)';
      this.fillRoundedRect(cardX + 30, cardY + 188, cardW - 60, 50, 10);
      ctx.strokeStyle = 'rgba(255, 184, 0, 0.3)';
      ctx.lineWidth = 1;
      this.strokeRoundedRect(cardX + 30, cardY + 188, cardW - 60, 50, 10);

      ctx.fillStyle = ACCENT_GOLD;
      ctx.font = `bold 12px ${FONT}`;
      ctx.fillText('NEW RECORD!', GAME_WIDTH / 2, cardY + 205);

      ctx.fillStyle = '#1A2332';
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(`${bestScore}`, GAME_WIDTH / 2, cardY + 228);
    } else {
      ctx.fillStyle = '#7A8A9E';
      ctx.font = `14px ${FONT}`;
      ctx.fillText(`Best: ${bestScore}`, GAME_WIDTH / 2, cardY + 210);
    }

    this._drawButton(GAME_WIDTH / 2 - 80, cardY + 280, 160, 48, 'TAP TO RETRY');
  }

  // ==================== SHARED COMPONENTS ====================

  _drawDivider(ctx, cardX, cardW, y) {
    const grad = ctx.createLinearGradient(cardX + 40, 0, cardX + cardW - 40, 0);
    grad.addColorStop(0, 'rgba(74, 144, 217, 0)');
    grad.addColorStop(0.5, 'rgba(74, 144, 217, 0.35)');
    grad.addColorStop(1, 'rgba(74, 144, 217, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, y);
    ctx.lineTo(cardX + cardW - 40, y);
    ctx.stroke();
  }

  _drawButton(x, y, w, h, text) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#4A90D9');
    grad.addColorStop(1, '#3570B0');
    ctx.fillStyle = grad;
    this.fillRoundedRect(x, y, w, h, 14);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.fillRoundedRect(x + 2, y + 2, w - 4, h / 2 - 2, 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  }

  _drawCard(x, y, width, height) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(10, 15, 25, 0.4)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    this.fillRoundedRect(x, y, width, height, 20);
    ctx.restore();

    ctx.strokeStyle = 'rgba(74, 144, 217, 0.12)';
    ctx.lineWidth = 1.5;
    this.strokeRoundedRect(x, y, width, height, 20);
  }

  // ==================== PRIMITIVES ====================

  fillRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  strokeRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  }
}

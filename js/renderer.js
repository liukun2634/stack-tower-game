import { BLOCK_HEIGHT } from './block.js';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 854;
const GROUND_BASE_Y = 754;
const SAFE_AREA_TOP = 16;
const SAFE_AREA_BOTTOM = 34;
const CRANE_PRIMARY_YELLOW = '#F6C445';
const CRANE_SHADOW_YELLOW = '#D9A62A';
const CRANE_METAL_GRAY = '#6E7781';
const ROPE_DARK_BROWN = '#5B4A3A';
const CRANE_ARM_Y = 80;
const CRANE_MAST_X = GAME_WIDTH - 56;
const CRANE_ARM_END_X = CRANE_MAST_X - 138;
const CRANE_PULLEY_X = CRANE_ARM_END_X + 8;
const CRANE_PULLEY_Y = CRANE_ARM_Y;
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

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  drawBackground(cameraY) {
    const ctx = this.ctx;

    const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGradient.addColorStop(0, '#8DC9FF');
    skyGradient.addColorStop(0.5, '#D9EEFF');
    skyGradient.addColorStop(1, '#F4E8D5');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.drawSkyline(cameraY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const cloudLayerA = -cameraY * 0.14;
    const cloudLayerB = -cameraY * 0.09;
    this.drawCloud(64, 96 + cloudLayerA, 80);
    this.drawCloud(154, 160 + cloudLayerB, 62);
    this.drawCloud(222, 128 + cloudLayerA, 42);


    const groundY = GROUND_BASE_Y + cameraY;
    const groundGradient = ctx.createLinearGradient(0, groundY - 10, 0, GAME_HEIGHT);
    groundGradient.addColorStop(0, '#729E52');
    groundGradient.addColorStop(0.18, '#8A7459');
    groundGradient.addColorStop(1, '#695742');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY - 6, GAME_WIDTH, GAME_HEIGHT - groundY + 220);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(0, groundY - 6, GAME_WIDTH, 3);

    const nearBandTop = Math.floor(GAME_HEIGHT * 0.8);
    const nearBandGradient = ctx.createLinearGradient(0, nearBandTop, 0, GAME_HEIGHT);
    nearBandGradient.addColorStop(0, 'rgba(73, 63, 52, 0.08)');
    nearBandGradient.addColorStop(1, 'rgba(55, 46, 38, 0.2)');
    ctx.fillStyle = nearBandGradient;
    ctx.fillRect(0, nearBandTop, GAME_WIDTH, GAME_HEIGHT - nearBandTop);
  }

  drawSkyline(cameraY) {
    const ctx = this.ctx;
    const skylineBaseY = 680 + cameraY * 0.1;

    for (const building of SKYLINE_BUILDINGS) {
      ctx.fillStyle = 'rgba(78, 93, 122, 0.16)';
      ctx.fillRect(building.x, skylineBaseY - building.h, building.w, building.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(building.x + 4, skylineBaseY - building.h + 8, building.w - 8, 2);
    }
  }

  drawCloud(x, y, size) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.52, 0, Math.PI * 2);
    ctx.arc(x + size * 0.42, y - size * 0.16, size * 0.34, 0, Math.PI * 2);
    ctx.arc(x + size * 0.76, y, size * 0.39, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCraneBody() {
    const ctx = this.ctx;

    const mastX = CRANE_MAST_X;
    const mastTopY = CRANE_ARM_Y - 68;
    const armY = CRANE_ARM_Y;
    const armEndX = CRANE_ARM_END_X;

    ctx.fillStyle = CRANE_PRIMARY_YELLOW;
    ctx.fillRect(mastX - 8, mastTopY, 16, GAME_HEIGHT - mastTopY + 20);

    ctx.strokeStyle = CRANE_SHADOW_YELLOW;
    ctx.lineWidth = 1.5;
    for (let y = mastTopY + 12; y < GAME_HEIGHT; y += 18) {
      ctx.beginPath();
      ctx.moveTo(mastX - 8, y);
      ctx.lineTo(mastX + 8, y + 10);
      ctx.moveTo(mastX + 8, y);
      ctx.lineTo(mastX - 8, y + 10);
      ctx.stroke();
    }

    ctx.strokeStyle = CRANE_PRIMARY_YELLOW;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(mastX - 4, armY);
    ctx.lineTo(armEndX, armY);
    ctx.stroke();

    ctx.strokeStyle = CRANE_SHADOW_YELLOW;
    ctx.lineWidth = 1.5;
    const trussStep = 16;
    for (let x = armEndX; x <= mastX - 4; x += trussStep) {
      ctx.beginPath();
      ctx.moveTo(x, armY);
      ctx.lineTo(Math.min(x + trussStep, mastX - 4), armY - 12);
      ctx.stroke();
    }

    ctx.fillStyle = CRANE_SHADOW_YELLOW;
    this.fillRoundedRect(mastX - 42, armY - 4, 30, 22, 4);
    ctx.fillStyle = 'rgba(229, 244, 255, 0.8)';
    this.fillRoundedRect(mastX - 39, armY - 1, 24, 10, 3);

    ctx.fillStyle = CRANE_SHADOW_YELLOW;
    this.fillRoundedRect(mastX + 11, armY - 2, 22, 18, 3);

    ctx.fillStyle = CRANE_METAL_GRAY;
    ctx.beginPath();
    ctx.arc(CRANE_PULLEY_X, CRANE_PULLEY_Y, 7, 0, Math.PI * 2);
    ctx.fill();

  }

  drawRopeAndHook(attachX, attachY, cameraY) {
    const ctx = this.ctx;
    const drawAttachY = attachY + cameraY;

    const ropeTopY = CRANE_PULLEY_Y + 7;

    ctx.strokeStyle = ROPE_DARK_BROWN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CRANE_PULLEY_X, ropeTopY);
    ctx.lineTo(attachX, drawAttachY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(CRANE_PULLEY_X + 0.6, ropeTopY);
    ctx.lineTo(attachX + 0.6, drawAttachY);
    ctx.stroke();

    ctx.strokeStyle = CRANE_METAL_GRAY;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(attachX, drawAttachY - 10);
    ctx.lineTo(attachX, drawAttachY - 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(attachX + 3, drawAttachY + 2, 4, Math.PI * 0.7, Math.PI * 1.95);
    ctx.stroke();
  }

  drawBlock(block, cameraY, skin) {
    const ctx = this.ctx;
    const drawX = block.x;
    const drawY = block.y + cameraY;

    ctx.fillStyle = skin ? skin.wallColor : '#C4756B';
    ctx.fillRect(drawX, drawY, block.width, block.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX, drawY, block.width, block.height);

    if (skin) {
      this.drawBuildingSkin(drawX, drawY, block.width, block.height, skin);
    }
  }

  drawBuildingSkin(x, y, width, height, skin) {
    const ctx = this.ctx;
    const padding = 6;
    const windowWidth = Math.min(12, (width - padding * 2) / (skin.windows.length * 2));
    const windowHeight = height * 0.5;
    const windowY = y + (height - windowHeight) / 2;

    if (skin.hasDoor) {
      const doorWidth = windowWidth * 1.2;
      const doorHeight = height * 0.75;
      const doorX = x + (width - doorWidth) / 2;
      const doorY = y + height - doorHeight;
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const totalWindowsWidth = skin.windows.length * windowWidth + (skin.windows.length - 1) * (windowWidth * 0.8);
    let winStartX = x + (width - totalWindowsWidth) / 2;

    for (let i = 0; i < skin.windows.length; i++) {
      const wx = winStartX + i * (windowWidth + windowWidth * 0.8);
      if (wx + windowWidth > x + width - padding) break;

      ctx.fillStyle = skin.windows[i].lit ? '#FFE4A0' : '#3A3A5C';
      ctx.fillRect(wx, windowY, windowWidth, windowHeight);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(wx, windowY, windowWidth, windowHeight);

      ctx.beginPath();
      ctx.moveTo(wx + windowWidth / 2, windowY);
      ctx.lineTo(wx + windowWidth / 2, windowY + windowHeight);
      ctx.moveTo(wx, windowY + windowHeight / 2);
      ctx.lineTo(wx + windowWidth, windowY + windowHeight / 2);
      ctx.stroke();
    }

    if (skin.decoration === 'ac_unit') {
      ctx.fillStyle = '#D0D0D0';
      ctx.fillRect(x + width - 16, y + height - 14, 12, 10);
    } else if (skin.decoration === 'plant') {
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(x + width - 10, y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.decoration === 'awning') {
      ctx.fillStyle = '#CC4444';
      ctx.beginPath();
      ctx.moveTo(x + 4, y);
      ctx.lineTo(x + width * 0.4, y);
      ctx.lineTo(x + width * 0.4, y + 8);
      ctx.lineTo(x + 4, y);
      ctx.fill();
    }

    if (skin.divider === 'thick') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(x, y + height - 3, width, 3);
    } else if (skin.divider === 'thin') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + height - 1);
      ctx.lineTo(x + width, y + height - 1);
      ctx.stroke();
    } else if (skin.divider === 'decorative') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x, y + height - 4, width, 4);
      ctx.fillRect(x + 2, y + height - 6, width - 4, 2);
    }
  }

  drawRooftop(block, cameraY) {
    const ctx = this.ctx;
    const x = block.x;
    const y = block.y + cameraY;

    ctx.fillStyle = '#545D68';
    ctx.fillRect(x + block.width / 2 - 1, y - 20, 2, 20);
    ctx.fillStyle = '#F24A4A';
    this.fillRoundedRect(x + block.width / 2 + 1, y - 20, 12, 8, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(x + block.width / 2 + 2, y - 19, 8, 1);
  }

  drawHUD(score, combo, floor) {
    const ctx = this.ctx;
    const row1Y = SAFE_AREA_TOP + 12;
    const row2Y = row1Y + 58;
    const padding = 14;
    const btnHeight = 52;
    const cornerRadius = 12;

    ctx.textAlign = 'center';

    // Score (left, row 1)
    ctx.fillStyle = 'rgba(28, 34, 45, 0.6)';
    this.fillRoundedRect(padding, row1Y, 120, btnHeight, cornerRadius);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('SCORE', padding + 60, row1Y + 17);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${score}`, padding + 60, row1Y + 42);

    // Floor (left, row 2)
    ctx.fillStyle = 'rgba(28, 34, 45, 0.6)';
    this.fillRoundedRect(padding, row2Y, 120, btnHeight, cornerRadius);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('FLOOR', padding + 60, row2Y + 17);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`${floor}`, padding + 60, row2Y + 42);

    // Combo (right of floor, row 2)
    if (combo > 1) {
      ctx.fillStyle = 'rgba(255, 182, 0, 0.15)';
      this.fillRoundedRect(padding + 130, row2Y, 105, btnHeight, cornerRadius);
      ctx.strokeStyle = 'rgba(255, 182, 0, 0.4)';
      ctx.lineWidth = 1.5;
      this.strokeRoundedRect(padding + 130, row2Y, 105, btnHeight, cornerRadius);
      ctx.fillStyle = 'rgba(255, 182, 0, 0.7)';
      ctx.font = 'bold 11px Arial';
      ctx.fillText('COMBO', padding + 130 + 52, row2Y + 17);
      ctx.fillStyle = 'rgba(255, 182, 0, 0.95)';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`x${combo}`, padding + 130 + 52, row2Y + 42);
    }
  }

  drawMuteButton(muted) {
    const ctx = this.ctx;
    const x = GAME_WIDTH - 58;
    const y = SAFE_AREA_TOP + 12 + 58;
    const s = 44;
    const cornerRadius = 12;

    // Background with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + s);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.7)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.7)');
    ctx.fillStyle = gradient;
    this.fillRoundedRect(x, y, s, s, cornerRadius);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    this.strokeRoundedRect(x, y, s, s, cornerRadius);

    // Icon
    ctx.strokeStyle = 'rgba(240, 240, 240, 1)';
    ctx.fillStyle = 'rgba(240, 240, 240, 1)';
    ctx.lineWidth = 2.5;

    const cx = x + s / 2;
    const cy = y + s / 2;

    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 4);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.lineTo(cx + 3, cy - 9);
    ctx.lineTo(cx + 3, cy + 9);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.lineTo(cx - 8, cy + 4);
    ctx.closePath();
    ctx.fill();

    if (muted) {
      ctx.strokeStyle = 'rgba(240, 240, 240, 1)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy - 5);
      ctx.lineTo(cx + 13, cy + 5);
      ctx.moveTo(cx + 13, cy - 5);
      ctx.lineTo(cx + 6, cy + 5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(240, 240, 240, 1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 5, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 10, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }
  }

  drawPerfectFlash() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 205, 0.24)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  drawParticles(particles, cameraY) {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
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
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#D89A2B';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
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
      ctx.font = sp.isPerfect ? 'bold 22px Arial' : 'bold 18px Arial';
      ctx.fillStyle = sp.isPerfect ? '#FFB800' : '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(sp.text, sp.x, sp.y + cameraY);
      ctx.restore();
    }
  }

  drawStartScreen(bestScore) {
    const ctx = this.ctx;

    // Darker overlay
    ctx.fillStyle = 'rgba(14, 18, 24, 0.4)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cardWidth = 360;
    const cardHeight = 320;
    const cardX = (GAME_WIDTH - cardWidth) / 2;
    const cardY = GAME_HEIGHT / 2 - 160;

    // Premium card with gradient border effect
    this.drawPremiumCard(cardX, cardY, cardWidth, cardHeight);

    // Title
    ctx.fillStyle = '#1A2332';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Stack Tower', GAME_WIDTH / 2, cardY + 60);

    // Subtitle
    ctx.fillStyle = '#667EEA';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('STACK TOWER MASTER', GAME_WIDTH / 2, cardY + 78);

    // Decorative line
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, cardY + 95);
    ctx.lineTo(cardX + cardWidth - 40, cardY + 95);
    ctx.stroke();

    // Instructions
    ctx.fillStyle = '#5C6778';
    ctx.font = '16px Arial';
    ctx.fillText('Drop blocks on the tower', GAME_WIDTH / 2, cardY + 135);

    ctx.fillStyle = '#5C6778';
    ctx.font = '14px Arial';
    ctx.fillText('Keep it balanced to reach new heights', GAME_WIDTH / 2, cardY + 155);

    // Best score
    if (bestScore > 0) {
      ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
      this.fillRoundedRect(cardX + 30, cardY + 175, cardWidth - 60, 50, 10);

      ctx.fillStyle = '#667EEA';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('YOUR BEST', GAME_WIDTH / 2, cardY + 192);

      ctx.fillStyle = '#1A2332';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`${bestScore}`, GAME_WIDTH / 2, cardY + 225);
    }

    // Play button
    const btnY = cardY + 270;
    const btnGradient = ctx.createLinearGradient(GAME_WIDTH / 2 - 80, btnY, GAME_WIDTH / 2 - 80, btnY + 48);
    btnGradient.addColorStop(0, '#667EEA');
    btnGradient.addColorStop(1, '#764BA2');
    ctx.fillStyle = btnGradient;
    this.fillRoundedRect(GAME_WIDTH / 2 - 80, btnY, 160, 48, 14);

    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('TAP TO PLAY', GAME_WIDTH / 2, btnY + 33);
  }

  drawGameOver(score, floor, bestScore, isNewRecord) {
    const ctx = this.ctx;

    // Darker overlay
    ctx.fillStyle = 'rgba(14, 18, 24, 0.5)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cardWidth = 360;
    const cardHeight = 380;
    const cardX = (GAME_WIDTH - cardWidth) / 2;
    const cardY = GAME_HEIGHT / 2 - 190;

    // Premium card
    this.drawPremiumCard(cardX, cardY, cardWidth, cardHeight);

    // Title
    ctx.fillStyle = '#1A2332';
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', GAME_WIDTH / 2, cardY + 50);

    // Decorative line
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, cardY + 65);
    ctx.lineTo(cardX + cardWidth - 40, cardY + 65);
    ctx.stroke();

    // Score box with gradient
    const scoreGradient = ctx.createLinearGradient(cardX + 30, cardY + 85, cardX + 30, cardY + 145);
    scoreGradient.addColorStop(0, 'rgba(102, 126, 234, 0.15)');
    scoreGradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
    ctx.fillStyle = scoreGradient;
    this.fillRoundedRect(cardX + 30, cardY + 85, cardWidth - 60, 60, 12);

    ctx.fillStyle = '#667EEA';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('YOUR SCORE', GAME_WIDTH / 2, cardY + 102);

    ctx.fillStyle = '#1A2332';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(`${score}`, GAME_WIDTH / 2, cardY + 140);

    // Stats
    ctx.fillStyle = '#5C6778';
    ctx.font = '14px Arial';
    ctx.fillText(`${floor} floors built`, GAME_WIDTH / 2, cardY + 175);

    // Best score / New record
    if (isNewRecord) {
      ctx.fillStyle = 'rgba(255, 152, 0, 0.15)';
      this.fillRoundedRect(cardX + 30, cardY + 200, cardWidth - 60, 50, 10);

      ctx.fillStyle = '#FF9800';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('NEW RECORD!', GAME_WIDTH / 2, cardY + 217);

      ctx.fillStyle = '#1A2332';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(`${bestScore}`, GAME_WIDTH / 2, cardY + 245);
    } else {
      ctx.fillStyle = '#5C6778';
      ctx.font = '14px Arial';
      ctx.fillText(`Best: ${bestScore}`, GAME_WIDTH / 2, cardY + 220);
    }

    // Retry button
    const btnY = cardY + 290;
    const btnGradient = ctx.createLinearGradient(GAME_WIDTH / 2 - 80, btnY, GAME_WIDTH / 2 - 80, btnY + 48);
    btnGradient.addColorStop(0, '#667EEA');
    btnGradient.addColorStop(1, '#764BA2');
    ctx.fillStyle = btnGradient;
    this.fillRoundedRect(GAME_WIDTH / 2 - 80, btnY, 160, 48, 14);

    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('TAP TO RETRY', GAME_WIDTH / 2, btnY + 33);
  }

  drawPremiumCard(x, y, width, height) {
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = 'rgba(18, 24, 36, 0.35)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.fillRoundedRect(x, y, width, height, 20);
    ctx.restore();

    // Subtle gradient overlay
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.02)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.02)');
    ctx.fillStyle = gradient;
    this.fillRoundedRect(x, y, width, height, 20);

    // Border
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.15)';
    ctx.lineWidth = 1.5;
    this.strokeRoundedRect(x, y, width, height, 20);
  }

  drawOverlayCard(x, y, width, height) {
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = 'rgba(18, 24, 36, 0.28)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    this.fillRoundedRect(x, y, width, height, 18);
    ctx.restore();

    ctx.strokeStyle = 'rgba(28, 36, 49, 0.12)';
    ctx.lineWidth = 1.5;
    this.strokeRoundedRect(x, y, width, height, 18);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    this.fillRoundedRect(x + 12, y + 10, width - 24, 28, 12);
  }

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

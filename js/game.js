import { Block, BLOCK_HEIGHT } from './block.js';
import { Tower, GROUND_Y } from './tower.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';
import { calcOverlap } from './utils.js';

const GAME_WIDTH = 480;
const PERFECT_THRESHOLD = 0.95;

const MILESTONES = [
  { combo: 3, text: 'Nice!', bonus: 5 },
  { combo: 5, text: 'Amazing!', bonus: 10 },
  { combo: 10, text: 'Legendary!', bonus: 20 },
];

const State = {
  READY: 'READY',
  SWINGING: 'SWINGING',
  DROPPING: 'DROPPING',
  LANDED: 'LANDED',
  GAME_OVER: 'GAME_OVER',
};

export class Game {
  constructor(ctx, audio) {
    this.renderer = new Renderer(ctx);
    this.audio = audio;
    this.tower = new Tower();
    this.ai = new AI();
    this.currentBlock = null;
    this.state = State.READY;
    this.score = 0;
    this.combo = 0;
    this.bestScore = parseInt(localStorage.getItem('stackTowerBest') || '0', 10);
    this.isNewRecord = false;
    this.perfectFlashTimer = 0;
    this.skins = [];
    this.activeBlockSkin = null;
    this.landedTimer = 0;
    this.cutoffPiece = null;
    this.particles = [];
    this.milestone = null;
    this.scorePopups = [];
  }

  start() {
    this.state = State.READY;
  }

  handleTap() {
    switch (this.state) {
      case State.READY:
        this.startGame();
        break;
      case State.SWINGING:
        this.dropBlock();
        break;
      case State.GAME_OVER:
        this.startGame();
        break;
    }
  }

  startGame() {
    this.tower.reset();
    this.ai.reset();
    this.score = 0;
    this.combo = 0;
    this.isNewRecord = false;
    this.skins = [];
    this.activeBlockSkin = null;
    this.cutoffPiece = null;
    this.particles = [];
    this.milestone = null;
    this.scorePopups = [];
    this.audio.startBGM();

    const width = this.ai.getBlockWidth();
    const foundationX = (GAME_WIDTH - width) / 2;
    this.tower.addFoundation(foundationX, width);
    this.skins.push(this.ai.generateSkin(0));

    this.spawnNextBlock();
    this.state = State.SWINGING;
  }

  spawnNextBlock() {
    const topBlock = this.tower.getTopBlock();
    const width = topBlock ? topBlock.width : this.ai.getBlockWidth();
    const topY = this.tower.getTopY();
    const ropeLength = this.ai.getRopeLength();
    const blockY = topY - BLOCK_HEIGHT - ropeLength;

    this.activeBlockSkin = this.ai.generateSkin(this.tower.getFloorCount());
    this.currentBlock = new Block(GAME_WIDTH / 2 - width / 2, blockY, width);
    this.currentBlock.startSwing(
      GAME_WIDTH / 2,
      this.ai.getSwingAmplitude(),
      this.ai.getSwingSpeed(),
      ropeLength
    );
  }

  dropBlock() {
    this.currentBlock.drop();
    this.state = State.DROPPING;
  }

  update() {
    this.tower.update();

    if (this.perfectFlashTimer > 0) {
      this.perfectFlashTimer--;
    }

    if (this.cutoffPiece) {
      this.cutoffPiece.velocityY += 0.5;
      this.cutoffPiece.y += this.cutoffPiece.velocityY;
      if (this.cutoffPiece.y > GROUND_Y + 200) {
        this.cutoffPiece = null;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.milestone) {
      this.milestone.y -= 0.8;
      this.milestone.timer--;
      if (this.milestone.timer <= 0) {
        this.milestone = null;
      }
    }

    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      sp.y -= 1.2;
      sp.timer--;
      if (sp.timer <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }

    if (this.state === State.SWINGING || this.state === State.DROPPING) {
      this.currentBlock.update();
    }

    if (this.state === State.DROPPING) {
      this.checkLanding();
    }

    if (this.state === State.LANDED) {
      this.landedTimer--;
      if (this.landedTimer <= 0) {
        this.spawnNextBlock();
        this.state = State.SWINGING;
      }
    }
  }

  checkLanding() {
    const block = this.currentBlock;
    const topY = this.tower.getTopY();

    if (block.y + block.height >= topY) {
      const topBlock = this.tower.getTopBlock();
      const overlap = calcOverlap(
        { x: block.x, width: block.width },
        { x: topBlock.x, width: topBlock.width }
      );

      if (!overlap) {
        this.gameOver();
        return;
      }

      const precision = overlap.overlapWidth / block.width;
      const isPerfect = precision >= PERFECT_THRESHOLD;

      if (isPerfect) {
        this.tower.addBlock(topBlock.x, topBlock.width);
        this.combo++;
        const points = 3 + this.combo;
        this.score += points;
        this.perfectFlashTimer = 10;
        this.spawnSparkles(topBlock.x + topBlock.width / 2, topY);
        this.spawnScorePopup(topBlock.x + topBlock.width / 2, topY, points, true);
        this.audio.play('perfect');
        this.checkMilestone();
      } else {
        const cutWidth = block.width - overlap.overlapWidth;
        const cutSide = block.x < topBlock.x ? 'left' : 'right';

        this.cutoffPiece = {
          x: cutSide === 'left' ? block.x : overlap.overlapX + overlap.overlapWidth,
          y: topY - BLOCK_HEIGHT,
          width: cutWidth,
          height: BLOCK_HEIGHT,
          velocityY: 0,
          skin: this.activeBlockSkin,
        };

        const debrisX = cutSide === 'left' ? block.x + cutWidth / 2 : overlap.overlapX + overlap.overlapWidth + cutWidth / 2;
        this.spawnDebris(debrisX, topY - BLOCK_HEIGHT / 2);

        this.tower.addBlock(overlap.overlapX, overlap.overlapWidth);
        this.combo = 0;
        this.score += 1;
        this.spawnScorePopup(overlap.overlapX + overlap.overlapWidth / 2, topY, 1, false);
        this.audio.play('land');
      }

      this.skins.push(this.activeBlockSkin);
      this.ai.recordLanding(precision, isPerfect);
      this.currentBlock.land(overlap.overlapX, overlap.overlapWidth);
      this.state = State.LANDED;
      this.landedTimer = 15;
    }

    if (block.y > GROUND_Y + 100) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = State.GAME_OVER;
    this.audio.play('gameOver');
    this.audio.stopBGM();
    this.isNewRecord = this.score > this.bestScore;
    if (this.isNewRecord) {
      this.bestScore = this.score;
      localStorage.setItem('stackTowerBest', String(this.bestScore));
    }
  }

  spawnSparkles(x, y) {
    const colors = ['#FFE066', '#FF9F43', '#FFEAA7', '#FDCB6E'];
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 1,
        life: 25 + Math.floor(Math.random() * 15),
        maxLife: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        type: 'sparkle',
      });
    }
  }

  spawnDebris(x, y) {
    const colors = ['#8B7355', '#A0907C', '#6E5E4E'];
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 2,
        life: 20 + Math.floor(Math.random() * 10),
        maxLife: 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
        type: 'debris',
      });
    }
  }

  spawnScorePopup(x, y, points, isPerfect) {
    this.scorePopups.push({
      x,
      y,
      text: `+${points}`,
      timer: 45,
      maxTimer: 45,
      isPerfect,
    });
  }

  checkMilestone() {
    for (const m of MILESTONES) {
      if (this.combo === m.combo) {
        this.score += m.bonus;
        this.audio.play('combo');
        this.milestone = {
          text: m.text,
          y: GROUND_Y - this.tower.blocks.length * BLOCK_HEIGHT + this.tower.cameraY - 30,
          timer: 50,
          maxTimer: 50,
        };
        if (m.combo === 10) {
          const topBlock = this.tower.getTopBlock();
          this.spawnSparkles(topBlock.x + topBlock.width / 2, this.tower.getTopY());
          this.spawnSparkles(topBlock.x + topBlock.width / 2, this.tower.getTopY());
        }
        break;
      }
    }
  }

  render() {
    const cameraY = this.tower.cameraY;
    this.renderer.clear();
    this.renderer.drawBackground(cameraY);
    this.renderer.drawCraneBody();

    if (this.currentBlock && (this.state === State.SWINGING || this.state === State.DROPPING)) {
      const attach = this.currentBlock.getRopeAttachPoint();
      this.renderer.drawRopeAndHook(attach.x, attach.y, cameraY);
      this.renderer.drawBlock(this.currentBlock, cameraY, this.activeBlockSkin);
    }

    for (let i = 0; i < this.tower.blocks.length; i++) {
      const block = this.tower.blocks[i];
      const skin = this.skins[i] || null;
      this.renderer.drawBlock(block, cameraY, skin);
    }

    if (this.tower.blocks.length > 0) {
      this.renderer.drawRooftop(this.tower.getTopBlock(), cameraY);
    }

    if (this.cutoffPiece) {
      this.renderer.drawBlock(this.cutoffPiece, cameraY, this.cutoffPiece.skin);
    }

    if (this.particles.length > 0) {
      this.renderer.drawParticles(this.particles, cameraY);
    }

    if (this.scorePopups.length > 0) {
      this.renderer.drawScorePopups(this.scorePopups, cameraY);
    }

    if (this.state === State.SWINGING || this.state === State.DROPPING || this.state === State.LANDED) {
      this.renderer.drawHUD(this.score, this.combo, this.tower.getFloorCount());
    }

    this.renderer.drawMuteButton(this.audio.muted);

    if (this.milestone) {
      this.renderer.drawMilestoneText(this.milestone);
    }

    if (this.perfectFlashTimer > 0) {
      this.renderer.drawPerfectFlash();
    }

    if (this.state === State.READY) {
      this.renderer.drawStartScreen(this.bestScore);
    }
    if (this.state === State.GAME_OVER) {
      this.renderer.drawGameOver(this.score, this.tower.getFloorCount(), this.bestScore, this.isNewRecord);
    }
  }
}

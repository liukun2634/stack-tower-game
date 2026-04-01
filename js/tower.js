import { BLOCK_HEIGHT } from './block.js';
import { lerp } from './utils.js';

const GROUND_Y = 754; // Bottom of play area (GAME_HEIGHT - 100 for ground)
const CAMERA_SMOOTH = 0.08;

export class Tower {
  constructor() {
    this.blocks = [];
    this.cameraY = 0;
    this.targetCameraY = 0;
  }

  addFoundation(x, width) {
    this.blocks.push({ x, y: GROUND_Y - BLOCK_HEIGHT, width, height: BLOCK_HEIGHT });
  }

  addBlock(x, width) {
    const y = GROUND_Y - (this.blocks.length + 1) * BLOCK_HEIGHT;
    this.blocks.push({ x, y, width, height: BLOCK_HEIGHT });
    this.updateCamera();
  }

  getTopBlock() {
    return this.blocks[this.blocks.length - 1] || null;
  }

  getTopY() {
    if (this.blocks.length === 0) return GROUND_Y;
    return GROUND_Y - this.blocks.length * BLOCK_HEIGHT;
  }

  getFloorCount() {
    return this.blocks.length;
  }

  updateCamera() {
    const scrollThreshold = 340;
    const topY = this.getTopY();
    if (topY < scrollThreshold) {
      this.targetCameraY = scrollThreshold - topY;
    }
  }

  update() {
    this.cameraY = lerp(this.cameraY, this.targetCameraY, CAMERA_SMOOTH);
  }

  reset() {
    this.blocks = [];
    this.cameraY = 0;
    this.targetCameraY = 0;
  }
}

export { GROUND_Y };

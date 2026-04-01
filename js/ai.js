import { clamp, seededRandom } from './utils.js';

const DIFFICULTY = {
  swingSpeed:     { min: 0.02, max: 0.06 },
  swingAmplitude: { min: 80,   max: 200 },
  blockWidth:     { min: 60,   max: 120 },
  ropeLength:     { min: 80,   max: 150 },
};

const WALL_COLORS = [
  '#C4756B', '#D4956B', '#C9A87C', '#B8A88A', // warm (lower)
  '#A0B4C0', '#8FA4B8', '#90A8B0', '#7899A8', // cool (upper)
];

export class AI {
  constructor() {
    this.level = 0;
    this.history = [];
    this.historySize = 5;
  }

  recordLanding(precision, perfect) {
    this.history.push({ precision, perfect });
    if (this.history.length > this.historySize) {
      this.history.shift();
    }
    this.adjustDifficulty();
  }

  adjustDifficulty() {
    if (this.history.length < 2) return;

    const recent = this.history.slice(-3);
    const perfectCount = recent.filter(h => h.perfect).length;
    const avgPrecision = recent.reduce((sum, h) => sum + h.precision, 0) / recent.length;

    if (perfectCount >= 3) {
      this.level = clamp(this.level + 0.08, 0, 1);
    } else if (avgPrecision > 0.7) {
      this.level = clamp(this.level + 0.03, 0, 1);
    } else if (avgPrecision < 0.4) {
      this.level = clamp(this.level - 0.05, 0, 1);
    }
  }

  getSwingSpeed() {
    const { min, max } = DIFFICULTY.swingSpeed;
    return min + (max - min) * this.level;
  }

  getSwingAmplitude() {
    const { min, max } = DIFFICULTY.swingAmplitude;
    return min + (max - min) * this.level;
  }

  getBlockWidth() {
    const { min, max } = DIFFICULTY.blockWidth;
    return max - (max - min) * this.level;
  }

  getRopeLength() {
    const { min, max } = DIFFICULTY.ropeLength;
    return max - (max - min) * this.level * 0.5;
  }

  generateSkin(floorNumber) {
    const seed = floorNumber * 7 + 13;
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + 1);
    const r3 = seededRandom(seed + 2);
    const r4 = seededRandom(seed + 3);

    const colorIndex = floorNumber < 8
      ? Math.floor(r1 * 4)
      : 4 + Math.floor(r1 * 4);
    const wallColor = WALL_COLORS[clamp(colorIndex, 0, WALL_COLORS.length - 1)];

    const windowCount = 1 + Math.floor(r2 * 4);

    const windows = [];
    for (let i = 0; i < windowCount; i++) {
      const litSeed = seededRandom(seed + 10 + i);
      windows.push({ lit: litSeed > 0.4 });
    }

    let decoration = null;
    if (r3 < 0.3) {
      const decorations = ['ac_unit', 'plant', 'awning'];
      decoration = decorations[Math.floor(r4 * decorations.length)];
    }

    const dividerStyles = ['thick', 'thin', 'decorative'];
    const divider = dividerStyles[Math.floor(seededRandom(seed + 20) * 3)];

    const hasDoor = floorNumber === 0;

    return { wallColor, windows, decoration, divider, hasDoor };
  }

  reset() {
    this.level = 0;
    this.history = [];
  }
}

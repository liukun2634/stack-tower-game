export const BLOCK_HEIGHT = 40;
const GRAVITY = 0.5;

export class Block {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = BLOCK_HEIGHT;

    // Swing state
    this.swinging = false;
    this.theta = 0;
    this.swingSpeed = 0.03;
    this.swingAmplitude = 150;
    this.swingCenterX = x;
    this.ropeLength = 120;

    // Drop state
    this.dropping = false;
    this.velocityY = 0;

    // Landed state
    this.landed = false;
  }

  startSwing(centerX, amplitude, speed, ropeLength) {
    this.swinging = true;
    this.swingCenterX = centerX;
    this.swingAmplitude = amplitude;
    this.swingSpeed = speed;
    this.ropeLength = ropeLength;
    this.theta = 0;
  }

  drop() {
    this.swinging = false;
    this.dropping = true;
    this.velocityY = 0;
  }

  land(x, width) {
    this.dropping = false;
    this.landed = true;
    this.x = x;
    this.width = width;
  }

  update() {
    if (this.swinging) {
      this.theta += this.swingSpeed;
      this.x = this.swingCenterX + this.swingAmplitude * Math.sin(this.theta) - this.width / 2;
    }
    if (this.dropping) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;
    }
  }

  getRopeAttachPoint() {
    return { x: this.x + this.width / 2, y: this.y };
  }

  getCraneAnchorPoint() {
    return { x: this.swingCenterX, y: this.y - this.ropeLength };
  }
}

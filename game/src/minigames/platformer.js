import { drawTimerBanner } from '../ui.js';

export class PlatformerMinigame {
  constructor(engine, options) {
    this.engine = engine;
    this.onSuccess = options.onSuccess;
    this.onExit = options.onExit;
    this.timeLeft = options.timeLimit ?? 25;

    this.gravity = 1500;
    this.player = { x: 80, y: 0, w: 18, h: 28, vy: 0, onGround: false };
    this.goal = { x: engine.canvas.width - 120, y: engine.canvas.height - 140, w: 30, h: 60 };

    const h = engine.canvas.height;
    const w = engine.canvas.width;
    // Simple platforms
    this.platforms = [
      { x: 0, y: h - 40, w: w, h: 40 },
      { x: 120, y: h - 160, w: 140, h: 16 },
      { x: 320, y: h - 260, w: 140, h: 16 },
      { x: 520, y: h - 200, w: 140, h: 16 },
      { x: w - 260, y: h - 160, w: 200, h: 16 },
    ];
  }

  onEnter() {}
  onExit() {}

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.onExit?.();
      return;
    }

    const input = this.engine.input;
    const moveLeft = input.isDown('a') || input.isDown('arrowleft');
    const moveRight = input.isDown('d') || input.isDown('arrowright');
    const jumpPressed = input.isDown('w') || input.isDown('arrowup') || input.isDown(' ');

    const speed = 190;
    let vx = 0;
    if (moveLeft) vx -= speed;
    if (moveRight) vx += speed;

    // Horizontal movement
    this.player.x += vx * dt;

    // Gravity
    this.player.vy += this.gravity * dt;
    this.player.y += this.player.vy * dt;
    this.player.onGround = false;

    // Collisions with platforms
    for (const p of this.platforms) {
      // AABB collision
      if (this.player.x < p.x + p.w && this.player.x + this.player.w > p.x && this.player.y < p.y + p.h && this.player.y + this.player.h > p.y) {
        // Resolve along Y primarily
        const prevY = this.player.y - this.player.vy * dt;
        if (prevY + this.player.h <= p.y + 4) {
          this.player.y = p.y - this.player.h;
          this.player.vy = 0;
          this.player.onGround = true;
        } else if (prevY >= p.y + p.h - 4) {
          this.player.y = p.y + p.h;
          this.player.vy = 0;
        } else {
          // Resolve X if penetrating horizontally
          if (vx > 0) this.player.x = p.x - this.player.w;
          if (vx < 0) this.player.x = p.x + p.w;
        }
      }
    }

    // Jump
    if (jumpPressed && this.player.onGround) {
      this.player.vy = -520;
      this.player.onGround = false;
    }

    // Goal check
    if (this.player.x < this.goal.x + this.goal.w && this.player.x + this.player.w > this.goal.x && this.player.y < this.goal.y + this.goal.h && this.player.y + this.player.h > this.goal.y) {
      this.onSuccess?.();
      return;
    }

    // Keep in bounds
    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.w > cw) this.player.x = cw - this.player.w;
    if (this.player.y > ch) { // fell
      this.player.x = 80; this.player.y = 0; this.player.vy = 0;
    }
  }

  render(ctx) {
    // Background gradient
    const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
    g.addColorStop(0,'#0b1b33'); g.addColorStop(1,'#102542');
    ctx.fillStyle = g; ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

    // Platforms
    ctx.fillStyle = '#33415c';
    for (const p of this.platforms) ctx.fillRect(p.x, p.y, p.w, p.h);

    // Goal flag
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);

    // Player
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

    drawTimerBanner(ctx, `Platformer: reach the flag | Time: ${Math.ceil(this.timeLeft)}s`);
  }
}
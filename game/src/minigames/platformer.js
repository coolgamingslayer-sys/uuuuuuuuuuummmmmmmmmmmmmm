import { drawTimerBanner } from '../ui.js';

export class PlatformerMinigame {
  constructor(engine, options) {
    this.engine = engine;
    this.onSuccess = options.onSuccess;
    this.onExit = options.onExit;
    this.timeLeft = options.timeLimit ?? 25;

    this.gravity = 1200;
    this.player = { x: 80, y: 0, w: 18, h: 28, vy: 0, onGround: false };
    this.coyoteTimeLeft = 0;
    this.jumpBufferLeft = 0;
    this.goal = { x: engine.canvas.width - 140, y: engine.canvas.height - 140, w: 30, h: 60 };

    const h = engine.canvas.height;
    const w = engine.canvas.width;
    // Easier, wider platforms
    this.platforms = [
      { x: 0, y: h - 40, w: w, h: 40 },
      { x: 80, y: h - 180, w: 200, h: 16 },
      { x: 320, y: h - 260, w: 200, h: 16 },
      { x: 560, y: h - 200, w: 220, h: 16 },
      { x: w - 320, y: h - 160, w: 260, h: 16 },
    ];
  }

  onEnter() {}
  onExit() {}

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.onExit?.(); return; }

    const input = this.engine.input;
    const moveLeft = input.isDown('a') || input.isDown('arrowleft');
    const moveRight = input.isDown('d') || input.isDown('arrowright');
    const jumpHeld = input.isDown('w') || input.isDown('arrowup') || input.isDown(' ');

    const speed = 220;
    let vx = 0;
    if (moveLeft) vx -= speed;
    if (moveRight) vx += speed;

    // Horizontal
    this.player.x += vx * dt;

    // Gravity
    this.player.vy += this.gravity * dt;
    this.player.y += this.player.vy * dt;
    const wasOnGround = this.player.onGround;
    this.player.onGround = false;

    // Collisions
    for (const p of this.platforms) {
      if (this.player.x < p.x + p.w && this.player.x + this.player.w > p.x && this.player.y < p.y + p.h && this.player.y + this.player.h > p.y) {
        const prevY = this.player.y - this.player.vy * dt;
        if (prevY + this.player.h <= p.y + 4) {
          this.player.y = p.y - this.player.h; this.player.vy = 0; this.player.onGround = true;
        } else if (prevY >= p.y + p.h - 4) {
          this.player.y = p.y + p.h; this.player.vy = 0;
        } else {
          if (vx > 0) this.player.x = p.x - this.player.w;
          if (vx < 0) this.player.x = p.x + p.w;
        }
      }
    }

    // Coyote time and jump buffer
    if (this.player.onGround) this.coyoteTimeLeft = 0.12; else this.coyoteTimeLeft = Math.max(0, this.coyoteTimeLeft - dt);
    if (jumpHeld) this.jumpBufferLeft = 0.12; else this.jumpBufferLeft = Math.max(0, this.jumpBufferLeft - dt);
    if (this.coyoteTimeLeft > 0 && this.jumpBufferLeft > 0) {
      this.player.vy = -600;
      this.player.onGround = false;
      this.coyoteTimeLeft = 0;
      this.jumpBufferLeft = 0;
    }

    // Goal
    if (this.player.x < this.goal.x + this.goal.w && this.player.x + this.player.w > this.goal.x && this.player.y < this.goal.y + this.goal.h && this.player.y + this.player.h > this.goal.y) {
      this.onSuccess?.();
      return;
    }

    // Bounds reset
    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.w > cw) this.player.x = cw - this.player.w;
    if (this.player.y > ch) { this.player.x = 80; this.player.y = 0; this.player.vy = 0; }
  }

  render(ctx) {
    // Background gradient
    const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
    g.addColorStop(0,'#0b1b33'); g.addColorStop(1,'#102542');
    ctx.fillStyle = g; ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

    // Platforms
    ctx.fillStyle = '#33415c';
    for (const p of this.platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Goal flag
    ctx.save();
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);
    ctx.restore();

    // Player + shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(this.player.x + this.player.w/2, this.player.y + this.player.h, this.player.w/1.8, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.restore();

    drawTimerBanner(ctx, `Platformer: reach the flag | Time: ${Math.ceil(this.timeLeft)}s`);
  }
}
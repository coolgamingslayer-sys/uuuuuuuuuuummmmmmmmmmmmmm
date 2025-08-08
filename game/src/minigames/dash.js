import { drawTimerBanner } from '../ui.js';

export class DashMinigame {
  constructor(engine, options) {
    this.engine = engine;
    this.onSuccess = options.onSuccess;
    this.onExit = options.onExit;
    this.timeLeft = options.timeLimit ?? 18;

    this.player = { x: engine.canvas.width/2, y: engine.canvas.height/2, r: 12 };
    this.speed = 260;
    this.pads = this.createPads();
  }

  createPads() {
    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    const margin = 120;
    return [
      { x: margin, y: margin, r: 16, done: false },
      { x: cw - margin, y: margin, r: 16, done: false },
      { x: cw/2, y: ch - margin, r: 16, done: false },
    ];
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.onExit?.(); return; }

    const input = this.engine.input;
    const moveX = (input.isDown('a') || input.isDown('arrowleft') ? -1 : 0) + (input.isDown('d') || input.isDown('arrowright') ? 1 : 0);
    const moveY = (input.isDown('w') || input.isDown('arrowup') ? -1 : 0) + (input.isDown('s') || input.isDown('arrowdown') ? 1 : 0);
    const len = Math.hypot(moveX, moveY) || 1;
    this.player.x += (moveX/len) * this.speed * dt;
    this.player.y += (moveY/len) * this.speed * dt;

    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    this.player.x = Math.max(16, Math.min(cw-16, this.player.x));
    this.player.y = Math.max(16, Math.min(ch-16, this.player.y));

    for (const p of this.pads) {
      if (!p.done && Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.r + this.player.r) {
        p.done = true;
      }
    }

    if (this.pads.every(p => p.done)) { this.onSuccess?.(); return; }
  }

  render(ctx) {
    ctx.fillStyle = '#0d1224';
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

    // Pads
    for (const p of this.pads) {
      ctx.fillStyle = p.done ? 'rgba(167,139,250,0.4)' : '#a78bfa';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Player
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI*2); ctx.fill();

    const remaining = this.pads.filter(p => !p.done).length;
    drawTimerBanner(ctx, `Dash: touch all pads (${remaining} left) | Time: ${Math.ceil(this.timeLeft)}s`);
  }
}
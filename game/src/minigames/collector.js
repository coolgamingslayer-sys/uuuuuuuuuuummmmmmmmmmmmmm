import { drawTimerBanner } from '../ui.js';

export class CollectorMinigame {
  constructor(engine, options) {
    this.engine = engine;
    this.onSuccess = options.onSuccess;
    this.onExit = options.onExit;
    this.timeLeft = options.timeLimit ?? 20;

    this.player = { x: engine.canvas.width/2, y: engine.canvas.height/2, r: 12 };
    this.speed = 220;

    this.targetsNeeded = 6;
    this.targets = [];
    this.spawnTargets();
  }

  spawnTargets() {
    this.targets = [];
    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    for (let i = 0; i < this.targetsNeeded; i++) {
      const x = 40 + Math.random() * (cw - 80);
      const y = 40 + Math.random() * (ch - 80);
      this.targets.push({ x, y, r: 10, collected: false });
    }
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
    const moveX = (input.isDown('a') || input.isDown('arrowleft') ? -1 : 0) + (input.isDown('d') || input.isDown('arrowright') ? 1 : 0);
    const moveY = (input.isDown('w') || input.isDown('arrowup') ? -1 : 0) + (input.isDown('s') || input.isDown('arrowdown') ? 1 : 0);
    const len = Math.hypot(moveX, moveY) || 1;
    this.player.x += (moveX/len) * this.speed * dt;
    this.player.y += (moveY/len) * this.speed * dt;

    // Bounds
    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    this.player.x = Math.max(16, Math.min(cw-16, this.player.x));
    this.player.y = Math.max(16, Math.min(ch-16, this.player.y));

    // Collect
    for (const t of this.targets) {
      if (!t.collected && Math.hypot(t.x - this.player.x, t.y - this.player.y) < t.r + this.player.r) {
        t.collected = true;
      }
    }

    if (this.targets.every(t => t.collected)) {
      this.onSuccess?.();
      return;
    }
  }

  render(ctx) {
    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

    // Targets
    for (const t of this.targets) {
      ctx.fillStyle = t.collected ? 'rgba(6,214,160,0.4)' : '#06d6a0';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill();
    }

    // Player
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI*2); ctx.fill();

    const remaining = this.targets.filter(t => !t.collected).length;
    drawTimerBanner(ctx, `Collector: gather all orbs (${remaining} left) | Time: ${Math.ceil(this.timeLeft)}s`);
  }
}
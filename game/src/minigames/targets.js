import { drawTimerBanner } from '../ui.js';

export class TargetsMinigame {
  constructor(engine, options) {
    this.engine = engine;
    this.onSuccess = options.onSuccess;
    this.onExit = options.onExit;
    this.timeLeft = options.timeLimit ?? 20;

    this.targets = [];
    this.spawnTargets(7);
    this.prevMouseDown = false;
  }

  spawnTargets(n) {
    const cw = this.engine.canvas.width;
    const ch = this.engine.canvas.height;
    this.targets = [];
    for (let i = 0; i < n; i++) {
      const x = 60 + Math.random() * (cw - 120);
      const y = 80 + Math.random() * (ch - 160);
      this.targets.push({ x, y, r: 16, alive: true });
    }
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.onExit?.(); return; }

    const { mouse } = this.engine.input;
    const justClicked = mouse.down && !this.prevMouseDown;

    if (justClicked) {
      for (const t of this.targets) {
        if (t.alive && Math.hypot(mouse.x - t.x, mouse.y - t.y) < t.r + 2) {
          t.alive = false;
          break;
        }
      }
    }

    if (this.targets.every(t => !t.alive)) { this.onSuccess?.(); return; }

    this.prevMouseDown = mouse.down;
  }

  render(ctx) {
    // Background
    ctx.fillStyle = '#0f1526';
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

    // Targets
    for (const t of this.targets) {
      if (!t.alive) continue;
      const g = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, t.r);
      g.addColorStop(0,'#ffd166'); g.addColorStop(1,'#f7a400');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Cursor crosshair
    const { x, y } = this.engine.input.mouse;
    ctx.save();
    ctx.strokeStyle = 'rgba(230,232,239,0.8)';
    ctx.beginPath(); ctx.moveTo(x-10,y); ctx.lineTo(x+10,y); ctx.moveTo(x,y-10); ctx.lineTo(x,y+10); ctx.stroke();
    ctx.restore();

    const remaining = this.targets.filter(t => t.alive).length;
    drawTimerBanner(ctx, `Targets: click ${remaining} more | Time: ${Math.ceil(this.timeLeft)}s`);
  }
}
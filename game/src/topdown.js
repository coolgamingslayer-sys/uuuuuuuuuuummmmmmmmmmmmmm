import { Random } from './engine.js';
import { renderHud } from './ui.js';

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

class Bullet {
  constructor(x, y, dx, dy, speed, damage) {
    this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.speed = speed; this.damage = damage;
    this.radius = 4;
    this.life = 1.5;
  }
  update(dt) {
    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    this.life -= dt;
  }
  render(ctx) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
  }
}

class Enemy {
  constructor(rng, x, y) {
    this.x = x; this.y = y; this.radius = 14;
    this.speed = rng.range(60, 90);
    this.health = 3;
  }
  update(dt, player) {
    const vx = player.x - this.x;
    const vy = player.y - this.y;
    const len = Math.hypot(vx, vy) || 1;
    this.x += (vx/len) * this.speed * dt;
    this.y += (vy/len) * this.speed * dt;
  }
  render(ctx) {
    ctx.fillStyle = '#ef476f';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2; ctx.stroke();
  }
}

class Portal {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type; this.radius = 18; this.t = 0;
  }
  render(ctx) {
    const colorMap = {
      platformer: '#118ab2',
      collector: '#06d6a0',
      targets: '#ffd166',
      dash: '#a78bfa'
    };
    const labelMap = {
      platformer: 'Platformer',
      collector: 'Collector',
      targets: 'Targets',
      dash: 'Dash'
    };
    const color = colorMap[this.type] || '#8ecae6';
    this.t += 0.016;
    const pulse = this.radius + Math.sin(this.t * 3) * 2;

    // Outer ring
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(this.x, this.y, pulse, 0, Math.PI*2); ctx.stroke();

    // Rotating arcs
    ctx.lineWidth = 3;
    const segments = 3;
    for (let i = 0; i < segments; i++) {
      const a0 = this.t * 1.5 + (i * Math.PI * 2) / segments;
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulse + 6, a0, a0 + Math.PI / 4);
      ctx.stroke();
    }

    // Label
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6e8ef';
    ctx.fillText(labelMap[this.type] || this.type, this.x, this.y + pulse + 18);
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = life; this.color = color;
    this.maxLife = life;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 20 * dt; this.life -= dt; }
  render(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = `${this.color}${Math.floor(a * 255).toString(16).padStart(2,'0')}`;
    ctx.beginPath(); ctx.arc(this.x, this.y, 2 + 2*a, 0, Math.PI*2); ctx.fill();
  }
}

export class UpgradeSet {
  constructor() {
    this.moveSpeed = 160;
    this.fireCooldown = 0.22;
    this.bulletDamage = 1;
    this.maxHealth = 6;
  }
}

export class Player {
  constructor(x, y, upgrades) {
    this.x = x; this.y = y; this.radius = 12;
    this.health = upgrades.maxHealth;
    this.upgrades = upgrades;
    this.angle = 0;
    this.cooldown = 0;
  }
}

export class TopDownScene {
  constructor(engine, createMinigame) {
    this.engine = engine;
    this.createMinigame = createMinigame;
    this.rng = new Random();

    this.worldWidth = engine.canvas.width;
    this.worldHeight = engine.canvas.height;

    this.upgrades = new UpgradeSet();
    this.player = new Player(this.worldWidth/2, this.worldHeight/2, this.upgrades);

    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.score = 0;

    const margin = 90;
    this.portals = [
      new Portal(margin, margin, 'platformer'),
      new Portal(this.worldWidth - margin, margin, 'collector'),
      new Portal(margin, this.worldHeight - margin, 'targets'),
      new Portal(this.worldWidth - margin, this.worldHeight - margin, 'dash'),
    ];
  }

  onEnter() {}
  onExit() {}

  applyRandomUpgrade() {
    const choices = [
      { name: 'Move Speed +20', apply: () => this.upgrades.moveSpeed += 20 },
      { name: 'Fire Rate +15%', apply: () => this.upgrades.fireCooldown = Math.max(0.08, this.upgrades.fireCooldown * 0.85) },
      { name: 'Bullet Damage +1', apply: () => this.upgrades.bulletDamage += 1 },
      { name: 'Max Health +2', apply: () => { this.upgrades.maxHealth += 2; this.player.health += 2; } },
    ];
    const picked = this.rng.pick(choices);
    picked.apply();
    this.lastUpgradeText = picked.name;
    this.lastUpgradeTimer = 3;
  }

  update(dt) {
    const input = this.engine.input;
    const moveX = (input.isDown('a') || input.isDown('arrowleft') ? -1 : 0) + (input.isDown('d') || input.isDown('arrowright') ? 1 : 0);
    const moveY = (input.isDown('w') || input.isDown('arrowup') ? -1 : 0) + (input.isDown('s') || input.isDown('arrowdown') ? 1 : 0);
    let len = Math.hypot(moveX, moveY) || 1;
    const speed = this.upgrades.moveSpeed;
    this.player.x = clamp(this.player.x + (moveX/len) * speed * dt, 0, this.worldWidth);
    this.player.y = clamp(this.player.y + (moveY/len) * speed * dt, 0, this.worldHeight);

    // Aim towards mouse
    const dx = this.engine.input.mouse.x - this.player.x;
    const dy = this.engine.input.mouse.y - this.player.y;
    this.player.angle = Math.atan2(dy, dx);

    // Shooting
    this.player.cooldown -= dt;
    const shooting = this.engine.input.mouse.down || input.isDown(' ');
    if (shooting && this.player.cooldown <= 0) {
      const dirX = Math.cos(this.player.angle);
      const dirY = Math.sin(this.player.angle);
      this.bullets.push(new Bullet(this.player.x + dirX * 16, this.player.y + dirY * 16, dirX, dirY, 440, this.upgrades.bulletDamage));
      this.player.cooldown = this.upgrades.fireCooldown;
    }

    // Enemies
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.4, 1.5 - this.score * 0.01);
      const edge = Math.floor(this.rng.range(0, 4));
      let x = 0, y = 0;
      if (edge === 0) { x = 0; y = this.rng.range(0, this.worldHeight); }
      if (edge === 1) { x = this.worldWidth; y = this.rng.range(0, this.worldHeight); }
      if (edge === 2) { y = 0; x = this.rng.range(0, this.worldWidth); }
      if (edge === 3) { y = this.worldHeight; x = this.rng.range(0, this.worldWidth); }
      this.enemies.push(new Enemy(this.rng, x, y));
    }

    for (const e of this.enemies) e.update(dt, this.player);
    for (const b of this.bullets) b.update(dt);
    for (const p of this.particles) p.update(dt);

    // Collisions: bullets vs enemies
    for (const e of this.enemies) {
      for (const b of this.bullets) {
        if (b.life > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
          e.health -= b.damage;
          b.life = 0;
        }
      }
    }
    const survivors = [];
    for (const e of this.enemies) {
      if (e.health <= 0) {
        this.score += 1;
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 60 + Math.random() * 120;
          this.particles.push(new Particle(e.x, e.y, Math.cos(a)*s, Math.sin(a)*s, 0.6, '#ef476f'));
        }
      } else survivors.push(e);
    }
    this.enemies = survivors;

    // Collisions: enemies vs player
    for (const e of this.enemies) {
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + this.player.radius) {
        this.player.health -= 1 * dt; // contact damage over time
      }
    }

    // Clean up
    this.bullets = this.bullets.filter(b => b.life > 0 && b.x>-32 && b.y>-32 && b.x<this.worldWidth+32 && b.y<this.worldHeight+32);
    this.particles = this.particles.filter(p => p.life > 0);

    // Portals interaction
    for (const p of this.portals) {
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.radius + this.player.radius) {
        const minigame = this.createMinigame(p.type, {
          onSuccess: () => { this.applyRandomUpgrade(); this.returnFromMinigame(); },
          onExit: () => { this.returnFromMinigame(); },
          timeLimit: 25,
        });
        this.engine.sceneManager.setScene(minigame);
        return;
      }
    }

    if (this.player.health <= 0) {
      // Reset run
      this.upgrades = new UpgradeSet();
      this.player = new Player(this.worldWidth/2, this.worldHeight/2, this.upgrades);
      this.enemies = [];
      this.bullets = [];
      this.particles = [];
      this.score = 0;
    }

    if (this.lastUpgradeTimer !== undefined) {
      this.lastUpgradeTimer -= dt;
      if (this.lastUpgradeTimer <= 0) {
        this.lastUpgradeTimer = undefined;
        this.lastUpgradeText = undefined;
      }
    }

    renderHud([
      `HP: ${this.player.health.toFixed(0)} / ${this.upgrades.maxHealth}`,
      `Score: ${this.score}`,
      `Upgrades: SPD ${this.upgrades.moveSpeed}| FR ${(1/this.upgrades.fireCooldown).toFixed(1)}/s | DMG ${this.upgrades.bulletDamage}`
    ]);
  }

  returnFromMinigame() {
    renderHud([
      `HP: ${this.player.health.toFixed(0)} / ${this.upgrades.maxHealth}`,
      `Score: ${this.score}`,
      `Upgrades: SPD ${this.upgrades.moveSpeed}| FR ${(1/this.upgrades.fireCooldown).toFixed(1)}/s | DMG ${this.upgrades.bulletDamage}`
    ]);
  }

  render(ctx) {
    // Background gradient + grid
    const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
    g.addColorStop(0,'#0d1224'); g.addColorStop(1,'#0b0e18');
    ctx.fillStyle = g; ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const grid = 48;
    for (let x = (ctx.canvas.width%grid); x < ctx.canvas.width; x += grid) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke();
    }
    for (let y = (ctx.canvas.height%grid); y < ctx.canvas.height; y += grid) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(ctx.canvas.width, y); ctx.stroke();
    }
    ctx.restore();

    // Portals
    for (const p of this.portals) p.render(ctx);

    // Player
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // Bullets
    for (const b of this.bullets) b.render(ctx);

    // Enemies
    for (const e of this.enemies) e.render(ctx);

    // Particles
    for (const p of this.particles) p.render(ctx);

    // Upgrade popup
    if (this.lastUpgradeText) {
      ctx.save();
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#06d6a0';
      ctx.fillText(`+ ${this.lastUpgradeText}!`, ctx.canvas.width/2, ctx.canvas.height - 40);
      ctx.restore();
    }
  }
}
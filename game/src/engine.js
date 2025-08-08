// Lightweight engine utilities

export class Random {
  constructor(seed = Date.now() % 2147483647) {
    this.seed = seed;
  }
  next() {
    // Park-Miller LCG
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed;
  }
  nextFloat() {
    return (this.next() - 1) / 2147483646;
  }
  range(min, max) {
    return min + this.nextFloat() * (max - min);
  }
  pick(array) {
    return array[(this.next() % array.length + array.length) % array.length];
  }
}

export class InputManager {
  constructor(canvas) {
    this.keysDown = new Set();
    this.mouse = { x: 0, y: 0, down: false };
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(e.key)) e.preventDefault();
      this.keysDown.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', () => {
      this.mouse.down = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
  }
  isDown(key) {
    return this.keysDown.has(key.toLowerCase());
  }
}

export class SceneManager {
  constructor() {
    this.current = null;
  }
  setScene(scene) {
    if (this.current && this.current.onExit) this.current.onExit();
    this.current = scene;
    if (this.current && this.current.onEnter) this.current.onEnter();
  }
  update(dt) {
    if (this.current && this.current.update) this.current.update(dt);
  }
  render(ctx) {
    if (this.current && this.current.render) this.current.render(ctx);
  }
}

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sceneManager = new SceneManager();
    this.input = new InputManager(canvas);
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
  }

  start() {
    const loop = (t) => {
      const now = t / 1000;
      const dt = Math.min(0.1, now - this.lastTime || 0);
      this.lastTime = now;

      try {
        this.accumulator += dt;
        while (this.accumulator >= this.fixedStep) {
          this.sceneManager.update(this.fixedStep);
          this.accumulator -= this.fixedStep;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sceneManager.render(this.ctx);
      } catch (err) {
        // Keep the loop alive; log for debugging
        console.error('Game loop error:', err);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
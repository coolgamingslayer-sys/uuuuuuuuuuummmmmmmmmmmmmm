(() => {
  'use strict';

  // Canvas setup with DPR scaling
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resizeCanvas() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Utility
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const randRange = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(randRange(min, max + 1));

  // Color blending utility (hex -> hex)
  function blendHexColors(hexA, hexB, t) {
    const pa = parseInt(hexA.slice(1), 16);
    const pb = parseInt(hexB.slice(1), 16);
    const r1 = (pa >> 16) & 255, g1 = (pa >> 8) & 255, b1 = pa & 255;
    const r2 = (pb >> 16) & 255, g2 = (pb >> 8) & 255, b2 = pb & 255;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Simple SFX via WebAudio
  let audioCtx = null;
  function playSfx(type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      let f = 440, dur = 0.08, typeWave = 'sine', vol = 0.08;
      if (type === 'coin') { f = 880; dur = 0.06; typeWave = 'square'; vol = 0.06; }
      if (type === 'boost') { f = 220; dur = 0.16; typeWave = 'sawtooth'; vol = 0.08; }
      if (type === 'hit') { f = 120; dur = 0.12; typeWave = 'triangle'; vol = 0.08; }
      if (type === 'revive') { f = 520; dur = 0.18; typeWave = 'sine'; vol = 0.1; }
      if (type === 'slowmo') { f = 300; dur = 0.2; typeWave = 'triangle'; vol = 0.07; }
      o.type = typeWave;
      o.frequency.value = f;
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur);
    } catch {}
  }

  // Pixel-art sprite generation (16x16) for a running character
  function createPixelManFrames() {
    const SIZE = 16;

    function makeCanvas() {
      const c = document.createElement('canvas');
      c.width = SIZE;
      c.height = SIZE;
      return c;
    }

    function clear(ctx) {
      ctx.clearRect(0, 0, SIZE, SIZE);
    }

    function drawIdle(ctx) {
      clear(ctx);
      const skin = '#ffd7b8';
      const shirt = '#3fa1ff';
      const pants = '#2b3b52';
      const shoe = '#1a2330';
      const outline = '#0b0f16';

      // Head (4x4)
      ctx.fillStyle = outline; ctx.fillRect(5, 0, 6, 1);
      ctx.fillRect(4, 1, 1, 3); ctx.fillRect(11, 1, 1, 3);
      ctx.fillRect(5, 4, 6, 1);
      ctx.fillStyle = skin; ctx.fillRect(5, 1, 6, 3);

      // Torso
      ctx.fillStyle = outline; ctx.fillRect(4, 5, 8, 1);
      ctx.fillRect(3, 6, 1, 5); ctx.fillRect(12, 6, 1, 5);
      ctx.fillRect(4, 11, 8, 1);
      ctx.fillStyle = shirt; ctx.fillRect(4, 6, 8, 5);

      // Arms hanging
      ctx.fillStyle = outline; ctx.fillRect(2, 6, 1, 4); ctx.fillRect(13, 6, 1, 4);
      ctx.fillStyle = shirt; ctx.fillRect(3, 7, 1, 3); ctx.fillRect(12, 7, 1, 3);

      // Legs
      ctx.fillStyle = outline; ctx.fillRect(5, 12, 2, 1); ctx.fillRect(9, 12, 2, 1);
      ctx.fillRect(5, 13, 1, 3); ctx.fillRect(10, 13, 1, 3);
      ctx.fillStyle = pants; ctx.fillRect(6, 12, 1, 3); ctx.fillRect(9, 12, 1, 3);

      // Shoes
      ctx.fillStyle = shoe; ctx.fillRect(4, 15, 3, 1); ctx.fillRect(9, 15, 3, 1);
    }

    function drawJump(ctx) {
      clear(ctx);
      const skin = '#ffd7b8';
      const shirt = '#3fa1ff';
      const pants = '#2b3b52';
      const shoe = '#1a2330';
      const outline = '#0b0f16';

      // Head
      ctx.fillStyle = outline; ctx.fillRect(5, 0, 6, 1);
      ctx.fillRect(4, 1, 1, 3); ctx.fillRect(11, 1, 1, 3);
      ctx.fillRect(5, 4, 6, 1);
      ctx.fillStyle = skin; ctx.fillRect(5, 1, 6, 3);

      // Torso leaned slightly
      ctx.fillStyle = outline; ctx.fillRect(4, 5, 8, 1);
      ctx.fillRect(3, 6, 1, 5); ctx.fillRect(12, 5, 1, 6);
      ctx.fillRect(4, 11, 8, 1);
      ctx.fillStyle = shirt; ctx.fillRect(4, 6, 8, 5);

      // Arms forward/back
      ctx.fillStyle = outline; ctx.fillRect(2, 6, 1, 3); ctx.fillRect(13, 7, 1, 3);
      ctx.fillStyle = shirt; ctx.fillRect(3, 7, 1, 2); ctx.fillRect(12, 8, 1, 2);

      // Legs tucked
      ctx.fillStyle = outline; ctx.fillRect(5, 12, 2, 1); ctx.fillRect(9, 12, 2, 1);
      ctx.fillRect(6, 11, 1, 2); ctx.fillRect(9, 11, 1, 2);
      ctx.fillStyle = pants; ctx.fillRect(6, 12, 1, 2); ctx.fillRect(9, 12, 1, 2);
      ctx.fillStyle = shoe; ctx.fillRect(4, 14, 3, 1); ctx.fillRect(9, 14, 3, 1);
    }

    function drawRun(ctx, phase) {
      clear(ctx);
      const skin = '#ffd7b8';
      const shirt = '#3fa1ff';
      const pants = '#2b3b52';
      const shoe = '#1a2330';
      const outline = '#0b0f16';

      // Head
      ctx.fillStyle = outline; ctx.fillRect(5, 0, 6, 1);
      ctx.fillRect(4, 1, 1, 3); ctx.fillRect(11, 1, 1, 3);
      ctx.fillRect(5, 4, 6, 1);
      ctx.fillStyle = skin; ctx.fillRect(5, 1, 6, 3);

      // Torso
      ctx.fillStyle = outline; ctx.fillRect(4, 5, 8, 1);
      ctx.fillRect(3, 6, 1, 5); ctx.fillRect(12, 6, 1, 5);
      ctx.fillRect(4, 11, 8, 1);
      ctx.fillStyle = shirt; ctx.fillRect(4, 6, 8, 5);

      // Arms swing (simple alternating)
      if (phase % 2 === 0) {
        ctx.fillStyle = outline; ctx.fillRect(2, 6, 1, 4); ctx.fillRect(13, 7, 1, 4);
        ctx.fillStyle = shirt; ctx.fillRect(3, 7, 1, 3); ctx.fillRect(12, 8, 1, 3);
      } else {
        ctx.fillStyle = outline; ctx.fillRect(2, 7, 1, 4); ctx.fillRect(13, 6, 1, 4);
        ctx.fillStyle = shirt; ctx.fillRect(3, 8, 1, 3); ctx.fillRect(12, 7, 1, 3);
      }

      // Legs run cycle (6 phases)
      // Define offsets for a crude run cycle
      const patterns = [
        // phase 0: left forward, right back
        { lf: { x: 4, y: 12 }, lb: { x: 5, y: 13 }, rf: { x: 10, y: 13 }, rb: { x: 11, y: 12 } },
        // 1: crossover
        { lf: { x: 5, y: 12 }, lb: { x: 6, y: 13 }, rf: { x: 9, y: 13 }, rb: { x: 10, y: 12 } },
        // 2: feet under body
        { lf: { x: 6, y: 12 }, lb: { x: 6, y: 13 }, rf: { x: 9, y: 12 }, rb: { x: 9, y: 13 } },
        // 3: right forward, left back
        { lf: { x: 10, y: 13 }, lb: { x: 11, y: 12 }, rf: { x: 4, y: 12 }, rb: { x: 5, y: 13 } },
        // 4: crossover
        { lf: { x: 9, y: 13 }, lb: { x: 10, y: 12 }, rf: { x: 5, y: 12 }, rb: { x: 6, y: 13 } },
        // 5: feet under body
        { lf: { x: 9, y: 12 }, lb: { x: 9, y: 13 }, rf: { x: 6, y: 12 }, rb: { x: 6, y: 13 } },
      ];
      const pat = patterns[phase % patterns.length];

      // Draw legs with outlines
      ctx.fillStyle = outline;
      ctx.fillRect(pat.lf.x, pat.lf.y, 2, 1); // left foot leading
      ctx.fillRect(pat.lb.x, pat.lb.y, 1, 3); // left back segment
      ctx.fillRect(pat.rf.x, pat.rf.y, 1, 3); // right front segment
      ctx.fillRect(pat.rb.x, pat.rb.y, 2, 1); // right foot trailing

      ctx.fillStyle = pants;
      ctx.fillRect(pat.lf.x + 1, pat.lf.y, 1, 2);
      ctx.fillRect(pat.lb.x, pat.lb.y, 1, 2);
      ctx.fillRect(pat.rf.x, pat.rf.y, 1, 2);
      ctx.fillRect(pat.rb.x, pat.rb.y, 1, 2);

      ctx.fillStyle = shoe;
      ctx.fillRect(pat.lf.x - 1, pat.lf.y + 1, 3, 1);
      ctx.fillRect(pat.rb.x - 1, pat.rb.y + 1, 3, 1);
    }

    // Build frames
    const idleCanvas = makeCanvas(); drawIdle(idleCanvas.getContext('2d'));
    const jumpCanvas = makeCanvas(); drawJump(jumpCanvas.getContext('2d'));

    const runFrames = [];
    for (let i = 0; i < 6; i++) {
      const c = makeCanvas();
      drawRun(c.getContext('2d'), i);
      runFrames.push(c);
    }

    return {
      size: SIZE,
      idle: [idleCanvas],
      jump: [jumpCanvas],
      run: runFrames,
    };
  }

  // Input handling
  const input = {
    left: false,
    right: false,
    up: false,
    jumpPressed: false,
  };
  const keyMap = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'up',
    KeyW: 'up',
    Space: 'up',
    ShiftLeft: 'dash',
    ShiftRight: 'dash',
    KeyE: 'dash',
    KeyU: 'upgradeMenu',
  };
  window.addEventListener('keydown', (e) => {
    const k = keyMap[e.code];
    if (k) {
      if (k === 'upgradeMenu') {
        isUpgradeMenuOpen = !isUpgradeMenuOpen;
        e.preventDefault();
      } else {
        input[k] = true;
        if (k === 'up') input.jumpPressed = true;
        if (k === 'dash') input.dashPressed = true;
        e.preventDefault();
      }
    }
    if (e.code === 'KeyR') {
      if (gameOver) restart();
    }
  }, { passive: false });
  window.addEventListener('keyup', (e) => {
    const k = keyMap[e.code];
    if (k && k !== 'upgradeMenu') input[k] = false;
  });

  // Mouse for upgrades menu
  let mouse = { x: 0, y: 0, down: false, clicked: false };
  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
  });
  canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    mouse.clicked = true;
  });
  canvas.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  // Game constants
  const GRAVITY = 2000; // px/s^2
  const PLAYER = {
    width: 42,
    height: 60,
    runAccel: 2600,
    runDecel: 2800,
    maxRunSpeed: 520,
    jumpVelocity: 820,
    coyoteTime: 0.12,
    jumpBufferTime: 0.12,
  };
  const CHASER = {
    startOffset: -420, // starts this far behind player.x
    baseSpeed: 160,    // px/s
    accel: 12,         // px/s per 10s (we will scale by dt)
    maxSpeed: 520,
  };

  // Upgrade system
  const UPGRADE_DEFS = {
    speed: {
      name: 'Speed Shoes',
      baseCost: 10,
      apply() {
        stats.maxRunSpeed += 80;
        stats.runAccel += 600;
        chaserSpeedBonus += 40;
        chaserMaxBonus += 40;
        upgrades.speedLevel += 1;
      },
      canBuy() { return true; },
      currentCost() { return this.baseCost + upgrades.speedLevel * 6; },
      desc: '+Run speed'
    },
    jump: {
      name: 'High Jump',
      baseCost: 12,
      apply() {
        stats.jumpVelocity += 140;
        chaserSpeedBonus += 40;
        chaserMaxBonus += 40;
        upgrades.jumpLevel += 1;
      },
      canBuy() { return true; },
      currentCost() { return this.baseCost + upgrades.jumpLevel * 6; },
      desc: '+Jump height'
    },
    double: {
      name: 'Double Jump',
      baseCost: 15,
      apply() {
        upgrades.doubleJump = true;
        player.remainingAirJumps = 1;
        chaserSpeedBonus += 50;
        chaserMaxBonus += 50;
      },
      canBuy() { return !upgrades.doubleJump; },
      currentCost() { return this.baseCost; },
      desc: 'Mid-air jump'
    },
    magnet: {
      name: 'Coin Magnet',
      baseCost: 10,
      apply() { upgrades.magnetRadius += 40; },
      canBuy() { return upgrades.magnetRadius < 200; },
      currentCost() { return this.baseCost + Math.floor(upgrades.magnetRadius / 40) * 6; },
      desc: 'Collect coins from afar'
    },
    glide: {
      name: 'Glide',
      baseCost: 14,
      apply() { upgrades.glide = true; },
      canBuy() { return !upgrades.glide; },
      currentCost() { return this.baseCost; },
      desc: 'Hold jump to fall slower'
    },
    dash: {
      name: 'Dash',
      baseCost: 16,
      apply() { upgrades.dash = true; },
      canBuy() { return !upgrades.dash; },
      currentCost() { return this.baseCost; },
      desc: 'Shift/E to burst forward'
    },
    coinValue: {
      name: 'Gold Rush',
      baseCost: 10,
      apply() { upgrades.coinValue += 1; },
      canBuy() { return upgrades.coinValue < 5; },
      currentCost() { return this.baseCost + (upgrades.coinValue - 1) * 8; },
      desc: 'Coins worth +1 each'
    },
    stamina: {
      name: 'Stamina',
      baseCost: 12,
      apply() { stats.runDecel = Math.max(1200, stats.runDecel * 0.9); upgrades.staminaLevel += 1; },
      canBuy() { return upgrades.staminaLevel < 5; },
      currentCost() { return this.baseCost + upgrades.staminaLevel * 6; },
      desc: '-Deceleration (keep speed)'
    },
    platBoost: {
      name: 'Platform Boost',
      baseCost: 12,
      apply() { upgrades.platBoostLevel += 1; },
      canBuy() { return upgrades.platBoostLevel < 3; },
      currentCost() { return this.baseCost + upgrades.platBoostLevel * 8; },
      desc: 'Speed burst on fresh steps'
    },
    secondLife: {
      name: 'Second Life',
      baseCost: 20,
      apply() { upgrades.extraLives += 1; },
      canBuy() { return upgrades.extraLives < 3; },
      currentCost() { return this.baseCost + upgrades.extraLives * 10; },
      desc: 'Revive when you fall'
    },
  };

  // World state
  let player, platforms, cameraX, chaserX, chaserSpeed, score, bestScore, timeAlive, gameOver, deathReason;
  let spriteFrames = null;
  let facing = 1; // 1 = right, -1 = left
  let animTimer = 0;
  let runFrameIndex = 0;
  let coins = 0;
  let coinsCollectedThisRun = 0;
  let coinsArray = [];
  let upgrades = { speedLevel: 0, jumpLevel: 0, doubleJump: false };
  let stats = { ...PLAYER };
  let chaserSpeedBonus = 0;
  let chaserMaxBonus = 0;
  let isUpgradeMenuOpen = false;
  let lastUpgradeLayout = [];
  let distanceTraveled = 0;
  let lastSafeSnapshot = null; // { x, y, chaserX }
  // Menu & modes
  let gamePhase = 'menu'; // 'menu' | 'playing' | 'levelComplete'
  let gameMode = 'endless'; // 'endless' | 'levels'
  const settings = {
    difficulty: 'normal', // 'easy' | 'normal' | 'hard'
    toggles: {
      movingPlatforms: true,
      crumblingPlatforms: true,
      boosterRings: true,
      hazards: true,
      slowMoShards: true,
      coins: true,
    },
  };
  let menuButtons = [];
  let levelButtons = [];
  const levels = [
    { name: 'Level 1', distance: 800 },
    { name: 'Level 2', distance: 1400 },
    { name: 'Level 3', distance: 2200 },
    { name: 'Level 4', distance: 3200 },
    { name: 'Level 5', distance: 4500 },
  ];
  let currentLevelIndex = 0;
  let currentLevelTarget = levels[0].distance;
  // Difficulty modifiers and generation rates
  let diffSpeedMul = 1, diffAccelMul = 1, diffMaxMul = 1, gapMul = 1;
  const gen = {
    coinRate: 0.5,
    movingRate: 0.18,
    boosterRate: 0.22,
    hazardRate: 0.25,
    slowRate: 0.14,
    crumbleChanceOnStep: 0.4,
  };
  function applyDifficulty() {
    const d = settings.difficulty;
    if (d === 'easy') {
      diffSpeedMul = 0.85; diffAccelMul = 0.9; diffMaxMul = 0.95; gapMul = 0.9;
      gen.coinRate = 0.6; gen.movingRate = 0.14; gen.boosterRate = 0.28; gen.hazardRate = 0.16; gen.slowRate = 0.18; gen.crumbleChanceOnStep = 0.28;
    } else if (d === 'hard') {
      diffSpeedMul = 1.15; diffAccelMul = 1.2; diffMaxMul = 1.15; gapMul = 1.1;
      gen.coinRate = 0.45; gen.movingRate = 0.25; gen.boosterRate = 0.18; gen.hazardRate = 0.35; gen.slowRate = 0.12; gen.crumbleChanceOnStep = 0.55;
    } else {
      diffSpeedMul = 1; diffAccelMul = 1; diffMaxMul = 1; gapMul = 1;
      gen.coinRate = 0.5; gen.movingRate = 0.18; gen.boosterRate = 0.22; gen.hazardRate = 0.25; gen.slowRate = 0.14; gen.crumbleChanceOnStep = 0.4;
    }
  }
  function startGameWithSettings() {
    applyDifficulty();
    currentLevelIndex = 0;
    currentLevelTarget = levels[0].distance;
    resetWorld();
    gamePhase = 'playing';
  }

  function createPlayer(startX, startY) {
    return {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      width: PLAYER.width,
      height: PLAYER.height,
      onGround: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      remainingAirJumps: 0,
    };
  }

  function createPlatform(x, y, w, h) {
    return { x, y, width: w, height: h, baseX: x, baseY: y, steppedAt: -1, move: null, crumbleAt: -1, crumbling: false, vy: 0 };
  }

  function aabbIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function tryPurchase(key) {
    const def = UPGRADE_DEFS[key];
    if (!def) return;
    if (!def.canBuy()) return;
    const cost = def.currentCost();
    if (coins >= cost) {
      coins -= cost;
      def.apply();
      if (key === 'double') {
        player.remainingAirJumps = 1;
      }
    }
  }

  function resetWorld() {
    if (!spriteFrames) spriteFrames = createPixelManFrames();
    // Reset run-specific state
    coins = 0;
    coinsCollectedThisRun = 0;
    coinsArray = [];
    hazards = [];
    boostRings = [];
    slowShards = [];
    particles = [];
    upgrades = {
      speedLevel: 0,
      jumpLevel: 0,
      doubleJump: false,
      magnetRadius: 0,
      glide: false,
      dash: false,
      coinValue: 1,
      staminaLevel: 0,
      platBoostLevel: 0,
      extraLives: 0,
    };
    stats = { ...PLAYER };
    chaserSpeedBonus = 0;
    chaserMaxBonus = 0;
    isUpgradeMenuOpen = false;
    lastUpgradeLayout = [];
    distanceTraveled = 0;
    lastSafeSnapshot = null;
    platforms = [];
    const groundY = Math.min(window.innerHeight - 140, 560);
    // Start with a generous runway
    platforms.push(createPlatform(-1500, groundY, 2200, 48));

    const startX = 0;
    const startY = groundY - PLAYER.height;
    player = createPlayer(startX, startY);

    cameraX = player.x - 240;
    chaserSpeed = CHASER.baseSpeed;
    chaserX = player.x + CHASER.startOffset;

    score = 0;
    timeAlive = 0;
    gameOver = false;
    deathReason = '';

    // Pre-generate some platforms ahead
    lastPlatformEndX = platforms[0].x + platforms[0].width;
    lastPlatformY = groundY;
    ensureAheadPlatforms(cameraX + window.innerWidth * 2);
  }

  // Procedural platform generation
  let lastPlatformEndX = 0;
  let lastPlatformY = 0;
  function ensureAheadPlatforms(targetWorldX) {
    const minY = 140;
    const maxY = Math.max(minY + 120, window.innerHeight - 120);

    while (lastPlatformEndX < targetWorldX) {
      const gap = randRange(80 * gapMul, 220 * gapMul);
      const width = randRange(180, 420);
      let nextY = lastPlatformY + randRange(-140, 140);
      nextY = clamp(nextY, minY, maxY);

      const platformHeight = 24;
      const x = lastPlatformEndX + gap;
      const y = nextY;

      platforms.push(createPlatform(x, y, width, platformHeight));
      lastPlatformEndX = x + width;
      lastPlatformY = y;

      // Randomly let some platforms move (gentle sine oscillation)
      const p = platforms[platforms.length - 1];
      if (settings.toggles.movingPlatforms && Math.random() < gen.movingRate) {
        const axis = Math.random() < 0.6 ? 'y' : 'x';
        const amp = axis === 'y' ? randRange(18, 48) : randRange(20, 60);
        const period = randRange(2.4, 4.8);
        const phase = Math.random() * Math.PI * 2;
        p.move = { axis, amp, period, phase };
      }

      // Optional small hazard bumps or short stacks for variety
      if (Math.random() < 0.3) {
        const numSteps = randInt(1, 3);
        let stepX = x + randRange(40, width - 40);
        let stepY = y - randRange(60, 120);
        for (let i = 0; i < numSteps; i++) {
          const w = randRange(40, 80);
          const h = 18;
          platforms.push(createPlatform(stepX, stepY, w, h));
          stepX += randRange(50, 100);
          stepY -= randRange(-20, 60);
        }
      }

      // Coins on this platform (clusters)
      if (settings.toggles.coins && Math.random() < gen.coinRate) {
        const clusterCount = randInt(3, 6);
        const startOffset = randRange(30, Math.max(40, width - 140));
        const spacing = randRange(26, 34);
        const coinY = y - randRange(40, 80);
        for (let i = 0; i < clusterCount; i++) {
          const cx = x + startOffset + i * spacing;
          coinsArray.push({ x: cx, y: coinY, size: 16, collected: false, spin: Math.random() * Math.PI * 2 });
        }
      }

      // Booster ring sometimes near end of platform
      if (settings.toggles.boosterRings && Math.random() < gen.boosterRate) {
        const rx = x + randRange(60, Math.max(80, width - 60));
        const ry = y - randRange(40, 100);
        boostRings.push({ x: rx, y: ry, r: 26, hit: false });
      }

      // Hazards: spikes or saws on top
      if (settings.toggles.hazards && Math.random() < gen.hazardRate && width > 120) {
        if (Math.random() < 0.6) {
          const num = randInt(2, 5);
          const start = x + randRange(10, width - 60);
          for (let i = 0; i < num; i++) {
            hazards.push({ type: 'spike', x: start + i * 20, y: y - 12, w: 18, h: 12 });
          }
        } else {
          const sx = x + randRange(30, width - 30);
          hazards.push({ type: 'saw', x: sx, y: y - 10, r: 10, dir: Math.random() < 0.5 ? -1 : 1, range: Math.min(100, width - 40), t: Math.random() * Math.PI * 2 });
        }
      }

      // Slow-mo shard occasionally above platform
      if (settings.toggles.slowMoShards && Math.random() < gen.slowRate) {
        const sx = x + randRange(30, width - 30);
        const sy = y - randRange(80, 140);
        slowShards.push({ x: sx, y: sy, r: 12, taken: false, spin: Math.random() * Math.PI * 2 });
      }
    }
  }

  function removeBehindPlatforms(minWorldX) {
    if (platforms.length < 64) return; // cheap guard
    platforms = platforms.filter(p => p.x + p.width > minWorldX);
    coinsArray = coinsArray.filter(c => c.x + 32 > minWorldX && !c.collected);
    hazards = hazards.filter(h => (h.x || 0) + (h.w || h.r || 0) > minWorldX);
    boostRings = boostRings.filter(r => r.x + r.r > minWorldX);
    slowShards = slowShards.filter(s => s.x + s.r > minWorldX && !s.taken);
    particles = particles.filter(pt => pt.life > 0);
  }

  function update(dt) {
    if (gameOver) return;
    if (isUpgradeMenuOpen || gamePhase !== 'playing') return; // pause when menu/levels screen open

    const sdt = dt * globalTimeScale;
    timeAlive += sdt;

    // Difficulty ramp: slowly increase chaser speed
    const targetSpeed = Math.min(
      CHASER.baseSpeed * diffSpeedMul + chaserSpeedBonus + timeAlive * (CHASER.accel * 0.1 * diffAccelMul),
      CHASER.maxSpeed * diffMaxMul + chaserMaxBonus
    );
    chaserSpeed += (targetSpeed - chaserSpeed) * Math.min(1, sdt * 0.5);
    const chaserFactor = slowMoTimer > 0 ? 0.85 : 1.0;
    chaserX += chaserSpeed * chaserFactor * sdt;

    // Input to movement
    const desired = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    // Horizontal acceleration/deceleration
    if (desired !== 0) {
      player.vx += desired * stats.runAccel * sdt;
    } else {
      // decelerate towards zero
      const decel = stats.runDecel * sdt;
      if (Math.abs(player.vx) <= decel) player.vx = 0; else player.vx -= Math.sign(player.vx) * decel;
    }
    player.vx = clamp(player.vx, -stats.maxRunSpeed, stats.maxRunSpeed);

    // Dash
    if (upgrades.dash && input.dashPressed) {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0) || Math.sign(player.vx) || 1;
      player.vx = clamp(player.vx + dir * 900, -stats.maxRunSpeed * 1.4, stats.maxRunSpeed * 1.4);
      input.dashPressed = false;
    }

    // Jump buffering and coyote time
    if (input.jumpPressed) {
      player.jumpBufferTimer = PLAYER.jumpBufferTime;
      input.jumpPressed = false;
    } else if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer -= sdt;
    }

    if (player.onGround) player.coyoteTimer = PLAYER.coyoteTime; else if (player.coyoteTimer > 0) player.coyoteTimer -= sdt;

    // Apply gravity
    const gravityMultiplier = (!player.onGround && upgrades.glide && input.up && player.vy > 0) ? 0.55 : 1.0;
    player.vy += GRAVITY * gravityMultiplier * sdt;

    // Attempt jump
    if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
      player.vy = -stats.jumpVelocity;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.remainingAirJumps = upgrades.doubleJump ? 1 : 0;
    } else if (player.jumpBufferTimer > 0 && !player.onGround && upgrades.doubleJump && player.remainingAirJumps > 0) {
      // Double jump
      player.vy = -stats.jumpVelocity * 0.95;
      player.remainingAirJumps -= 1;
      player.jumpBufferTimer = 0;
    }

    // Update moving/crumbling platforms motion
    for (const p of platforms) {
      if (p.move) {
        const t = (timeAlive + p.move.phase) / p.move.period;
        const off = Math.sin(t * Math.PI * 2) * p.move.amp;
        if (p.move.axis === 'y') p.y = p.baseY + off; else p.x = p.baseX + off;
      }
      if (!p.crumbling && p.crumbleAt > 0 && timeAlive > p.crumbleAt) {
        p.crumbling = true; p.vy = randRange(120, 220);
      }
      if (p.crumbling) {
        p.y += p.vy * sdt;
        p.vy += 900 * sdt;
      }
    }
    platforms = platforms.filter(p => p.y < window.innerHeight + 800);

    // Integrate and resolve collisions axis-by-axis
    // Horizontal
    player.x += player.vx * sdt;
    let collidedX = false;
    for (const p of platforms) {
      if (aabbIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
        if (player.vx > 0) {
          player.x = p.x - player.width;
          collidedX = true;
        } else if (player.vx < 0) {
          player.x = p.x + p.width;
          collidedX = true;
        }
      }
    }
    if (collidedX) player.vx = 0;

    // Vertical
    player.y += player.vy * sdt;
    let onGroundNow = false;
    let groundPlatform = null;
    for (const p of platforms) {
      if (aabbIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
        if (player.vy > 0) {
          player.y = p.y - player.height;
          player.vy = 0;
          onGroundNow = true;
          groundPlatform = p;
        } else if (player.vy < 0) {
          player.y = p.y + p.height;
          player.vy = 0;
        }
      }
    }
    player.onGround = onGroundNow;
    if (onGroundNow) {
      player.remainingAirJumps = upgrades.doubleJump ? 1 : 0;
    }
    if (groundPlatform && groundPlatform.steppedAt < 0) {
      groundPlatform.steppedAt = timeAlive;
      // Platform boost shortly after stepping
      if (upgrades.platBoostLevel > 0 && Math.abs(player.vx) > 0) {
        const boost = 160 * upgrades.platBoostLevel;
        player.vx += Math.sign(player.vx) * boost;
      }
      // Record last safe snapshot
      lastSafeSnapshot = { x: player.x, y: player.y, chaserX: chaserX };
      // Start crumble timer on first step for some platforms
      if (settings.toggles.crumblingPlatforms && Math.random() < gen.crumbleChanceOnStep && groundPlatform.crumbleAt < 0) {
        groundPlatform.crumbleAt = timeAlive + randRange(0.4, 1.0);
      }
    }

    // Camera follows ahead of player a bit
    const desiredCamX = player.x - 260 + clamp(player.vx, 0, 220) * 0.25;
    cameraX += (desiredCamX - cameraX) * Math.min(1, sdt * 3);

    // Score is max distance ahead of start relative to chaser
    score = Math.max(score, Math.floor(player.x - chaserX));
    distanceTraveled = Math.max(distanceTraveled, Math.floor(player.x));

    // Coin collection
    const playerBox = { x: player.x, y: player.y, w: player.width, h: player.height };
    for (const c of coinsArray) {
      if (c.collected) continue;
      const cx = c.x - c.size / 2;
      const cy = c.y - c.size / 2;
      if (aabbIntersect(playerBox.x, playerBox.y, playerBox.w, playerBox.h, cx, cy, c.size, c.size)) {
        c.collected = true;
        coins += upgrades.coinValue || 1;
        coinsCollectedThisRun += 1;
        combo = Math.min(combo + 1, maxCombo);
        comboTimer = comboMaxWindow;
        spawnParticles(c.x, c.y, '#ffd84a');
        playSfx('coin');
        continue;
      }
      // Magnet collection
      if (upgrades.magnetRadius && !player.onGround) {
        const ccx = c.x;
        const ccy = c.y;
        const dx = (player.x + player.width / 2) - ccx;
        const dy = (player.y + player.height / 2) - ccy;
        const dist = Math.hypot(dx, dy);
        if (dist < upgrades.magnetRadius) {
          c.collected = true;
          coins += upgrades.coinValue || 1;
          coinsCollectedThisRun += 1;
          combo = Math.min(combo + 1, maxCombo);
          comboTimer = comboMaxWindow;
          spawnParticles(c.x, c.y, '#ffd84a');
          playSfx('coin');
        }
      }
    }

    // Booster rings
    for (const r of boostRings) {
      if (r.hit) continue;
      const cx = player.x + player.width / 2;
      const cy = player.y + player.height / 2;
      const d = Math.hypot((r.x - cx), (r.y - cy));
      if (d < r.r + 10) {
        r.hit = true;
        player.vx = Math.max(player.vx, stats.maxRunSpeed * 1.2);
        coins += 3 * (upgrades.coinValue || 1);
        combo = Math.min(combo + 3, maxCombo);
        comboTimer = comboMaxWindow;
        spawnRingBurst(r.x, r.y, '#8cf2ff');
        playSfx('boost');
      }
    }

    // Hazards
    for (const h of hazards) {
      if (h.type === 'saw') {
        // Move saw along a small circle along x
        h.t += sdt * 1.6 * h.dir;
        const ox = Math.cos(h.t) * (h.range / 2);
        h.curX = h.x + ox;
        h.curY = h.y;
        if (circleRectIntersect(h.curX, h.curY, h.r, player.x, player.y, player.width, player.height)) {
          onHazardHit();
        }
      } else if (h.type === 'spike') {
        if (aabbIntersect(player.x, player.y, player.width, player.height, h.x, h.y, h.w, h.h)) {
          onHazardHit();
        }
      }
    }

    // Slow-mo shards
    for (const s of slowShards) {
      if (s.taken) continue;
      const cx = player.x + player.width / 2;
      const cy = player.y + player.height / 2;
      if (circleRectIntersect(s.x, s.y, s.r, player.x, player.y, player.width, player.height)) {
        s.taken = true;
        slowMoTimer = 2.5;
        globalTimeScale = 0.6;
        playSfx('slowmo');
        spawnRingBurst(s.x, s.y, '#b0c7ff');
      }
    }

    // Update combo timer and slow-mo timer
    if (comboTimer > 0) {
      comboTimer -= sdt;
      if (comboTimer <= 0) combo = 0;
    }
    if (slowMoTimer > 0) {
      slowMoTimer -= dt; // fade by real time for feel
      if (slowMoTimer <= 0) { slowMoTimer = 0; globalTimeScale = 1; }
    }

    // Update particles
    for (const p of particles) {
      p.vx *= 0.98; p.vy += 900 * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.life -= sdt;
    }

    // Generate new platforms ahead and prune behind
    ensureAheadPlatforms(cameraX + window.innerWidth * 2.5);
    removeBehindPlatforms(chaserX - 400);

    // Death conditions
    if (player.x + player.width <= chaserX) {
      gameOver = true;
      deathReason = 'The red wall caught up!';
    }
    const killY = Math.max(window.innerHeight + 600, 1400);
    if (player.y > killY) {
      // Try second life
      if (upgrades.extraLives && lastSafeSnapshot) {
        upgrades.extraLives -= 1;
        player.x = lastSafeSnapshot.x;
        player.y = lastSafeSnapshot.y;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        chaserX = Math.min(chaserX, player.x - 300);
        playSfx('revive');
      } else {
        gameOver = true;
        deathReason = 'You fell...';
      }
    }

    // Levels mode: check completion
    if (!gameOver && gameMode === 'levels' && distanceTraveled >= currentLevelTarget) {
      gamePhase = 'levelComplete';
    }
  }

  function circleRectIntersect(cx, cy, r, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= r * r;
  }

  function onHazardHit() {
    if (upgrades.extraLives && lastSafeSnapshot) {
      upgrades.extraLives -= 1;
      player.x = lastSafeSnapshot.x;
      player.y = lastSafeSnapshot.y;
      player.vx = 0;
      player.vy = 0;
      player.onGround = true;
      chaserX = Math.min(chaserX, player.x - 300);
      playSfx('revive');
    } else {
      gameOver = true;
      deathReason = 'Ouch!';
      playSfx('hit');
    }
  }

  // Particles
  let particles = [];
  function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      particles.push({ x, y, vx: randRange(-180, 180), vy: randRange(-260, -40), life: randRange(0.3, 0.7), color });
    }
  }
  function spawnRingBurst(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      particles.push({ x, y, vx: Math.cos(ang) * randRange(180, 280), vy: Math.sin(ang) * randRange(180, 280), life: randRange(0.4, 0.8), color });
    }
  }

  function drawBackground() {
    // Gradient sky
    const w = window.innerWidth;
    const h = window.innerHeight;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d1020');
    g.addColorStop(1, '#0a0c14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Subtle parallax grid
    ctx.save();
    ctx.globalAlpha = 0.05;
    const gridSize = 64;
    const offset = -((cameraX * 0.2) % gridSize);
    ctx.strokeStyle = '#b3c0ff';
    ctx.lineWidth = 1;
    for (let x = offset; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();

    // Draw platforms
    ctx.lineJoin = 'round';
    for (const p of platforms) {
      const sx = Math.floor(p.x - cameraX);
      const sy = Math.floor(p.y);
      if (sx > window.innerWidth || sx + p.width < -200) continue;
      const baseFill = '#25334a';
      let fillColor = baseFill;
      if (p.steppedAt >= 0) {
        const t = clamp((timeAlive - p.steppedAt) / 0.8, 0, 1);
        fillColor = blendHexColors(baseFill, '#ffffff', t);
      }
      ctx.fillStyle = fillColor;
      ctx.fillRect(sx, sy, p.width, p.height);
      // Glow outline if stepped
      if (p.steppedAt >= 0) {
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 0.5, sy + 0.5, p.width - 1, p.height - 1);
        ctx.restore();
      } else {
        ctx.strokeStyle = '#3f567a';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 0.5, sy + 0.5, p.width - 1, p.height - 1);
      }
      if (p.crumbling) {
        ctx.strokeStyle = '#ffb3b3';
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(sx + 0.5, sy + 0.5, p.width - 1, p.height - 1);
        ctx.setLineDash([]);
      }
    }

    // Draw coins
    for (const c of coinsArray) {
      if (c.collected) continue;
      const sx = Math.floor(c.x - cameraX);
      const sy = Math.floor(c.y);
      if (sx < -40 || sx > window.innerWidth + 40) continue;
      const t = (timeAlive + c.spin) * 6;
      const w = c.size * (0.6 + 0.4 * Math.abs(Math.cos(t)));
      const h = c.size;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#ffd84a';
      ctx.strokeStyle = '#b38a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Shine
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#fff7b0';
      ctx.beginPath();
      ctx.ellipse(-w * 0.15, -h * 0.15, w * 0.15, h * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw booster rings
    for (const r of boostRings) {
      const sx = Math.floor(r.x - cameraX);
      const sy = Math.floor(r.y);
      if (sx < -60 || sx > window.innerWidth + 60) continue;
      ctx.save();
      ctx.strokeStyle = r.hit ? '#7fdcea' : '#8cf2ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#8cf2ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw hazards
    for (const h of hazards) {
      if (h.type === 'spike') {
        const sx = Math.floor(h.x - cameraX);
        const sy = Math.floor(h.y);
        ctx.fillStyle = '#e05e5e';
        ctx.beginPath();
        ctx.moveTo(sx, sy + h.h);
        ctx.lineTo(sx + h.w / 2, sy);
        ctx.lineTo(sx + h.w, sy + h.h);
        ctx.closePath();
        ctx.fill();
      } else if (h.type === 'saw') {
        const sx = Math.floor((h.curX ?? h.x) - cameraX);
        const sy = Math.floor(h.curY ?? h.y);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.fillStyle = '#f2f2f2';
        ctx.strokeStyle = '#9e9e9e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, h.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw slow-mo shards
    for (const s of slowShards) {
      if (s.taken) continue;
      const sx = Math.floor(s.x - cameraX);
      const sy = Math.floor(s.y);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((timeAlive + s.spin) * 2);
      ctx.fillStyle = '#b0c7ff';
      ctx.strokeStyle = '#7f98db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = i * (Math.PI * 2 / 5);
        const r1 = s.r;
        const r2 = s.r * 0.5;
        ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang + Math.PI / 5) * r2, Math.sin(ang + Math.PI / 5) * r2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw chaser border as a translucent red wall
    const chaserScreenX = Math.floor(chaserX - cameraX);
    ctx.save();
    ctx.fillStyle = 'rgba(220, 60, 60, 0.18)';
    ctx.fillRect(0, 0, clamp(chaserScreenX, 0, window.innerWidth), window.innerHeight);
    ctx.strokeStyle = '#ff4d4d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(chaserScreenX + 0.5, 0);
    ctx.lineTo(chaserScreenX + 0.5, window.innerHeight);
    ctx.stroke();
    ctx.restore();

    // Draw player (pixel-art sprite)
    const px = Math.floor(player.x - cameraX);
    const py = Math.floor(player.y);

    // Select frame based on state
    let frameCanvas;
    const isAir = !player.onGround;
    const isMoving = Math.abs(player.vx) > 10;
    if (isAir) {
      frameCanvas = spriteFrames.jump[0];
    } else if (isMoving) {
      frameCanvas = spriteFrames.run[runFrameIndex % spriteFrames.run.length];
    } else {
      frameCanvas = spriteFrames.idle[0];
    }

    ctx.save();
    ctx.translate(px + player.width / 2, py + player.height / 2);
    const tilt = clamp(player.vx / stats.maxRunSpeed, -1, 1) * 0.15;
    ctx.rotate(tilt);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    const fw = spriteFrames.size;
    const fh = spriteFrames.size;
    ctx.drawImage(
      frameCanvas,
      0, 0, fw, fh,
      -player.width / 2,
      -player.height / 2,
      player.width,
      player.height
    );
    ctx.restore();

    // Particles
    for (const p of particles) {
      const sx = Math.floor(p.x - cameraX);
      const sy = Math.floor(p.y);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillRect(sx, sy, 3, 3);
      ctx.globalAlpha = 1;
    }

    // UI
    ctx.fillStyle = '#e8eef9';
    ctx.font = '600 16px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Speed: ${Math.round(chaserSpeed)}  Score: ${score}`, 16, 12);
    ctx.fillText(`Coins: ${coins}`, 16, 34);
    if (combo > 1) {
      ctx.fillStyle = '#8cf2ff';
      ctx.fillText(`Combo x${combo}`, 16, 56);
    }
    if (bestScore != null) {
      ctx.fillStyle = '#a9b8d6';
      ctx.fillText(`Best: ${bestScore}`, 16, 76);
    }

    // Controls hint
    if (timeAlive < 3 && !gameOver) {
      ctx.fillStyle = '#a9b8d6';
      ctx.textAlign = 'center';
      ctx.fillText('Move: A/D or Arrow Keys — Jump: W/Up/Space — U: Upgrades (pauses) — Keep ahead of the red wall!', window.innerWidth / 2, 14);
    }

    // Distance counter (bottom center)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#e8eef9';
    ctx.fillText(`Distance: ${distanceTraveled}`, window.innerWidth / 2, window.innerHeight - 10);

    // Slow-mo bar (top center)
    if (slowMoTimer > 0) {
      const w = 240, h = 8;
      const x = (window.innerWidth - w) / 2;
      const y = 40;
      ctx.fillStyle = '#1a2333';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#b0c7ff';
      const pct = slowMoTimer / slowMoMax;
      ctx.fillRect(x, y, w * pct, h);
      ctx.strokeStyle = '#3e61a3';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    // Upgrades overlay menu
    if (isUpgradeMenuOpen && !gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(8,10,16,0.75)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      const panelW = Math.min(720, window.innerWidth - 40);
      const panelH = Math.min(460, window.innerHeight - 40);
      const panelX = (window.innerWidth - panelW) / 2;
      const panelY = (window.innerHeight - panelH) / 2;
      ctx.fillStyle = '#121826';
      ctx.strokeStyle = '#36507a';
      ctx.lineWidth = 2;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
      ctx.fillStyle = '#e8eef9';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '700 20px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
      ctx.fillText('Upgrades (click to buy) — press U to resume', panelX + 16, panelY + 12);
      ctx.font = '600 14px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
      ctx.fillStyle = '#cfe3ff';
      ctx.fillText(`Coins: ${coins}`, panelX + 16, panelY + 40);

      // Layout upgrade buttons in grid
      const entries = [
        { key: 'speed' }, { key: 'jump' }, { key: 'double' }, { key: 'magnet' },
        { key: 'glide' }, { key: 'dash' }, { key: 'coinValue' }, { key: 'stamina' },
        { key: 'platBoost' }, { key: 'secondLife' },
      ];
      const cols = 2;
      const rows = Math.ceil(entries.length / cols);
      const cellW = (panelW - 32 - (cols - 1) * 16) / cols;
      const cellH = 70;
      let layout = [];
      for (let i = 0; i < entries.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = panelX + 16 + col * (cellW + 16);
        const y = panelY + 70 + row * (cellH + 12);
        const w = cellW;
        const h = cellH;
        layout.push({ ...entries[i], x, y, w, h });
      }
      lastUpgradeLayout = layout;

      for (const item of layout) {
        const def = UPGRADE_DEFS[item.key];
        const cost = def.currentCost();
        const canBuy = def.canBuy() && coins >= cost;
        // Card
        ctx.fillStyle = canBuy ? '#1a2333' : '#151b28';
        ctx.strokeStyle = canBuy ? '#3e61a3' : '#2a3a56';
        ctx.lineWidth = 2;
        ctx.fillRect(item.x, item.y, item.w, item.h);
        ctx.strokeRect(item.x + 0.5, item.y + 0.5, item.w - 1, item.h - 1);
        // Text
        ctx.fillStyle = '#e8eef9';
        ctx.font = '700 16px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
        ctx.fillText(def.name, item.x + 12, item.y + 10);
        ctx.font = '600 13px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
        ctx.fillStyle = '#b9c7df';
        ctx.fillText(def.desc, item.x + 12, item.y + 32);
        // Cost and state
        ctx.textAlign = 'right';
        ctx.fillStyle = canBuy ? '#ffd84a' : '#7f8aa3';
        ctx.fillText(`Cost: ${cost}`, item.x + item.w - 12, item.y + 10);
        ctx.textAlign = 'left';
        // State details
        let extra = '';
        if (item.key === 'speed') extra = `Lv.${upgrades.speedLevel}`;
        else if (item.key === 'jump') extra = `Lv.${upgrades.jumpLevel}`;
        else if (item.key === 'double') extra = upgrades.doubleJump ? 'Owned' : '';
        else if (item.key === 'magnet') extra = `R:${upgrades.magnetRadius||0}`;
        else if (item.key === 'glide') extra = upgrades.glide ? 'Owned' : '';
        else if (item.key === 'dash') extra = upgrades.dash ? 'Owned' : '';
        else if (item.key === 'coinValue') extra = `x${upgrades.coinValue||1}`;
        else if (item.key === 'stamina') extra = `Lv.${upgrades.staminaLevel||0}`;
        else if (item.key === 'platBoost') extra = `Lv.${upgrades.platBoostLevel||0}`;
        else if (item.key === 'secondLife') extra = `Lives:${upgrades.extraLives||0}`;
        if (extra) {
          ctx.fillStyle = '#9fb4d8';
          ctx.fillText(extra, item.x + 12, item.y + 50);
        }
      }
      ctx.restore();
    }

    // Start menu
    if (gamePhase === 'menu') {
      drawStartMenu();
    }

    // Level complete overlay
    if (gamePhase === 'levelComplete') {
      drawLevelComplete();
    }

    if (gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(10,12,20,0.7)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffb4b4';
      ctx.font = '700 28px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
      ctx.fillText('Game Over', window.innerWidth / 2, window.innerHeight / 2 - 60);
      ctx.fillStyle = '#e8eef9';
      ctx.font = '600 18px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
      ctx.fillText(deathReason, window.innerWidth / 2, window.innerHeight / 2 - 26);
      ctx.fillStyle = '#a9b8d6';
      ctx.fillText('Press R to Restart', window.innerWidth / 2, window.innerHeight / 2 + 14);
      // Main menu button
      const bw = 180, bh = 42;
      const bx = window.innerWidth / 2 - bw / 2;
      const by = window.innerHeight / 2 + 60;
      ctx.fillStyle = '#1a2333';
      ctx.strokeStyle = '#3e61a3';
      ctx.lineWidth = 2;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      ctx.fillStyle = '#e8eef9';
      ctx.fillText('Main Menu', window.innerWidth / 2, by + 26);
      levelButtons = [{ key: 'menu', x: bx, y: by, w: bw, h: bh }];
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }

  function drawStartMenu() {
    const ctx = window.__ctx || (window.__ctx = canvas.getContext('2d'));
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,16,0.7)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    const panelW = Math.min(760, window.innerWidth - 40);
    const panelH = Math.min(540, window.innerHeight - 40);
    const panelX = (window.innerWidth - panelW) / 2;
    const panelY = (window.innerHeight - panelH) / 2;
    ctx.fillStyle = '#101726';
    ctx.strokeStyle = '#36507a';
    ctx.lineWidth = 2;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
    ctx.fillStyle = '#e8eef9';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '700 24px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
    ctx.fillText('Endless Chase Platformer', panelX + 18, panelY + 14);
    ctx.font = '600 15px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText('Choose Mode', panelX + 18, panelY + 56);
    // Mode buttons
    const mbW = 140, mbH = 36, mbY = panelY + 80;
    let x1 = panelX + 18;
    const modeEntries = [
      { key: 'endless', label: 'Endless' },
      { key: 'levels', label: 'Levels' },
    ];
    menuButtons = [];
    for (const m of modeEntries) {
      const selected = gameMode === m.key;
      ctx.fillStyle = selected ? '#1e2a40' : '#151b28';
      ctx.strokeStyle = selected ? '#3e61a3' : '#2a3a56';
      ctx.lineWidth = 2;
      ctx.fillRect(x1, mbY, mbW, mbH);
      ctx.strokeRect(x1 + 0.5, mbY + 0.5, mbW - 1, mbH - 1);
      ctx.fillStyle = '#e8eef9';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x1 + mbW / 2, mbY + 10);
      menuButtons.push({ type: 'mode', key: m.key, x: x1, y: mbY, w: mbW, h: mbH });
      x1 += mbW + 10;
    }
    // Difficulty
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText('Difficulty', panelX + 18, panelY + 128);
    const diffs = [ {k:'easy',l:'Easy'}, {k:'normal',l:'Normal'}, {k:'hard',l:'Hard'} ];
    let dx = panelX + 18; const dy = panelY + 150;
    for (const d of diffs) {
      const sel = settings.difficulty === d.k;
      const w = 110, h = 32;
      ctx.fillStyle = sel ? '#1e2a40' : '#151b28';
      ctx.strokeStyle = sel ? '#3e61a3' : '#2a3a56';
      ctx.fillRect(dx, dy, w, h);
      ctx.strokeRect(dx + 0.5, dy + 0.5, w - 1, h - 1);
      ctx.fillStyle = '#e8eef9';
      ctx.textAlign = 'center';
      ctx.fillText(d.l, dx + w / 2, dy + 8);
      menuButtons.push({ type: 'difficulty', key: d.k, x: dx, y: dy, w, h });
      dx += w + 10;
    }
    // Toggles grid
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText('Features', panelX + 18, panelY + 196);
    const toggles = [
      { k:'movingPlatforms', l:'Moving Platforms' },
      { k:'crumblingPlatforms', l:'Crumbling Platforms' },
      { k:'boosterRings', l:'Booster Rings' },
      { k:'hazards', l:'Hazards' },
      { k:'slowMoShards', l:'Slow-mo Shards' },
      { k:'coins', l:'Coins' },
    ];
    const cols = 2;
    const cw = (panelW - 36) / cols - 8;
    const ch = 32;
    let idx = 0;
    for (const t of toggles) {
      const col = idx % cols; const row = Math.floor(idx / cols);
      const bx = panelX + 18 + col * (cw + 16);
      const by = panelY + 220 + row * (ch + 12);
      const on = settings.toggles[t.k];
      ctx.fillStyle = on ? '#1a2c1a' : '#2a1b1b';
      ctx.strokeStyle = on ? '#3a8a3a' : '#8a3a3a';
      ctx.fillRect(bx, by, cw, ch);
      ctx.strokeRect(bx + 0.5, by + 0.5, cw - 1, ch - 1);
      ctx.fillStyle = '#e8eef9';
      ctx.textAlign = 'left';
      ctx.fillText((on ? 'ON  ' : 'OFF ') + '— ' + t.l, bx + 10, by + 8);
      menuButtons.push({ type: 'toggle', key: t.k, x: bx, y: by, w: cw, h: ch });
      idx++;
    }
    // Play button
    const pw = 200, ph = 48;
    const px = panelX + panelW - pw - 18;
    const py = panelY + panelH - ph - 18;
    ctx.fillStyle = '#1a2333';
    ctx.strokeStyle = '#3e61a3';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    ctx.fillStyle = '#e8eef9';
    ctx.textAlign = 'center';
    ctx.fillText('Play', px + pw / 2, py + 14);
    menuButtons.push({ type: 'play', x: px, y: py, w: pw, h: ph });
    ctx.restore();
  }

  function drawLevelComplete() {
    const ctx = window.__ctx || (window.__ctx = canvas.getContext('2d'));
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,16,0.75)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    const panelW = 520, panelH = 240;
    const panelX = (window.innerWidth - panelW) / 2;
    const panelY = (window.innerHeight - panelH) / 2;
    ctx.fillStyle = '#101726';
    ctx.strokeStyle = '#36507a';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
    ctx.fillStyle = '#e8eef9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '700 22px system-ui, -apple-system';
    const levelName = levels[currentLevelIndex]?.name || `Level ${currentLevelIndex+1}`;
    ctx.fillText(`${levelName} Complete!`, window.innerWidth / 2, panelY + 20);
    ctx.font = '600 14px system-ui, -apple-system';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText(`Target: ${currentLevelTarget} — Achieved Distance: ${distanceTraveled}`, window.innerWidth / 2, panelY + 56);
    // Buttons
    const bw = 160, bh = 40;
    const space = 20;
    const y = panelY + panelH - bh - 20;
    const bx1 = panelX + 40;
    const bx2 = panelX + panelW / 2 - bw / 2;
    const bx3 = panelX + panelW - bw - 40;
    ctx.fillStyle = '#1a2333'; ctx.strokeStyle = '#3e61a3';
    ctx.fillRect(bx1, y, bw, bh); ctx.strokeRect(bx1 + 0.5, y + 0.5, bw - 1, bh - 1);
    ctx.fillRect(bx2, y, bw, bh); ctx.strokeRect(bx2 + 0.5, y + 0.5, bw - 1, bh - 1);
    ctx.fillRect(bx3, y, bw, bh); ctx.strokeRect(bx3 + 0.5, y + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = '#e8eef9'; ctx.textAlign = 'center';
    ctx.fillText('Main Menu', bx1 + bw / 2, y + 12);
    ctx.fillText('Replay', bx2 + bw / 2, y + 12);
    ctx.fillText('Next Level', bx3 + bw / 2, y + 12);
    levelButtons = [
      { key: 'menu', x: bx1, y, w: bw, h: bh },
      { key: 'replay', x: bx2, y, w: bw, h: bh },
      { key: 'next', x: bx3, y, w: bw, h: bh },
    ];
    ctx.restore();
  }

  function restart() {
    if (bestScore == null) bestScore = score; else bestScore = Math.max(bestScore, score);
    resetWorld();
  }

  // Main loop
  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    // Animation timers/state
    const moving = Math.abs(player.vx) > 10;
    if (moving) facing = Math.sign(player.vx) || facing;
    if (player.onGround && moving) {
      const speedFactor = clamp(Math.abs(player.vx) / stats.maxRunSpeed, 0.5, 1.6);
      animTimer += dt * 10 * speedFactor;
      runFrameIndex = Math.floor(animTimer) % (spriteFrames ? spriteFrames.run.length : 1);
    } else if (player.onGround && !moving) {
      animTimer = 0;
      runFrameIndex = 0;
    }
    draw();

    // Handle upgrade menu clicks
    if (isUpgradeMenuOpen && mouse.clicked) {
      mouse.clicked = false;
      for (const b of lastUpgradeLayout) {
        if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
          tryPurchase(b.key);
          break;
        }
      }
    } else {
      mouse.clicked = false;
    }

    // Handle start menu clicks
    if (gamePhase === 'menu' && mouse.clicked) {
      mouse.clicked = false;
      for (const b of menuButtons) {
        if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
          if (b.type === 'mode') gameMode = b.key;
          else if (b.type === 'difficulty') settings.difficulty = b.key;
          else if (b.type === 'toggle') settings.toggles[b.key] = !settings.toggles[b.key];
          else if (b.type === 'play') { startGameWithSettings(); }
        }
      }
    }

    // Handle level complete / game over menu clicks
    if ((gamePhase === 'levelComplete' || gameOver) && levelButtons && levelButtons.length && mouse.clicked) {
      mouse.clicked = false;
      for (const b of levelButtons) {
        if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
          if (b.key === 'menu') {
            gamePhase = 'menu'; gameOver = false; levelButtons = []; return requestAnimationFrame(frame);
          }
          if (b.key === 'replay') {
            gameOver = false; levelButtons = []; resetWorld(); gamePhase = 'playing'; return requestAnimationFrame(frame);
          }
          if (b.key === 'next') {
            currentLevelIndex = Math.min(currentLevelIndex + 1, levels.length - 1);
            currentLevelTarget = levels[currentLevelIndex].distance;
            levelButtons = []; resetWorld(); gamePhase = 'playing'; return requestAnimationFrame(frame);
          }
        }
      }
    }
    requestAnimationFrame(frame);
  }

  // Start
  let hazards = [];
  let boostRings = [];
  let slowShards = [];
  let globalTimeScale = 1;
  let slowMoTimer = 0;
  const slowMoMax = 2.5;
  let combo = 0, maxCombo = 10, comboTimer = 0, comboMaxWindow = 2.0;
  // Start in menu; world resets when starting game
  requestAnimationFrame(frame);
})();
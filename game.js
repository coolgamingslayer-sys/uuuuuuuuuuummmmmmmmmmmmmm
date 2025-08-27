(function () {
  'use strict';

  // Canvas setup
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hudCoinsEl = document.getElementById('coins');
  const hudDistEl = document.getElementById('distance');
  const hudSpeedEl = document.getElementById('speed');

  // World constants
  const WORLD = {
    gravity: 2200,
    friction: 0.86,
    airControl: 0.92,
    baseMoveSpeed: 360,
    baseJumpSpeed: 840,
    terminalVelocity: 2400,
    cameraLerp: 0.12,
  };

  // Input state
  const keys = new Set();
  const KEY = {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    JUMP: ['Space', 'KeyW', 'ArrowUp'],
    SHOP: ['KeyU'],
    RESTART: ['KeyR'],
    BUY1: ['Digit1'],
    BUY2: ['Digit2'],
    BUY3: ['Digit3'],
  };

  // Game state
  const state = {
    time: 0,
    cameraX: 0,
    gameOver: false,
    shopOpen: false,
    coins: 0,
    distance: 0,
    entities: {
      player: null,
      platforms: [],
      coins: [],
      border: null,
    },
    upgrades: {
      speedLevel: 0,
      jumpLevel: 0,
      bufferLevel: 0, // increases safe distance from the border
      coinValueLevel: 0,
    },
  };

  function coinValue() {
    return 1 + state.upgrades.coinValueLevel;
  }

  function moveSpeed() {
    return WORLD.baseMoveSpeed * (1 + state.upgrades.speedLevel * 0.18);
  }

  function jumpSpeed() {
    return WORLD.baseJumpSpeed * (1 + state.upgrades.jumpLevel * 0.14);
  }

  function borderBuffer() {
    return 200 + state.upgrades.bufferLevel * 40;
  }

  function upgradeCost(level) {
    return 5 + level * 5;
  }

  // Utility
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function aabbIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // Entities
  function createPlayer(x, y) {
    return {
      x: x,
      y: y,
      width: 36,
      height: 48,
      vx: 0,
      vy: 0,
      onGround: false,
      groundedPlatform: null,
      color: '#7ec8ff',
      alive: true,
    };
  }

  function createPlatform(x, y, w, h) {
    return {
      x: x,
      y: y,
      width: w,
      height: h,
      glow: false,
    };
  }

  function createCoin(x, y) {
    return {
      x: x,
      y: y,
      r: 8,
      collected: false,
    };
  }

  function createBorder(x) {
    return {
      x: x, // left vertical line following player
      width: 12,
      color: '#ff3b3b',
      baseSpeed: 140,
    };
  }

  // World generation
  const gen = {
    nextX: 0,
    floorY: 420,
  };

  function seedWorld() {
    state.entities.platforms.length = 0;
    state.entities.coins.length = 0;
    gen.nextX = -200;
    addPlatform(gen.nextX, gen.floorY, 800, 28);
    gen.nextX += 600;
    for (let i = 0; i < 20; i++) {
      proceduralChunk();
    }
  }

  function addPlatform(x, y, w, h) {
    state.entities.platforms.push(createPlatform(x, y, w, h));
    // Place a coin sometimes
    if (Math.random() < 0.55) {
      const coinX = x + 20 + Math.random() * Math.max(0, w - 40);
      const coinY = y - 22 - Math.random() * 40;
      state.entities.coins.push(createCoin(coinX, coinY));
    }
  }

  function proceduralChunk() {
    const platformsToCreate = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < platformsToCreate; i++) {
      const gap = 120 + Math.random() * 220;
      const width = 120 + Math.random() * 280;
      const deltaY = (Math.random() - 0.5) * 120;
      gen.nextX += gap;
      gen.floorY = clamp(gen.floorY + deltaY, 260, 480);
      addPlatform(gen.nextX, gen.floorY, width, 20);
    }
  }

  function ensureForwardGeneration() {
    const needAhead = state.cameraX + canvas.width * 2.5;
    while (gen.nextX < needAhead) {
      proceduralChunk();
    }
  }

  function cleanupBehind() {
    const cutoff = state.cameraX - canvas.width * 1.5;
    state.entities.platforms = state.entities.platforms.filter(p => p.x + p.width > cutoff);
    state.entities.coins = state.entities.coins.filter(c => !c.collected && c.x > cutoff - 200);
  }

  function resetGame() {
    state.time = 0;
    state.cameraX = 0;
    state.gameOver = false;
    state.shopOpen = false;
    state.distance = 0;
    state.entities.player = createPlayer(60, 200);
    state.entities.border = createBorder(-200);
    seedWorld();
    updateHud();
  }

  // Input handlers
  window.addEventListener('keydown', (e) => {
    if (Object.values(KEY).flat().includes(e.code)) {
      if (['Space', 'ArrowUp'].includes(e.code)) {
        e.preventDefault();
      }
    }
    keys.add(e.code);

    if (match(e.code, KEY.SHOP)) {
      state.shopOpen = !state.shopOpen;
    }
    if (match(e.code, KEY.RESTART)) {
      if (state.gameOver) resetGame();
    }

    if (state.shopOpen && !state.gameOver) {
      if (match(e.code, KEY.BUY1)) tryBuy('speedLevel');
      if (match(e.code, KEY.BUY2)) tryBuy('jumpLevel');
      if (match(e.code, KEY.BUY3)) tryBuy('bufferLevel');
    }
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  function match(code, group) {
    for (let i = 0; i < group.length; i++) if (group[i] === code) return true;
    return false;
  }

  function tryBuy(key) {
    const level = state.upgrades[key];
    const cost = upgradeCost(level);
    if (state.coins >= cost) {
      state.coins -= cost;
      state.upgrades[key] = level + 1;
      updateHud();
    }
  }

  // Physics and update
  function update(dt) {
    if (state.gameOver) return;

    const player = state.entities.player;
    const platforms = state.entities.platforms;
    const coins = state.entities.coins;
    const border = state.entities.border;

    // Horizontal input
    const leftHeld = isAnyDown(KEY.LEFT);
    const rightHeld = isAnyDown(KEY.RIGHT);
    const jumpPressed = isAnyDown(KEY.JUMP);

    const desiredSpeed = moveSpeed();
    const accel = 3400;

    if (leftHeld && !rightHeld) {
      player.vx -= accel * dt;
    } else if (rightHeld && !leftHeld) {
      player.vx += accel * dt;
    } else {
      player.vx *= player.onGround ? WORLD.friction : WORLD.airControl;
    }

    player.vx = clamp(player.vx, -desiredSpeed, desiredSpeed);

    // Gravity
    player.vy += WORLD.gravity * dt;
    player.vy = clamp(player.vy, -Infinity, WORLD.terminalVelocity);

    // Integrate Y then resolve vertical collisions
    player.y += player.vy * dt;
    let wasOnGround = player.onGround;
    player.onGround = false;
    let newGround = null;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (aabbIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
        // Determine previous Y to know side
        const prevY = player.y - player.vy * dt;
        if (prevY + player.height <= p.y + 2) {
          // Landed on top
          player.y = p.y - player.height;
          player.vy = 0;
          player.onGround = true;
          newGround = p;
        } else if (prevY >= p.y + p.height - 2) {
          // Hit from below
          player.y = p.y + p.height;
          player.vy = 0;
        }
      }
    }

    // Handle glow state transitions for platforms
    if (player.groundedPlatform && player.groundedPlatform !== newGround) {
      player.groundedPlatform.glow = false;
    }
    if (newGround) {
      newGround.glow = true;
    }
    player.groundedPlatform = newGround;

    // Jump
    if (jumpPressed && player.onGround) {
      player.vy = -jumpSpeed();
      player.onGround = false;
      if (player.groundedPlatform) {
        player.groundedPlatform.glow = false; // stop glowing when jumping off
        player.groundedPlatform = null;
      }
    }

    // Integrate X then resolve horizontal collisions
    player.x += player.vx * dt;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (aabbIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
        const prevX = player.x - player.vx * dt;
        if (prevX + player.width <= p.x + 2) {
          player.x = p.x - player.width;
          player.vx = 0;
        } else if (prevX >= p.x + p.width - 2) {
          player.x = p.x + p.width;
          player.vx = 0;
        }
      }
    }

    // Coins collection
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (!c.collected && aabbIntersect(player.x, player.y, player.width, player.height, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
        c.collected = true;
        state.coins += coinValue();
        updateHud();
      }
    }

    // Camera follows player
    const desiredCamX = player.x - canvas.width * 0.4;
    state.cameraX += (desiredCamX - state.cameraX) * WORLD.cameraLerp;

    // Distance traveled (relative to starting x)
    state.distance = Math.max(0, Math.floor(player.x / 10));

    // Border logic: chase player; if too far behind and player too fast, drastically speed up
    const desiredBorderX = player.x - borderBuffer();
    const gap = desiredBorderX - border.x;
    const gapAbs = Math.abs(gap);
    const normalSpeed = border.baseSpeed;
    // Estimate player's forward speed (positive only)
    const playerForwardSpeed = Math.max(0, player.vx);

    let borderSpeed = normalSpeed;
    if (gap > 0) {
      // behind target; move forward
      // If gap is large, accelerate to close within ~0.4-0.8s depending on size
      if (gapAbs > 800 || playerForwardSpeed > desiredSpeed * 0.85) {
        const catchTime = clamp(gapAbs / 1600, 0.25, 0.8);
        borderSpeed = Math.max(borderSpeed, gapAbs / catchTime);
      } else {
        // gentle easing when near
        borderSpeed = Math.max(borderSpeed, 0.5 * gapAbs);
      }
      border.x += borderSpeed * dt;
      // Do not overshoot desired position to avoid oscillations
      if (border.x > desiredBorderX) border.x = desiredBorderX;
    } else {
      // If somehow ahead of target (rare), ease back slowly
      border.x += Math.max(-400, gap) * dt;
    }

    // Check death: border overlaps player's back
    if (border.x + border.width >= player.x) {
      player.alive = false;
      state.gameOver = true;
    }

    // Procedural world maintenance
    ensureForwardGeneration();
    cleanupBehind();

    updateHud();
  }

  function isAnyDown(list) {
    for (let i = 0; i < list.length; i++) if (keys.has(list[i])) return true;
    return false;
  }

  // Rendering
  function render() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parallax bg
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#12173a');
    skyGrad.addColorStop(1, '#0a0e22');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cameraX = state.cameraX;

    // Draw platforms
    for (let i = 0; i < state.entities.platforms.length; i++) {
      const p = state.entities.platforms[i];
      const x = Math.floor(p.x - cameraX);
      const y = Math.floor(p.y);
      const w = Math.floor(p.width);
      const h = Math.floor(p.height);

      ctx.fillStyle = p.glow ? '#ffffff' : '#5a6279';
      ctx.strokeStyle = p.glow ? '#ffffff' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = p.glow ? 3 : 1;
      if (p.glow) {
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
      }
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      if (p.glow) ctx.restore();
    }

    // Draw coins
    for (let i = 0; i < state.entities.coins.length; i++) {
      const c = state.entities.coins[i];
      if (c.collected) continue;
      const x = Math.floor(c.x - cameraX);
      const y = Math.floor(c.y);
      ctx.beginPath();
      ctx.arc(x, y, c.r, 0, Math.PI * 2);
      const coinGrad = ctx.createRadialGradient(x - 3, y - 4, 2, x, y, c.r);
      coinGrad.addColorStop(0, '#fff1a8');
      coinGrad.addColorStop(1, '#e7b300');
      ctx.fillStyle = coinGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw player
    const pl = state.entities.player;
    const px = Math.floor(pl.x - cameraX);
    const py = Math.floor(pl.y);
    ctx.fillStyle = pl.color;
    ctx.strokeStyle = '#163b63';
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, pl.width, pl.height);
    ctx.strokeRect(px, py, pl.width, pl.height);

    // Draw border
    const border = state.entities.border;
    const bx = Math.floor(border.x - cameraX);
    ctx.save();
    ctx.fillStyle = border.color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(bx, 0, border.width, canvas.height);
    ctx.restore();

    if (state.shopOpen) renderShop();
    if (state.gameOver) renderGameOver();
  }

  function renderShop() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#0b0f24';
    ctx.fillRect(centerX - 260, centerY - 150, 520, 300);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 260, centerY - 150, 520, 300);

    ctx.fillStyle = '#e7e9f0';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Upgrades (press 1/2/3 to buy) — U to close', centerX - 240, centerY - 110);

    ctx.font = '16px system-ui, sans-serif';
    const items = [
      { key: 'speedLevel', label: 'Move Speed' },
      { key: 'jumpLevel', label: 'Jump Power' },
      { key: 'bufferLevel', label: 'Border Buffer' },
    ];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const y = centerY - 60 + i * 48;
      const level = state.upgrades[it.key];
      const cost = upgradeCost(level);
      ctx.fillStyle = '#adb4c6';
      ctx.fillText(`${i + 1}. ${it.label}`, centerX - 240, y);
      ctx.fillStyle = '#8aa8ff';
      ctx.fillText(`Level ${level}`, centerX + 20, y);
      ctx.fillStyle = state.coins >= cost ? '#f5d26b' : '#8f95a6';
      ctx.fillText(`Cost: ${cost}c`, centerX + 140, y);
    }

    ctx.fillStyle = '#aab1c5';
    ctx.fillText('Coins: ' + state.coins, centerX - 240, centerY + 98);
    ctx.restore();
  }

  function renderGameOver() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 260, centerY - 90, 520, 180);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 260, centerY - 90, 520, 180);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('Caught by the border!', centerX - 160, centerY - 36);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press R to restart • U for shop', centerX - 128, centerY + 8);
    ctx.restore();
  }

  function updateHud() {
    if (hudCoinsEl) hudCoinsEl.textContent = 'Coins: ' + state.coins;
    if (hudDistEl) hudDistEl.textContent = 'Dist: ' + Math.floor(state.distance);
    const spd = Math.abs(state.entities.player ? state.entities.player.vx : 0);
    if (hudSpeedEl) hudSpeedEl.textContent = 'Speed: ' + Math.floor(spd);
  }

  // Main loop
  let last = performance.now();
  function frame(now) {
    const rawDt = (now - last) / 1000;
    last = now;
    const dt = clamp(rawDt, 0, 1 / 20); // clamp to avoid big jumps
    state.time += dt;

    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // Initialize
  resetGame();
  requestAnimationFrame(frame);
})();


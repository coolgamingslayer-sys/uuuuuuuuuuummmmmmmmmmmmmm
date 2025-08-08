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
  };
  window.addEventListener('keydown', (e) => {
    const k = keyMap[e.code];
    if (k) {
      input[k] = true;
      if (k === 'up') input.jumpPressed = true;
      e.preventDefault();
    }
    if (e.code === 'KeyR') {
      if (gameOver) restart();
    }
  }, { passive: false });
  window.addEventListener('keyup', (e) => {
    const k = keyMap[e.code];
    if (k) input[k] = false;
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

  // World state
  let player, platforms, cameraX, chaserX, chaserSpeed, score, bestScore, timeAlive, gameOver, deathReason;
  let spriteFrames = null;
  let facing = 1; // 1 = right, -1 = left
  let animTimer = 0;
  let runFrameIndex = 0;

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
    };
  }

  function createPlatform(x, y, w, h) {
    return { x, y, width: w, height: h };
  }

  function aabbIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function resetWorld() {
    if (!spriteFrames) spriteFrames = createPixelManFrames();
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
      const gap = randRange(80, 220);
      const width = randRange(180, 420);
      let nextY = lastPlatformY + randRange(-140, 140);
      nextY = clamp(nextY, minY, maxY);

      const platformHeight = 24;
      const x = lastPlatformEndX + gap;
      const y = nextY;

      platforms.push(createPlatform(x, y, width, platformHeight));
      lastPlatformEndX = x + width;
      lastPlatformY = y;

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
    }
  }

  function removeBehindPlatforms(minWorldX) {
    if (platforms.length < 64) return; // cheap guard
    platforms = platforms.filter(p => p.x + p.width > minWorldX);
  }

  function update(dt) {
    if (gameOver) return;

    timeAlive += dt;

    // Difficulty ramp: slowly increase chaser speed
    const targetSpeed = Math.min(CHASER.baseSpeed + timeAlive * (CHASER.accel * 0.1), CHASER.maxSpeed);
    chaserSpeed += (targetSpeed - chaserSpeed) * Math.min(1, dt * 0.5);
    chaserX += chaserSpeed * dt;

    // Input to movement
    const desired = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    // Horizontal acceleration/deceleration
    if (desired !== 0) {
      player.vx += desired * PLAYER.runAccel * dt;
    } else {
      // decelerate towards zero
      const decel = PLAYER.runDecel * dt;
      if (Math.abs(player.vx) <= decel) player.vx = 0; else player.vx -= Math.sign(player.vx) * decel;
    }
    player.vx = clamp(player.vx, -PLAYER.maxRunSpeed, PLAYER.maxRunSpeed);

    // Jump buffering and coyote time
    if (input.jumpPressed) {
      player.jumpBufferTimer = PLAYER.jumpBufferTime;
      input.jumpPressed = false;
    } else if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer -= dt;
    }

    if (player.onGround) player.coyoteTimer = PLAYER.coyoteTime; else if (player.coyoteTimer > 0) player.coyoteTimer -= dt;

    // Apply gravity
    player.vy += GRAVITY * dt;

    // Attempt jump
    if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
      player.vy = -PLAYER.jumpVelocity;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
    }

    // Integrate and resolve collisions axis-by-axis
    // Horizontal
    player.x += player.vx * dt;
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
    player.y += player.vy * dt;
    let onGroundNow = false;
    for (const p of platforms) {
      if (aabbIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
        if (player.vy > 0) {
          player.y = p.y - player.height;
          player.vy = 0;
          onGroundNow = true;
        } else if (player.vy < 0) {
          player.y = p.y + p.height;
          player.vy = 0;
        }
      }
    }
    player.onGround = onGroundNow;

    // Camera follows ahead of player a bit
    const desiredCamX = player.x - 260 + clamp(player.vx, 0, 220) * 0.25;
    cameraX += (desiredCamX - cameraX) * Math.min(1, dt * 3);

    // Score is max distance ahead of start relative to chaser
    score = Math.max(score, Math.floor(player.x - chaserX));

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
      gameOver = true;
      deathReason = 'You fell...';
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
      ctx.fillStyle = '#25334a';
      ctx.fillRect(sx, sy, p.width, p.height);
      ctx.strokeStyle = '#3f567a';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 0.5, sy + 0.5, p.width - 1, p.height - 1);
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
    const tilt = clamp(player.vx / PLAYER.maxRunSpeed, -1, 1) * 0.15;
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

    // UI
    ctx.fillStyle = '#e8eef9';
    ctx.font = '600 16px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Speed: ${Math.round(chaserSpeed)}  Score: ${score}`, 16, 12);
    if (bestScore != null) {
      ctx.fillStyle = '#a9b8d6';
      ctx.fillText(`Best: ${bestScore}`, 16, 34);
    }

    // Controls hint
    if (timeAlive < 3 && !gameOver) {
      ctx.fillStyle = '#a9b8d6';
      ctx.textAlign = 'center';
      ctx.fillText('Move: A/D or Arrow Keys — Jump: W/Up/Space — Keep ahead of the red wall!', window.innerWidth / 2, 14);
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
      ctx.restore();
    }
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
      const speedFactor = clamp(Math.abs(player.vx) / PLAYER.maxRunSpeed, 0.5, 1.6);
      animTimer += dt * 10 * speedFactor;
      runFrameIndex = Math.floor(animTimer) % (spriteFrames ? spriteFrames.run.length : 1);
    } else if (player.onGround && !moving) {
      animTimer = 0;
      runFrameIndex = 0;
    }
    draw();
    requestAnimationFrame(frame);
  }

  // Start
  resetWorld();
  requestAnimationFrame(frame);
})();
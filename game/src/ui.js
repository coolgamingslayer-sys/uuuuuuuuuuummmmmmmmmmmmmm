const hud = document.getElementById('hud');

export function renderHud(statusItems) {
  if (!hud) return;
  hud.innerHTML = '';
  for (const item of statusItems) {
    const el = document.createElement('div');
    el.className = 'badge';
    el.textContent = item;
    hud.appendChild(el);
  }
}

export function drawTimerBanner(ctx, text) {
  ctx.save();
  ctx.font = `${Math.floor(24 * (ctx.canvas.width/1280 + ctx.canvas.height/720)/2)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const padding = 10;
  const measure = ctx.measureText(text);
  const w = measure.width + padding * 2;
  const x = ctx.canvas.width / 2 - w / 2;
  const y = 16;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, w, 40);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(x, y, w, 40);
  ctx.fillStyle = '#e6e8ef';
  ctx.fillText(text, ctx.canvas.width / 2, y + 8);
  ctx.restore();
}
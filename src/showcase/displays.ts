import { canvasTexture } from './geometry';

export function createWatchDisplay() {
  const { context: ctx, texture } = canvasTexture(410, 502);

  function draw(mode: number, progress = 1) {
    ctx.fillStyle = '#070708';
    ctx.fillRect(0, 0, 410, 502);
    if (mode === 0) {
      ctx.fillStyle = '#929298';
      ctx.beginPath();
      ctx.arc(205, 232, 155, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#161616';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(205, 232);
      ctx.lineTo(158, 361);
      ctx.stroke();
      ctx.fillStyle = '#161616';
      ctx.beginPath();
      ctx.arc(205, 232, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '600 50px monospace';
      ctx.fillText('10:08', 97, 181);
      ctx.fillStyle = '#fa4c21';
      ctx.beginPath();
      ctx.arc(296, 164, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2dfdb';
      ctx.font = '500 21px sans-serif';
      ctx.fillText('Пульс  72', 65, 442);
      ctx.fillText('Шаги  6240', 218, 442);
    } else if (mode === 1) {
      ctx.lineWidth = 21;
      ctx.lineCap = 'round';
      for (let index = 0; index < 3; index++) {
        const y = 175 + index * 68;
        const width = [245, 188, 117][index];
        ctx.strokeStyle = '#262528';
        ctx.beginPath();
        ctx.moveTo(79, y);
        ctx.lineTo(320, y);
        ctx.stroke();
        ctx.strokeStyle = ['#ff591f', '#ef733e', '#d8441d'][index];
        ctx.beginPath();
        ctx.moveTo(79, y);
        ctx.lineTo(79 + width * progress, y);
        ctx.stroke();
      }
    } else {
      const points = [[25,255],[77,255],[110,229],[132,255],[172,255],[195,176],[219,312],
        [240,226],[265,255],[293,255],[315,228],[341,255],[385,255]];
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 410 * progress, 502);
      ctx.clip();
      ctx.strokeStyle = '#fb602e';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
      ctx.restore();
    }
    texture.needsUpdate = true;
  }

  draw(0);
  return { texture, draw };
}

export function createPhoneDisplay() {
  const { context: ctx, texture } = canvasTexture(420, 890);
  const background = ctx.createLinearGradient(0, 0, 420, 890);
  background.addColorStop(0, '#09171b');
  background.addColorStop(.62, '#314e58');
  background.addColorStop(1, '#0e181e');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 420, 890);
  for (let index = 0; index < 3; index++) {
    const y = 213 + index * 198;
    const ribbon = ctx.createLinearGradient(0, y - 180, 360, y + 235);
    ribbon.addColorStop(0, '#152e37');
    ribbon.addColorStop(.50, '#83a2a4');
    ribbon.addColorStop(.71, '#36535e');
    ribbon.addColorStop(1, '#15222c');
    ctx.fillStyle = ribbon;
    ctx.beginPath();
    ctx.moveTo(-40, y + 88);
    ctx.bezierCurveTo(38, y - 75, 278, y + 97, 463, y - 160);
    ctx.lineTo(463, y + 210);
    ctx.bezierCurveTo(314, y + 96, 120, y + 267, -40, y + 182);
    ctx.fill();
  }
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.arc(210, 23, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8ded1';
  ctx.fillRect(160, 866, 100, 4);
  texture.needsUpdate = true;
  return texture;
}

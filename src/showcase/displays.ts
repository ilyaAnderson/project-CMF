import { canvasTexture } from './geometry';

export const watchModes = ['Время', 'Тренировка', 'Звонок'] as const;

export function createWatchDisplay() {
  const { context: ctx, texture } = canvasTexture(410, 502);

  function draw(mode: number) {
    ctx.fillStyle = '#070708';
    ctx.fillRect(0, 0, 410, 502);
    ctx.fillStyle = '#fe5b2b';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(mode === 0 ? 'ПН  24' : mode === 1 ? 'БЕГ · GPS' : 'ВХОДЯЩИЙ', 45, 70);
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
      ctx.font = '700 67px sans-serif';
      ctx.fillStyle = '#f5eeea';
      ctx.fillText('3,24', 45, 175);
      ctx.font = '500 28px sans-serif';
      ctx.fillText('км', 216, 173);
      ctx.strokeStyle = '#fa6635';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      [[63,345], [91,286], [151,303], [177,248], [244,262], [285,217], [347,237]].forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = '#bdd770';
      ctx.beginPath();
      ctx.arc(347, 237, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ece5e0';
      ctx.fillText('18:24     5:41 / км', 45, 435);
    } else {
      ctx.fillStyle = '#342018';
      ctx.beginPath();
      ctx.arc(205, 163, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff774b';
      ctx.textAlign = 'center';
      ctx.font = '700 46px sans-serif';
      ctx.fillText('А', 205, 180);
      ctx.fillStyle = '#f5eeea';
      ctx.font = '700 36px sans-serif';
      ctx.fillText('Анна', 205, 283);
      ctx.font = '600 23px sans-serif';
      ctx.fillText('По Bluetooth', 205, 322);
      for (const [x, color, icon] of [[127, '#a73228', '×'], [283, '#376849', '✓']] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, 413, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff2ea';
        ctx.font = '600 40px sans-serif';
        ctx.fillText(icon, x, 427);
      }
      ctx.textAlign = 'left';
    }
    texture.needsUpdate = true;
  }

  draw(0);
  return { texture, draw };
}

export function createPhoneDisplay() {
  const { context: ctx, texture } = canvasTexture(420, 890);
  ctx.fillStyle = '#0c0d0e';
  ctx.fillRect(0, 0, 420, 890);
  for (let y = 0; y < 52; y++) {
    for (let x = 0; x < 38; x++) {
      const distance = Math.hypot(x - 20, (y - 27) * 1.05);
      const band = .44 + .56 * Math.cos(distance * .64 + y * .31);
      if (distance > 22 || band < .33) continue;
      ctx.fillStyle = `rgba(225,216,211,${(1 - distance / 24) * band * .83})`;
      ctx.beginPath();
      ctx.arc(22 + x * 10, 309 + y * 10, 1.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#fcf1e9';
  ctx.font = '700 93px sans-serif';
  ctx.fillText('10:08', 29, 205);
  ctx.font = '500 20px sans-serif';
  ctx.fillText('ПОНЕДЕЛЬНИК, 24', 35, 244);
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.arc(210, 23, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8ded1';
  ctx.fillRect(160, 866, 100, 4);
  texture.needsUpdate = true;
  return texture;
}

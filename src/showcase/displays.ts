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
      const colors = ['#e8e1dc', '#fe5b2b'];
      for (let i = 0; i < 60; i++) {
        const angle = i / 60 * Math.PI * 2 - Math.PI / 2;
        const size = i % 5 === 0 ? 11 : 4;
        ctx.strokeStyle = i < 42 ? colors[1] : '#533125';
        ctx.lineWidth = i % 5 === 0 ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(205 + Math.cos(angle) * 160, 263 + Math.sin(angle) * 160);
        ctx.lineTo(205 + Math.cos(angle) * (160 - size), 263 + Math.sin(angle) * (160 - size));
        ctx.stroke();
      }
      ctx.fillStyle = colors[0];
      ctx.font = '700 83px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('10:08', 205, 282);
      ctx.font = '500 21px sans-serif';
      ctx.fillText('♥  72', 205, 330);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff774b';
      ctx.fillRect(162, 451, 86, 4);
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
  const wash = ctx.createLinearGradient(0, 0, 420, 890);
  wash.addColorStop(0, '#171413');
  wash.addColorStop(.47, '#29100c');
  wash.addColorStop(1, '#09090a');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 420, 890);
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(255, ${58 + i * 7}, ${17 + i * 3}, ${.87 - i * .052})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(327, 590, 200 + i * 12, 85 + i * 10, -.72, 0, Math.PI * 2);
    ctx.stroke();
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

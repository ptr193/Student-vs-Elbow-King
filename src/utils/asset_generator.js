// 程序化素材生成器 - 使用离屏 Canvas 生成所有精灵纹理
// 高质量渲染：渐变、阴影、光晕、多层细节、抗锯齿

// 工具：圆角矩形
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 工具：绘制带描边和阴影的圆角矩形
function panel(ctx, x, y, w, h, r, fill, stroke, shadowBlur, shadowColor) {
  ctx.save();
  if (shadowBlur) {
    ctx.shadowColor = shadowColor || 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = shadowBlur;
  }
  if (fill) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  }
  if (stroke) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
  }
  ctx.restore();
}

export function generateTexture(key, params = {}) {
  const canvas = document.createElement('canvas');
  const size = params.size || 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  const s = size / 64; // 基准缩放
  const fn = GENERATORS[key];
  if (fn) fn(ctx, s, size, params);
  return canvas;
}

const GENERATORS = {
  // 纸片人 - 带纸张纹理、折角、墨迹
  paperling(ctx, s) {
    // 阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8 * s;
    ctx.shadowOffsetY = 3 * s;
    // 纸张主体（带渐变）
    const g = ctx.createLinearGradient(10 * s, 8 * s, 10 * s, 56 * s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#f8f9fa');
    g.addColorStop(1, '#e9ecef');
    ctx.fillStyle = g;
    roundRect(ctx, 10 * s, 8 * s, 44 * s, 48 * s, 3 * s);
    ctx.fill();
    ctx.restore();
    // 纸张边框
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1.5 * s;
    roundRect(ctx, 10 * s, 8 * s, 44 * s, 48 * s, 3 * s);
    ctx.stroke();
    // 折角
    ctx.fillStyle = '#dee2e6';
    ctx.beginPath();
    ctx.moveTo(54 * s, 8 * s);
    ctx.lineTo(54 * s, 18 * s);
    ctx.lineTo(44 * s, 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 1 * s;
    ctx.stroke();
    // 墨迹纹理（手写横线）
    ctx.strokeStyle = 'rgba(52,58,64,0.35)';
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(16 * s, 22 * s); ctx.lineTo(48 * s, 22 * s);
    ctx.moveTo(16 * s, 30 * s); ctx.lineTo(44 * s, 30 * s);
    ctx.moveTo(16 * s, 38 * s); ctx.lineTo(40 * s, 38 * s);
    ctx.moveTo(16 * s, 46 * s); ctx.lineTo(50 * s, 46 * s);
    ctx.stroke();
    // 眼睛（带高光）
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.ellipse(22 * s, 18 * s, 3 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(42 * s, 18 * s, 3 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(21 * s, 17 * s, 1 * s, 0, Math.PI * 2);
    ctx.arc(41 * s, 17 * s, 1 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 红叉兵 - 深色方块配红色发光叉号
  redmarker(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6 * s;
    const g = ctx.createLinearGradient(12 * s, 10 * s, 52 * s, 54 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(1, '#212529');
    ctx.fillStyle = g;
    roundRect(ctx, 12 * s, 10 * s, 40 * s, 44 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 1.5 * s;
    roundRect(ctx, 12 * s, 10 * s, 40 * s, 44 * s, 4 * s);
    ctx.stroke();
    // 红色发光叉号
    ctx.save();
    ctx.shadowColor = '#fa5252';
    ctx.shadowBlur = 12 * s;
    ctx.strokeStyle = '#fa5252';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(18 * s, 16 * s); ctx.lineTo(46 * s, 44 * s);
    ctx.moveTo(46 * s, 16 * s); ctx.lineTo(18 * s, 44 * s);
    ctx.stroke();
    ctx.restore();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(23 * s, 24 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.arc(41 * s, 24 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fa5252';
    ctx.beginPath();
    ctx.arc(23 * s, 24 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.arc(41 * s, 24 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 墨滴 - 带高光和飞溅效果
  inkdrop(ctx, s) {
    // 飞溅小点
    ctx.fillStyle = 'rgba(33,37,41,0.4)';
    ctx.beginPath();
    ctx.arc(14 * s, 18 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(50 * s, 14 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.arc(52 * s, 40 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    // 主体（径向渐变）
    const g = ctx.createRadialGradient(26 * s, 24 * s, 2, 32 * s, 32 * s, 24 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(0.4, '#212529');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32 * s, 30 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(24 * s, 22 * s, 5 * s, 3.5 * s, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // 滴落尖
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.moveTo(28 * s, 48 * s);
    ctx.quadraticCurveTo(32 * s, 58 * s, 36 * s, 48 * s);
    ctx.closePath();
    ctx.fill();
  },

  // 纸飞机 - 带渐变和折线
  paperplane(ctx, s) {
    // 主体渐变
    const g = ctx.createLinearGradient(8 * s, 16 * s, 56 * s, 48 * s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#ced4da');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(8 * s, 32 * s);
    ctx.lineTo(56 * s, 14 * s);
    ctx.lineTo(56 * s, 50 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#868e96';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    // 折线（机身中线）
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(56 * s, 14 * s);
    ctx.lineTo(22 * s, 34 * s);
    ctx.lineTo(56 * s, 50 * s);
    ctx.stroke();
    // 机翼阴影
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(8 * s, 32 * s);
    ctx.lineTo(22 * s, 34 * s);
    ctx.lineTo(56 * s, 50 * s);
    ctx.closePath();
    ctx.fill();
  },

  // 铃铛手 - 带金属光泽和发光
  bellringer(ctx, s) {
    // 铃体渐变
    const g = ctx.createLinearGradient(16 * s, 12 * s, 48 * s, 44 * s);
    g.addColorStop(0, '#ffec99');
    g.addColorStop(0.5, '#ffd43b');
    g.addColorStop(1, '#f59f00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(16 * s, 12 * s);
    ctx.quadraticCurveTo(12 * s, 12 * s, 14 * s, 16 * s);
    ctx.lineTo(20 * s, 44 * s);
    ctx.quadraticCurveTo(20 * s, 48 * s, 24 * s, 48 * s);
    ctx.lineTo(40 * s, 48 * s);
    ctx.quadraticCurveTo(44 * s, 48 * s, 44 * s, 44 * s);
    ctx.lineTo(50 * s, 16 * s);
    ctx.quadraticCurveTo(52 * s, 12 * s, 48 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e67700';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    // 顶部环
    ctx.strokeStyle = '#f59f00';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 10 * s, 5 * s, 0, Math.PI * 2);
    ctx.stroke();
    // 铃舌
    ctx.fillStyle = '#e67700';
    ctx.beginPath();
    ctx.arc(32 * s, 46 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    // 发光高光
    ctx.save();
    ctx.shadowColor = '#fff3bf';
    ctx.shadowBlur = 8 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(24 * s, 22 * s, 4 * s, 6 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // 堆积体 - 多层试卷堆叠
  stackpile(ctx, s) {
    const colors = ['#495057', '#343a40', '#212529'];
    for (let i = 0; i < 3; i++) {
      const y = (16 + i * 14) * s;
      const w = (48 - i * 8) * s;
      const x = (8 + i * 4) * s;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3 * s;
      const g = ctx.createLinearGradient(x, y, x, y + 14 * s);
      g.addColorStop(0, colors[i]);
      g.addColorStop(1, '#000');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, w, 14 * s, 1 * s);
      ctx.fill();
      ctx.restore();
      // 纸张边缘高光
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 1, y + 1, w - 2, 2 * s);
    }
    // 顶部纸条
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(20 * s, 13 * s, 12 * s, 4 * s);
  },

  // 回声 - 半透明发光幽灵
  echo(ctx, s) {
    // 外发光
    ctx.save();
    ctx.shadowColor = '#aab0ff';
    ctx.shadowBlur = 15 * s;
    const g = ctx.createRadialGradient(32 * s, 32 * s, 4, 32 * s, 32 * s, 24 * s);
    g.addColorStop(0, 'rgba(170,176,255,0.8)');
    g.addColorStop(0.7, 'rgba(170,176,255,0.4)');
    g.addColorStop(1, 'rgba(170,176,255,0.1)');
    ctx.fillStyle = g;
    roundRect(ctx, 14 * s, 8 * s, 36 * s, 48 * s, 6 * s);
    ctx.fill();
    ctx.restore();
    // 轮廓
    ctx.strokeStyle = 'rgba(170,176,255,0.9)';
    ctx.lineWidth = 2 * s;
    roundRect(ctx, 14 * s, 8 * s, 36 * s, 48 * s, 6 * s);
    ctx.stroke();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(24 * s, 22 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(40 * s, 22 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#748ffc';
    ctx.beginPath();
    ctx.arc(24 * s, 22 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(40 * s, 22 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    // 底部波浪
    ctx.strokeStyle = 'rgba(170,176,255,0.6)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(14 * s, 54 * s);
    ctx.quadraticCurveTo(20 * s, 58 * s, 26 * s, 54 * s);
    ctx.quadraticCurveTo(32 * s, 50 * s, 38 * s, 54 * s);
    ctx.quadraticCurveTo(44 * s, 58 * s, 50 * s, 54 * s);
    ctx.stroke();
  },

  // 批改者 - 持红笔的小人
  corrector(ctx, s) {
    // 身体
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4 * s;
    const g = ctx.createLinearGradient(20 * s, 18 * s, 44 * s, 54 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(1, '#212529');
    ctx.fillStyle = g;
    roundRect(ctx, 20 * s, 18 * s, 24 * s, 36 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    // 红笔（带发光）
    ctx.save();
    ctx.translate(44 * s, 40 * s);
    ctx.rotate(-0.3);
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 6 * s;
    const pg = ctx.createLinearGradient(0, 0, 20 * s, 0);
    pg.addColorStop(0, '#fa5252');
    pg.addColorStop(1, '#c92a2a');
    ctx.fillStyle = pg;
    roundRect(ctx, 0, -3 * s, 20 * s, 6 * s, 2 * s);
    ctx.fill();
    ctx.restore();
    // 笔尖发光
    ctx.save();
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10 * s;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(46 * s, 36 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 眼睛
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath();
    ctx.arc(27 * s, 26 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.arc(37 * s, 26 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 读卡机 - 带扫描线和发光窗口
  reader(ctx, s, size, params) {
    const phase = params.phase || 1;
    const baseColor = phase === 1 ? '#343a40' : '#5c2a4a';
    const winColor = phase === 1 ? 'rgba(77,171,247,0.9)' : 'rgba(186,73,255,0.9)';
    const scanColor = phase === 1 ? '#ff6b6b' : '#cc5de8';
    // 主体
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6 * s;
    const g = ctx.createLinearGradient(8 * s, 12 * s, 56 * s, 56 * s);
    g.addColorStop(0, baseColor);
    g.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = g;
    roundRect(ctx, 8 * s, 12 * s, 48 * s, 44 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2 * s;
    roundRect(ctx, 8 * s, 12 * s, 48 * s, 44 * s, 4 * s);
    ctx.stroke();
    // 读取窗口（发光）
    ctx.save();
    ctx.shadowColor = winColor;
    ctx.shadowBlur = 10 * s;
    ctx.fillStyle = winColor;
    roundRect(ctx, 16 * s, 22 * s, 32 * s, 20 * s, 2 * s);
    ctx.fill();
    ctx.restore();
    // 扫描线
    ctx.strokeStyle = scanColor;
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    const scanY = 22 + ((Date.now() / 50) % 20);
    ctx.beginPath();
    ctx.moveTo(16 * s, scanY * s);
    ctx.lineTo(48 * s, scanY * s);
    ctx.stroke();
    // 顶部指示灯
    ctx.fillStyle = phase === 1 ? '#51cf66' : '#fa5252';
    ctx.beginPath();
    ctx.arc(32 * s, 17 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 通告板 - 带纸条和图钉
  bulletin(ctx, s, size, params) {
    const phase = params.phase || 1;
    const color = phase === 1 ? '#495057' : phase === 2 ? '#5c2a2a' : '#3a2a1a';
    // 主体
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6 * s;
    const g = ctx.createLinearGradient(6 * s, 4 * s, 58 * s, 60 * s);
    g.addColorStop(0, color);
    g.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = g;
    roundRect(ctx, 6 * s, 4 * s, 52 * s, 56 * s, 3 * s);
    ctx.fill();
    ctx.restore();
    // 木框
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 3 * s;
    roundRect(ctx, 6 * s, 4 * s, 52 * s, 56 * s, 3 * s);
    ctx.stroke();
    // 纸条
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 2 * s;
      ctx.fillStyle = phase >= 2 ? '#fa5252' : '#e9ecef';
      const ty = (8 + i * 10) * s;
      roundRect(ctx, 10 * s, ty, 44 * s, 7 * s, 1 * s);
      ctx.fill();
      ctx.restore();
      // 图钉
      ctx.fillStyle = '#fa5252';
      ctx.beginPath();
      ctx.arc(12 * s, ty + 3.5 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // 顶部警示
    ctx.save();
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 6 * s;
    ctx.fillStyle = '#ffd43b';
    ctx.font = `bold ${10 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⚠', 32 * s, 14 * s);
    ctx.restore();
  },

  // 计时器 - 带齿轮和数字
  timer(ctx, s, size, params) {
    const phase = params.phase || 1;
    const bgColor = phase === 1 ? '#212529' : '#5c2a2a';
    const numColor = phase === 1 ? '#fff' : '#fa5252';
    // 外圈渐变
    const g = ctx.createRadialGradient(32 * s, 32 * s, 4, 32 * s, 32 * s, 28 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(0.7, bgColor);
    g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
    // 金属边框
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 26 * s, 0, Math.PI * 2);
    ctx.stroke();
    // 内圈
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 22 * s, 0, Math.PI * 2);
    ctx.stroke();
    // 数字
    ctx.save();
    ctx.shadowColor = numColor;
    ctx.shadowBlur = 8 * s;
    ctx.fillStyle = numColor;
    ctx.font = `bold ${20 * s}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 32 * s, 33 * s);
    ctx.restore();
    // 刻度
    ctx.strokeStyle = '#868e96';
    ctx.lineWidth = 1.5 * s;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const r1 = 24 * s, r2 = 27 * s;
      ctx.beginPath();
      ctx.moveTo(32 * s + Math.cos(a) * r1, 32 * s + Math.sin(a) * r1);
      ctx.lineTo(32 * s + Math.cos(a) * r2, 32 * s + Math.sin(a) * r2);
      ctx.stroke();
    }
  },

  // 抄写板 - 带粉笔轨迹
  chalkboard(ctx, s, size, params) {
    const phase = params.phase || 1;
    const boardColor = phase === 1 ? '#2b4a3a' : '#3a1a1a';
    const chalkColor = phase === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(250,82,82,0.85)';
    // 黑板渐变
    const g = ctx.createLinearGradient(6 * s, 10 * s, 58 * s, 56 * s);
    g.addColorStop(0, boardColor);
    g.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = g;
    roundRect(ctx, 6 * s, 10 * s, 52 * s, 46 * s, 2 * s);
    ctx.fill();
    // 木框
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 4 * s;
    roundRect(ctx, 6 * s, 10 * s, 52 * s, 46 * s, 2 * s);
    ctx.stroke();
    // 粉笔轨迹
    ctx.strokeStyle = chalkColor;
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    const t = Date.now() / 200;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(10 * s, (16 + i * 12 + Math.sin(t + i) * 3) * s);
      ctx.lineTo(54 * s, (16 + i * 12 + Math.cos(t + i) * 3) * s);
      ctx.stroke();
    }
    // 粉笔灰
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc((12 + i * 6) * s, (50 + (i % 3) * 2) * s, 0.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 排名表 - 带数字流和皇冠
  ranking(ctx, s, size, params) {
    const phase = params.phase || 1;
    const bgColor = phase === 1 ? '#1a1a2e' : '#2e1a1a';
    const numColor = phase === 1 ? '#51cf66' : '#fa5252';
    // 主体
    const g = ctx.createLinearGradient(8 * s, 4 * s, 56 * s, 60 * s);
    g.addColorStop(0, bgColor);
    g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    roundRect(ctx, 8 * s, 4 * s, 48 * s, 56 * s, 3 * s);
    ctx.fill();
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2 * s;
    roundRect(ctx, 8 * s, 4 * s, 48 * s, 56 * s, 3 * s);
    ctx.stroke();
    // 数字流（发光）
    ctx.save();
    ctx.shadowColor = numColor;
    ctx.shadowBlur = 4 * s;
    ctx.fillStyle = numColor;
    ctx.font = `${7 * s}px monospace`;
    ctx.textAlign = 'center';
    const t = Math.floor(Date.now() / 300);
    for (let i = 0; i < 7; i++) {
      const num = (t + i * 7) % 100;
      ctx.globalAlpha = 0.5 + (i % 3) * 0.15;
      ctx.fillText(String(num).padStart(2, '0'), 32 * s, (12 + i * 7) * s);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // 皇冠（发光）
    ctx.save();
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 8 * s;
    ctx.fillStyle = '#ffd43b';
    ctx.font = `bold ${12 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('♛', 32 * s, 11 * s);
    ctx.restore();
  },

  // 审判台 - 带法槌和天平
  tribunal(ctx, s, size, params) {
    const phase = params.phase || 1;
    const baseColor = phase === 1 ? '#2a2a3a' : phase === 2 ? '#3a1a2a' : '#1a0a1a';
    const gavelColor = phase >= 2 ? '#c92a2a' : '#868e96';
    // 台面
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6 * s;
    const g = ctx.createLinearGradient(12 * s, 24 * s, 52 * s, 56 * s);
    g.addColorStop(0, baseColor);
    g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    roundRect(ctx, 12 * s, 24 * s, 40 * s, 32 * s, 3 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2 * s;
    roundRect(ctx, 12 * s, 24 * s, 40 * s, 32 * s, 3 * s);
    ctx.stroke();
    // 法槌
    ctx.fillStyle = gavelColor;
    roundRect(ctx, 28 * s, 6 * s, 8 * s, 20 * s, 2 * s);
    ctx.fill();
    ctx.fillStyle = gavelColor;
    roundRect(ctx, 22 * s, 4 * s, 20 * s, 8 * s, 2 * s);
    ctx.fill();
    // 天平
    ctx.save();
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 6 * s;
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(16 * s, 30 * s);
    ctx.lineTo(48 * s, 30 * s);
    ctx.stroke();
    // 天平盘
    ctx.fillStyle = 'rgba(255,212,59,0.5)';
    ctx.beginPath();
    ctx.moveTo(14 * s, 30 * s);
    ctx.lineTo(18 * s, 30 * s);
    ctx.lineTo(16 * s, 36 * s);
    ctx.closePath();
    ctx.moveTo(46 * s, 30 * s);
    ctx.lineTo(50 * s, 30 * s);
    ctx.lineTo(48 * s, 36 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 中心宝石
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.arc(32 * s, 42 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 肘击王 P1 - 带发光眼睛和肌肉纹理
  zjw1(ctx, s) {
    // 阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10 * s;
    // 身体渐变
    const bg = ctx.createLinearGradient(14 * s, 16 * s, 50 * s, 56 * s);
    bg.addColorStop(0, '#3a2a4a');
    bg.addColorStop(1, '#1a0a2a');
    ctx.fillStyle = bg;
    roundRect(ctx, 14 * s, 16 * s, 36 * s, 40 * s, 6 * s);
    ctx.fill();
    // 头部
    const hg = ctx.createLinearGradient(20 * s, 4 * s, 44 * s, 20 * s);
    hg.addColorStop(0, '#4a3a5a');
    hg.addColorStop(1, '#2a1a3a');
    ctx.fillStyle = hg;
    roundRect(ctx, 20 * s, 4 * s, 24 * s, 16 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    // 身体轮廓
    ctx.strokeStyle = '#ff006e';
    ctx.lineWidth = 1.5 * s;
    roundRect(ctx, 14 * s, 16 * s, 36 * s, 40 * s, 6 * s);
    ctx.stroke();
    // 发光眼睛
    ctx.save();
    ctx.shadowColor = '#ff006e';
    ctx.shadowBlur = 10 * s;
    ctx.fillStyle = '#ff006e';
    ctx.beginPath();
    ctx.arc(26 * s, 12 * s, 3 * s, 0, Math.PI * 2);
    ctx.arc(38 * s, 12 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 肘部装甲（发光）
    ctx.save();
    ctx.shadowColor = '#ff006e';
    ctx.shadowBlur = 8 * s;
    const eg = ctx.createRadialGradient(11 * s, 33 * s, 2, 11 * s, 33 * s, 8 * s);
    eg.addColorStop(0, '#ff006e');
    eg.addColorStop(1, '#4a1a2a');
    ctx.fillStyle = eg;
    roundRect(ctx, 6 * s, 28 * s, 10 * s, 10 * s, 3 * s);
    ctx.fill();
    const eg2 = ctx.createRadialGradient(53 * s, 33 * s, 2, 53 * s, 33 * s, 8 * s);
    eg2.addColorStop(0, '#ff006e');
    eg2.addColorStop(1, '#4a1a2a');
    ctx.fillStyle = eg2;
    roundRect(ctx, 48 * s, 28 * s, 10 * s, 10 * s, 3 * s);
    ctx.fill();
    ctx.restore();
    // 胸口印记
    ctx.strokeStyle = '#ff006e';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(32 * s, 24 * s);
    ctx.lineTo(32 * s, 44 * s);
    ctx.moveTo(24 * s, 34 * s);
    ctx.lineTo(40 * s, 34 * s);
    ctx.stroke();
  },

  // 肘击王 P2 - 狂暴形态
  zjw2(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10 * s;
    const bg = ctx.createLinearGradient(12 * s, 14 * s, 52 * s, 56 * s);
    bg.addColorStop(0, '#5a1a2a');
    bg.addColorStop(1, '#1a0a0a');
    ctx.fillStyle = bg;
    roundRect(ctx, 12 * s, 14 * s, 40 * s, 42 * s, 6 * s);
    ctx.fill();
    const hg = ctx.createLinearGradient(18 * s, 2 * s, 46 * s, 18 * s);
    hg.addColorStop(0, '#6a2a3a');
    hg.addColorStop(1, '#3a0a1a');
    ctx.fillStyle = hg;
    roundRect(ctx, 18 * s, 2 * s, 28 * s, 16 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    // 狂暴光晕
    ctx.save();
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 12 * s;
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.arc(24 * s, 10 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.arc(40 * s, 10 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 利爪
    ctx.save();
    ctx.shadowColor = '#ff006e';
    ctx.shadowBlur = 8 * s;
    ctx.fillStyle = '#ff006e';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((4 + i * 3) * s, 30 * s);
      ctx.lineTo((7 + i * 3) * s, 30 * s);
      ctx.lineTo((5.5 + i * 3) * s, 48 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo((57 - i * 3) * s, 30 * s);
      ctx.lineTo((54 - i * 3) * s, 30 * s);
      ctx.lineTo((55.5 - i * 3) * s, 48 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // 嘴部獠牙
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(28 * s, 16 * s);
    ctx.lineTo(30 * s, 16 * s);
    ctx.lineTo(29 * s, 20 * s);
    ctx.closePath();
    ctx.moveTo(34 * s, 16 * s);
    ctx.lineTo(36 * s, 16 * s);
    ctx.lineTo(35 * s, 20 * s);
    ctx.closePath();
    ctx.fill();
  },

  // 道具图标
  item_ink(ctx, s) {
    const g = ctx.createLinearGradient(20 * s, 10 * s, 44 * s, 50 * s);
    g.addColorStop(0, '#2a2a2a');
    g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    roundRect(ctx, 20 * s, 14 * s, 24 * s, 36 * s, 3 * s);
    ctx.fill();
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 1.5 * s;
    roundRect(ctx, 20 * s, 14 * s, 24 * s, 36 * s, 3 * s);
    ctx.stroke();
    // 瓶盖
    ctx.fillStyle = '#495057';
    roundRect(ctx, 24 * s, 8 * s, 16 * s, 8 * s, 2 * s);
    ctx.fill();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, 24 * s, 18 * s, 5 * s, 18 * s, 2 * s);
    ctx.fill();
    // 标签
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(24 * s, 36 * s, 16 * s, 6 * s);
  },
  item_red_pen(ctx, s) {
    ctx.save();
    ctx.translate(32 * s, 32 * s);
    ctx.rotate(-0.5);
    const g = ctx.createLinearGradient(-4 * s, -22 * s, 4 * s, 22 * s);
    g.addColorStop(0, '#ff6b6b');
    g.addColorStop(0.5, '#fa5252');
    g.addColorStop(1, '#c92a2a');
    ctx.fillStyle = g;
    roundRect(ctx, -4 * s, -22 * s, 8 * s, 44 * s, 2 * s);
    ctx.fill();
    ctx.restore();
    // 笔尖
    ctx.fillStyle = '#1a1a1a';
    ctx.save();
    ctx.translate(20 * s, 50 * s);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.moveTo(-3 * s, 0);
    ctx.lineTo(3 * s, 0);
    ctx.lineTo(0, 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 笔夹
    ctx.fillStyle = '#ffd43b';
    ctx.save();
    ctx.translate(32 * s, 32 * s);
    ctx.rotate(-0.5);
    ctx.fillRect(2 * s, -18 * s, 3 * s, 14 * s);
    ctx.restore();
  },
  item_paperclip(ctx, s) {
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 16 * s, -0.3, Math.PI * 1.7);
    ctx.stroke();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 10 * s, Math.PI * 0.3, Math.PI * 2.3);
    ctx.stroke();
    // 高光
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 16 * s, -0.3, 0.5);
    ctx.stroke();
  },
  item_gold(ctx, s) {
    const g = ctx.createRadialGradient(26 * s, 26 * s, 3, 32 * s, 32 * s, 20 * s);
    g.addColorStop(0, '#fff3bf');
    g.addColorStop(0.3, '#ffd43b');
    g.addColorStop(1, '#f59f00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e67700';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    // $ 符号
    ctx.fillStyle = '#c92a2a';
    ctx.font = `bold ${18 * s}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 32 * s, 33 * s);
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(25 * s, 25 * s, 4 * s, 3 * s, -0.5, 0, Math.PI * 2);
    ctx.fill();
  },
};

// 玩家精灵（起义军）- 高质量版本
export function generatePlayerTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 1.92;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  const s = size / 60;

  // 阴影
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4 * s;

  // 腿
  const legGrad = ctx.createLinearGradient(18 * s, 50 * s, 42 * s, 70 * s);
  legGrad.addColorStop(0, '#2a2a2a');
  legGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = legGrad;
  roundRect(ctx, 18 * s, 50 * s, 10 * s, 20 * s, 2 * s);
  ctx.fill();
  roundRect(ctx, 32 * s, 50 * s, 10 * s, 20 * s, 2 * s);
  ctx.fill();
  // 鞋
  ctx.fillStyle = '#495057';
  roundRect(ctx, 16 * s, 66 * s, 14 * s, 6 * s, 2 * s);
  ctx.fill();
  roundRect(ctx, 30 * s, 66 * s, 14 * s, 6 * s, 2 * s);
  ctx.fill();

  // 身体（红白条纹外套）
  const bodyGrad = ctx.createLinearGradient(14 * s, 22 * s, 46 * s, 50 * s);
  bodyGrad.addColorStop(0, '#2a2a2a');
  bodyGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, 14 * s, 22 * s, 32 * s, 28 * s, 4 * s);
  ctx.fill();
  // 红条纹
  ctx.fillStyle = '#fa5252';
  roundRect(ctx, 14 * s, 28 * s, 32 * s, 8 * s, 2 * s);
  ctx.fill();
  // 白条纹
  ctx.fillStyle = '#e9ecef';
  ctx.fillRect(14 * s, 26 * s, 32 * s, 2 * s);
  ctx.fillRect(14 * s, 36 * s, 32 * s, 2 * s);
  // 外套轮廓
  ctx.strokeStyle = '#495057';
  ctx.lineWidth = 1 * s;
  roundRect(ctx, 14 * s, 22 * s, 32 * s, 28 * s, 4 * s);
  ctx.stroke();

  // 手
  ctx.fillStyle = '#f0c090';
  roundRect(ctx, 10 * s, 30 * s, 6 * s, 10 * s, 2 * s);
  ctx.fill();
  roundRect(ctx, 44 * s, 30 * s, 6 * s, 10 * s, 2 * s);
  ctx.fill();

  // 头
  const headGrad = ctx.createRadialGradient(30 * s, 10 * s, 2, 30 * s, 12 * s, 14 * s);
  headGrad.addColorStop(0, '#f5d5a8');
  headGrad.addColorStop(1, '#d4a574');
  ctx.fillStyle = headGrad;
  roundRect(ctx, 20 * s, 4 * s, 20 * s, 18 * s, 4 * s);
  ctx.fill();

  ctx.restore();

  // 头发
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, 18 * s, 2 * s, 24 * s, 8 * s, 3 * s);
  ctx.fill();
  ctx.fillRect(18 * s, 4 * s, 6 * s, 10 * s);
  ctx.fillRect(36 * s, 4 * s, 6 * s, 10 * s);

  // 眼睛
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(25 * s, 13 * s, 1.8 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(35 * s, 13 * s, 1.8 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // 眼睛高光
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(24.5 * s, 12 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.arc(34.5 * s, 12 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();
  // 嘴
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 1.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(28 * s, 17 * s);
  ctx.lineTo(32 * s, 17 * s);
  ctx.stroke();

  // 武器（手枪）
  ctx.fillStyle = '#212529';
  roundRect(ctx, 46 * s, 32 * s, 12 * s, 6 * s, 1 * s);
  ctx.fill();
  ctx.fillStyle = '#495057';
  roundRect(ctx, 48 * s, 38 * s, 6 * s, 8 * s, 1 * s);
  ctx.fill();

  return canvas;
}

// 肘击王立绘（直接用图片）
export function generateBossTexture(image, size = 192) {
  if (!image) return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, size, size * 2);
  return canvas;
}

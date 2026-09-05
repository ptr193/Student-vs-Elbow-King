// 程序化素材生成器 - 使用离屏 Canvas 生成所有精灵纹理
// 无外部素材依赖，所有美术资源由代码绘制

export function generateTexture(key, params = {}) {
  const canvas = document.createElement('canvas');
  const size = params.size || 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const s = size / 64; // 基准缩放
  const fn = GENERATORS[key];
  if (fn) fn(ctx, s, size, params);
  return canvas;
}

const GENERATORS = {
  // 纸片人
  paperling(ctx, s) {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(10 * s, 8 * s, 44 * s, 48 * s);
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(10 * s, 8 * s, 44 * s, 48 * s);
    // 墨迹纹理
    ctx.fillStyle = 'rgba(33,37,41,0.3)';
    ctx.fillRect(16 * s, 16 * s, 32 * s, 2 * s);
    ctx.fillRect(16 * s, 24 * s, 28 * s, 2 * s);
    ctx.fillRect(16 * s, 32 * s, 20 * s, 2 * s);
    ctx.fillRect(16 * s, 40 * s, 36 * s, 2 * s);
    // 眼睛
    ctx.fillStyle = '#212529';
    ctx.fillRect(20 * s, 20 * s, 4 * s, 4 * s);
    ctx.fillRect(40 * s, 20 * s, 4 * s, 4 * s);
  },

  // 红叉兵
  redmarker(ctx, s) {
    ctx.fillStyle = '#495057';
    ctx.fillRect(12 * s, 10 * s, 40 * s, 44 * s);
    ctx.fillStyle = '#fa5252';
    // 红色叉号
    ctx.lineWidth = 5 * s;
    ctx.strokeStyle = '#fa5252';
    ctx.beginPath();
    ctx.moveTo(18 * s, 16 * s);
    ctx.lineTo(46 * s, 44 * s);
    ctx.moveTo(46 * s, 16 * s);
    ctx.lineTo(18 * s, 44 * s);
    ctx.stroke();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(22 * s, 22 * s, 3 * s, 3 * s);
    ctx.fillRect(39 * s, 22 * s, 3 * s, 3 * s);
  },

  // 墨滴
  inkdrop(ctx, s) {
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(24 * s, 24 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    // 滴落
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.arc(32 * s, 56 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 纸飞机
  paperplane(ctx, s) {
    ctx.fillStyle = '#e9ecef';
    ctx.beginPath();
    ctx.moveTo(8 * s, 32 * s);
    ctx.lineTo(56 * s, 16 * s);
    ctx.lineTo(56 * s, 48 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    // 折线
    ctx.strokeStyle = '#ced4da';
    ctx.beginPath();
    ctx.moveTo(56 * s, 16 * s);
    ctx.lineTo(20 * s, 34 * s);
    ctx.lineTo(56 * s, 48 * s);
    ctx.stroke();
  },

  // 铃铛手
  bellringer(ctx, s) {
    ctx.fillStyle = '#ffd43b';
    // 铃体
    ctx.beginPath();
    ctx.moveTo(16 * s, 12 * s);
    ctx.lineTo(48 * s, 12 * s);
    ctx.lineTo(44 * s, 44 * s);
    ctx.lineTo(20 * s, 44 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f08c00';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    // 铃舌
    ctx.fillStyle = '#f08c00';
    ctx.beginPath();
    ctx.arc(32 * s, 44 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    // 发光
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(32 * s, 28 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 堆积体
  stackpile(ctx, s) {
    ctx.fillStyle = '#495057';
    ctx.fillRect(8 * s, 16 * s, 48 * s, 14 * s);
    ctx.fillStyle = '#343a40';
    ctx.fillRect(12 * s, 30 * s, 40 * s, 14 * s);
    ctx.fillStyle = '#212529';
    ctx.fillRect(16 * s, 44 * s, 32 * s, 12 * s);
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1 * s;
    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(8 * s, (16 + i * 14) * s, 48 * s, 14 * s);
    }
  },

  // 回声
  echo(ctx, s) {
    ctx.fillStyle = 'rgba(170,176,255,0.5)';
    ctx.fillRect(16 * s, 10 * s, 32 * s, 44 * s);
    // 轮廓
    ctx.strokeStyle = 'rgba(170,176,255,0.9)';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(16 * s, 10 * s, 32 * s, 44 * s);
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(22 * s, 20 * s, 4 * s, 4 * s);
    ctx.fillRect(38 * s, 20 * s, 4 * s, 4 * s);
  },

  // 批改者
  corrector(ctx, s) {
    // 身体
    ctx.fillStyle = '#343a40';
    ctx.fillRect(20 * s, 18 * s, 24 * s, 36 * s);
    // 红笔
    ctx.fillStyle = '#c92a2a';
    ctx.save();
    ctx.translate(44 * s, 40 * s);
    ctx.rotate(-0.3);
    ctx.fillRect(0, 0, 20 * s, 6 * s);
    ctx.restore();
    // 笔尖发光
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(46 * s, 36 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#c92a2a';
    ctx.fillRect(26 * s, 24 * s, 3 * s, 3 * s);
    ctx.fillRect(36 * s, 24 * s, 3 * s, 3 * s);
  },

  // 读卡机
  reader(ctx, s, size, params) {
    const phase = params.phase || 1;
    ctx.fillStyle = phase === 1 ? '#343a40' : '#5c2a4a';
    ctx.fillRect(8 * s, 12 * s, 48 * s, 44 * s);
    // 读取窗口
    ctx.fillStyle = phase === 1 ? 'rgba(77,171,247,0.8)' : 'rgba(186,73,255,0.8)';
    ctx.fillRect(16 * s, 22 * s, 32 * s, 20 * s);
    // 扫描线
    ctx.strokeStyle = phase === 1 ? '#ff6b6b' : '#cc5de8';
    ctx.lineWidth = 2 * s;
    const scanY = 22 + ((Date.now() / 50) % 20);
    ctx.beginPath();
    ctx.moveTo(16 * s, scanY * s);
    ctx.lineTo(48 * s, scanY * s);
    ctx.stroke();
    // 边框
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(8 * s, 12 * s, 48 * s, 44 * s);
  },

  // 通告板
  bulletin(ctx, s, size, params) {
    const phase = params.phase || 1;
    const color = phase === 1 ? '#495057' : phase === 2 ? '#5c2a2a' : '#3a2a1a';
    ctx.fillStyle = color;
    ctx.fillRect(6 * s, 4 * s, 52 * s, 56 * s);
    // 纸条
    ctx.fillStyle = phase >= 2 ? '#fa5252' : '#e9ecef';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(10 * s, (8 + i * 10) * s, 44 * s, 7 * s);
    }
    // 顶部字样
    ctx.fillStyle = '#ffd43b';
    ctx.font = `bold ${8 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('▲', 32 * s, 14 * s);
    // 边框
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(6 * s, 4 * s, 52 * s, 56 * s);
  },

  // 计时器
  timer(ctx, s, size, params) {
    const phase = params.phase || 1;
    ctx.fillStyle = phase === 1 ? '#212529' : '#5c2a2a';
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
    // 数字
    ctx.fillStyle = phase === 1 ? '#fff' : '#fa5252';
    ctx.font = `bold ${18 * s}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 32 * s, 34 * s);
    // 齿轮
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 26 * s, 0, Math.PI * 2);
    ctx.stroke();
  },

  // 抄写板
  chalkboard(ctx, s, size, params) {
    const phase = params.phase || 1;
    ctx.fillStyle = phase === 1 ? '#2b4a3a' : '#3a1a1a';
    ctx.fillRect(6 * s, 10 * s, 52 * s, 46 * s);
    // 粉笔轨迹
    ctx.strokeStyle = phase === 1 ? 'rgba(255,255,255,0.8)' : 'rgba(250,82,82,0.8)';
    ctx.lineWidth = 2 * s;
    const t = Date.now() / 200;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(10 * s, (16 + i * 12 + Math.sin(t + i) * 3) * s);
      ctx.lineTo(54 * s, (16 + i * 12 + Math.cos(t + i) * 3) * s);
      ctx.stroke();
    }
    ctx.strokeStyle = '#868e96';
    ctx.lineWidth = 3 * s;
    ctx.strokeRect(6 * s, 10 * s, 52 * s, 46 * s);
  },

  // 排名表
  ranking(ctx, s, size, params) {
    const phase = params.phase || 1;
    ctx.fillStyle = phase === 1 ? '#1a1a2e' : '#2e1a1a';
    ctx.fillRect(8 * s, 4 * s, 48 * s, 56 * s);
    // 数字流
    ctx.fillStyle = phase === 1 ? '#51cf66' : '#fa5252';
    ctx.font = `${7 * s}px monospace`;
    ctx.textAlign = 'center';
    const t = Math.floor(Date.now() / 300);
    for (let i = 0; i < 7; i++) {
      const num = (t + i * 7) % 100;
      ctx.fillText(String(num).padStart(2, '0'), 32 * s, (12 + i * 7) * s);
    }
    // 皇冠
    ctx.fillStyle = '#ffd43b';
    ctx.font = `bold ${10 * s}px sans-serif`;
    ctx.fillText('♛', 32 * s, 10 * s);
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(8 * s, 4 * s, 48 * s, 56 * s);
  },

  // 审判台
  tribunal(ctx, s, size, params) {
    const phase = params.phase || 1;
    ctx.fillStyle = phase === 1 ? '#2a2a3a' : phase === 2 ? '#3a1a2a' : '#1a0a1a';
    ctx.fillRect(12 * s, 24 * s, 40 * s, 32 * s);
    // 法槌
    ctx.fillStyle = phase >= 2 ? '#c92a2a' : '#868e96';
    ctx.fillRect(28 * s, 6 * s, 8 * s, 20 * s);
    ctx.fillRect(22 * s, 4 * s, 20 * s, 8 * s);
    // 天平
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(16 * s, 28 * s);
    ctx.lineTo(48 * s, 28 * s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,212,59,0.6)';
    ctx.beginPath();
    ctx.arc(32 * s, 40 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
  },

  // 肘击王
  zjw1(ctx, s) {
    // 身体
    ctx.fillStyle = '#2a1a3a';
    ctx.fillRect(14 * s, 16 * s, 36 * s, 40 * s);
    // 头部
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(20 * s, 4 * s, 24 * s, 16 * s);
    // 眼睛（发光）
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(24 * s, 10 * s, 4 * s, 4 * s);
    ctx.fillRect(36 * s, 10 * s, 4 * s, 4 * s);
    // 肘
    ctx.fillStyle = '#4a1a2a';
    ctx.fillRect(6 * s, 28 * s, 10 * s, 10 * s);
    ctx.fillRect(48 * s, 28 * s, 10 * s, 10 * s);
  },

  zjw2(ctx, s) {
    ctx.fillStyle = '#3a0a1a';
    ctx.fillRect(12 * s, 14 * s, 40 * s, 42 * s);
    ctx.fillStyle = '#5a1a2a';
    ctx.fillRect(18 * s, 2 * s, 28 * s, 16 * s);
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(22 * s, 8 * s, 5 * s, 5 * s);
    ctx.fillRect(37 * s, 8 * s, 5 * s, 5 * s);
    // 利爪
    ctx.fillStyle = '#ff006e';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect((4 + i * 3) * s, 30 * s, 3 * s, 14 * s);
      ctx.fillRect((50 - i * 3) * s, 30 * s, 3 * s, 14 * s);
    }
  },

  // 道具图标
  item_ink(ctx, s) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(20 * s, 10 * s, 24 * s, 40 * s);
    ctx.fillStyle = '#495057';
    ctx.fillRect(24 * s, 6 * s, 16 * s, 6 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(24 * s, 16 * s, 6 * s, 20 * s);
  },
  item_red_pen(ctx, s) {
    ctx.fillStyle = '#fa5252';
    ctx.save();
    ctx.translate(32 * s, 32 * s);
    ctx.rotate(-0.5);
    ctx.fillRect(-4 * s, -22 * s, 8 * s, 44 * s);
    ctx.restore();
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath();
    ctx.moveTo(20 * s, 50 * s);
    ctx.lineTo(26 * s, 50 * s);
    ctx.lineTo(23 * s, 56 * s);
    ctx.fill();
  },
  item_paperclip(ctx, s) {
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 16 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 10 * s, 0, Math.PI * 2);
    ctx.stroke();
  },
  item_gold(ctx, s) {
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.arc(32 * s, 32 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f08c00';
    ctx.font = `bold ${16 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 32 * s, 33 * s);
  },
};

// 玩家精灵（起义军）
export function generatePlayerTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 1.92;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const s = size / 60;
  // 头
  ctx.fillStyle = '#f0c090';
  ctx.fillRect(20 * s, 4 * s, 20 * s, 18 * s);
  // 头发
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(18 * s, 2 * s, 24 * s, 8 * s);
  // 眼睛
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(24 * s, 12 * s, 3 * s, 3 * s);
  ctx.fillRect(33 * s, 12 * s, 3 * s, 3 * s);
  // 身体（红白条纹外套）
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(14 * s, 22 * s, 32 * s, 28 * s);
  ctx.fillStyle = '#fa5252';
  ctx.fillRect(14 * s, 28 * s, 32 * s, 8 * s);
  ctx.fillStyle = '#e9ecef';
  ctx.fillRect(14 * s, 26 * s, 32 * s, 2 * s);
  ctx.fillRect(14 * s, 36 * s, 32 * s, 2 * s);
  // 手
  ctx.fillStyle = '#f0c090';
  ctx.fillRect(10 * s, 30 * s, 6 * s, 10 * s);
  ctx.fillRect(44 * s, 30 * s, 6 * s, 10 * s);
  // 腿
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(18 * s, 50 * s, 10 * s, 20 * s);
  ctx.fillRect(32 * s, 50 * s, 10 * s, 20 * s);
  return canvas;
}

// 肘击王立绘（直接用图片）
export function generateBossTexture(image, size = 192) {
  if (!image) return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, size, size * 2);
  return canvas;
}

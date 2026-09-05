export class Bullet {
  constructor(scene, x, y, vx, vy, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.w = opts.w || 8;
    this.h = opts.h || 8;
    this.damage = opts.damage || 1;
    this.kind = opts.kind || 'normal';
    this.color = opts.color || '#ffd43b';
    this.life = opts.life || 2000;
    this.born = performance.now();
    this.pierce = opts.pierce || false;
    this.hits = new Set();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  isExpired() {
    return performance.now() - this.born > this.life;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    // 尾焰光晕
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.w * 1.5);
    g.addColorStop(0, this.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, this.w * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 内核
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(this.w, 0);
    ctx.lineTo(0, this.h * 0.5);
    ctx.lineTo(-this.w * 0.6, 0);
    ctx.lineTo(0, -this.h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// 肘击弹幕
export class ZjAttack {
  constructor(scene, x, y, vx, vy, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.w = 22;
    this.h = 11;
    this.p2 = opts.p2 || false;
    this.rot = 0;
    this.spin = (Math.random() - 0.5) * 0.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.spin;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.p2) {
      ctx.globalAlpha = 0.5;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, this.w * 1.2);
      g.addColorStop(0, 'rgba(255,0,110,0.85)');
      g.addColorStop(1, 'rgba(255,0,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, this.w * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 肘击图标
    ctx.fillStyle = this.p2 ? '#ff006e' : '#fa5252';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-this.w / 2 + 2, -this.h / 2 + 2, 4, 4);
    ctx.restore();
  }
}

export class Bullet {
  constructor(scene, x, y, vx, vy, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.w = opts.size || opts.w || 8;
    this.h = opts.size || opts.h || 8;
    this.damage = opts.damage || 1;
    this.kind = opts.kind || 'normal';
    this.color = opts.color || '#ffd43b';
    this.life = opts.life || 2000;
    this.born = performance.now();
    this.pierce = opts.pierce || false;
    this.hits = new Set();
    this.pinPlayer = opts.pinPlayer || false;
    this.tracking = opts.tracking || false;
    this.trackTime = opts.trackTime || 0;
    this.trackStart = performance.now();
    this.groundZone = opts.groundZone || false;
    this.zoneUntil = opts.zoneUntil || 0;
    this.number = opts.number != null ? opts.number : null;
    this.landed = false;
    this.specialKind = opts.specialKind || null;
  }

  update() {
    // 追踪
    if (this.tracking && performance.now() - this.trackStart < this.trackTime) {
      const player = this.scene.player;
      if (player) {
        const dx = (player.x + player.w / 2) - this.x;
        const dy = (player.y + player.h / 2) - this.y;
        const L = Math.hypot(dx, dy) || 1;
        const speed = Math.hypot(this.vx, this.vy);
        this.vx += (dx / L * speed - this.vx) * 0.1;
        this.vy += (dy / L * speed - this.vy) * 0.1;
      }
    }
    this.x += this.vx;
    this.y += this.vy;

    // 地面区域：落地后停留
    if (this.groundZone && !this.landed && this.y >= this.scene.groundY) {
      this.landed = true;
      this.vx = 0;
      this.vy = 0;
      this.life = 3000;
      this.born = performance.now();
    }
  }

  isExpired() {
    return performance.now() - this.born > this.life;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 地面伤害区域
    if (this.groundZone && this.landed) {
      ctx.fillStyle = 'rgba(250,82,82,0.3)';
      ctx.fillRect(-15, -8, 30, 16);
      ctx.strokeStyle = 'rgba(250,82,82,0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-15, -8, 30, 16);
      ctx.restore();
      return;
    }

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
    // 数字弹幕
    if (this.number != null) {
      ctx.fillStyle = this.color;
      ctx.font = 'bold ' + (this.w + 4) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-Math.atan2(this.vy, this.vx));
      ctx.fillText(String(this.number), 0, 0);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    } else {
      // 内核
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(this.w, 0);
      ctx.lineTo(0, this.h * 0.5);
      ctx.lineTo(-this.w * 0.6, 0);
      ctx.lineTo(0, -this.h * 0.5);
      ctx.closePath();
      ctx.fill();
    }
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

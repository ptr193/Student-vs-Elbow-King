// 粒子实体：用于爆炸、受击、拾取等视觉效果
export class Particle {
  constructor(x, y, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = opts.vx ?? (Math.random() - 0.5) * 6;
    this.vy = opts.vy ?? (Math.random() - 0.5) * 6;
    this.size = opts.size ?? 4;
    this.color = opts.color || '#ffd43b';
    this.life = opts.life ?? 600;
    this.born = performance.now();
    this.gravity = opts.gravity ?? 0.15;
    this.shrink = opts.shrink ?? true;
    this.fade = opts.fade ?? true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.96;
    this.vy *= 0.96;
  }

  isExpired() {
    return performance.now() - this.born > this.life;
  }

  draw(ctx) {
    const t = (performance.now() - this.born) / this.life;
    const alpha = this.fade ? Math.max(0, 1 - t) : 1;
    const s = this.shrink ? this.size * (1 - t * 0.5) : this.size;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, s), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// 粒子系统辅助
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = opts.speed ?? (2 + Math.random() * 4);
      this.particles.push(new Particle(x, y, {
        ...opts,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }));
    }
  }

  update() {
    this.particles = this.particles.filter(p => !p.isExpired());
    this.particles.forEach(p => p.update());
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  clear() {
    this.particles = [];
  }
}

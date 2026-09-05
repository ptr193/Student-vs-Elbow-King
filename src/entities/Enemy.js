export class Enemy {
  constructor(scene, def, x, y) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.x = x;
    this.y = y;
    this.w = def.size;
    this.h = def.size;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.color = def.color;
    this.isElite = !!def.isElite;
    this.flashUntil = 0;
    this.nextAttackAt = 0;
    this.dead = false;
    this.spawnTime = performance.now();
    this.vx = 0;
    this.vy = 0;
  }

  update(player, now) {
    if (this.dead) return;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dx = px - cx, dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;

    switch (this.def.attack) {
      case 'ink_shot':
        // 保持距离射击
        if (dist < 150) {
          this.x -= (dx / dist) * this.speed;
          this.y -= (dy / dist) * this.speed;
        } else if (dist > 250) {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
        }
        if (now >= this.nextAttackAt) {
          this._shoot(player, dx / dist, dy / dist);
          this.nextAttackAt = now + this.def.attackCd;
        }
        break;
      case 'rush_and_throw':
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        if (now >= this.nextAttackAt) {
          this._shoot(player, dx / dist, dy / dist, '#fa5252');
          this.nextAttackAt = now + this.def.attackCd;
        }
        break;
      case 'contact_slow':
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        break;
      case 'dive_wave':
        this.x += (dx / dist) * this.speed;
        this.y += Math.sin(now / 200 + this.spawnTime / 100) * 2;
        break;
      case 'noise_aura':
        // 逃跑，加速其他怪
        this.x -= (dx / dist) * this.speed * 1.5;
        this.y -= (dy / dist) * this.speed * 1.5;
        player.slowUntil = now + 500;
        break;
      case 'mimic_shot':
        this.x += (dx / dist) * this.speed * 0.7;
        if (now >= this.nextAttackAt) {
          this._shoot(player, dx / dist, dy / dist, '#aab0ff');
          this.nextAttackAt = now + this.def.attackCd;
        }
        break;
      case 'red_arc':
        this.x += (dx / dist) * this.speed * 0.5;
        if (now >= this.nextAttackAt) {
          this._shoot(player, dx / dist, dy / dist, '#c92a2a');
          this.nextAttackAt = now + this.def.attackCd;
        }
        break;
      default:
        this.x += (dx / dist) * this.speed;
    }
    // 边界
    const lw = this.scene.logicW || 960;
    const lh = this.scene.logicH || 540;
    this.x = Math.max(10, Math.min(lw - this.w - 10, this.x));
    this.y = Math.max(10, Math.min(lh - this.h - 10, this.y));
  }

  _shoot(player, dirX, dirY, color) {
    const speed = 5;
    this.scene.spawnEnemyBullet(
      this.x + this.w / 2,
      this.y + this.h / 2,
      dirX * speed, dirY * speed,
      { color: color || '#fa5252', damage: 1 }
    );
  }

  takeHit(now, damage = 1) {
    this.hp -= damage;
    this.flashUntil = now + 100;
    if (this.hp <= 0) {
      this.dead = true;
      this.scene.onEnemyKilled(this);
    }
  }

  draw(ctx) {
    if (this.dead) return;
    const now = performance.now();
    const flash = now < this.flashUntil;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2.5)';
    // 根据类型绘制
    const s = this.w / 64;
    const drawFn = ENEMY_DRAW[this.id] || ENEMY_DRAW.paperling;
    drawFn(ctx, s, this.color);
    ctx.restore();
    // 血条
    if (this.isElite || this.hp < this.maxHp) {
      const bw = this.w, bh = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x, this.y - 8, bw, bh);
      ctx.fillStyle = this.isElite ? '#fa5252' : '#51cf66';
      ctx.fillRect(this.x, this.y - 8, bw * (this.hp / this.maxHp), bh);
    }
  }

  getHitBox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}

const ENEMY_DRAW = {
  paperling(ctx, s) {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(-22 * s, -24 * s, 44 * s, 48 * s);
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(-22 * s, -24 * s, 44 * s, 48 * s);
    ctx.fillStyle = 'rgba(33,37,41,0.3)';
    ctx.fillRect(-16 * s, -16 * s, 32 * s, 2 * s);
    ctx.fillRect(-16 * s, -8 * s, 28 * s, 2 * s);
    ctx.fillRect(-16 * s, 0 * s, 20 * s, 2 * s);
    ctx.fillStyle = '#212529';
    ctx.fillRect(-12 * s, -12 * s, 4 * s, 4 * s);
    ctx.fillRect(8 * s, -12 * s, 4 * s, 4 * s);
  },
  redmarker(ctx, s) {
    ctx.fillStyle = '#495057';
    ctx.fillRect(-20 * s, -22 * s, 40 * s, 44 * s);
    ctx.strokeStyle = '#fa5252';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(-14 * s, -16 * s); ctx.lineTo(14 * s, 16 * s);
    ctx.moveTo(14 * s, -16 * s); ctx.lineTo(-14 * s, 16 * s);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-10 * s, -10 * s, 3 * s, 3 * s);
    ctx.fillRect(7 * s, -10 * s, 3 * s, 3 * s);
  },
  inkdrop(ctx, s) {
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.arc(0, 0, 22 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-8 * s, -8 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
  },
  paperplane(ctx, s) {
    ctx.fillStyle = '#e9ecef';
    ctx.beginPath();
    ctx.moveTo(-24 * s, 0);
    ctx.lineTo(24 * s, -16 * s);
    ctx.lineTo(24 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
  },
  bellringer(ctx, s) {
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.moveTo(-16 * s, -20 * s);
    ctx.lineTo(16 * s, -20 * s);
    ctx.lineTo(12 * s, 12 * s);
    ctx.lineTo(-12 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f08c00';
    ctx.beginPath();
    ctx.arc(0, 12 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(0, -4 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  },
  stackpile(ctx, s) {
    ctx.fillStyle = '#495057';
    ctx.fillRect(-24 * s, -20 * s, 48 * s, 14 * s);
    ctx.fillStyle = '#343a40';
    ctx.fillRect(-20 * s, -6 * s, 40 * s, 14 * s);
    ctx.fillStyle = '#212529';
    ctx.fillRect(-16 * s, 8 * s, 32 * s, 12 * s);
  },
  echo(ctx, s) {
    ctx.fillStyle = 'rgba(170,176,255,0.5)';
    ctx.fillRect(-16 * s, -22 * s, 32 * s, 44 * s);
    ctx.strokeStyle = 'rgba(170,176,255,0.9)';
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(-16 * s, -22 * s, 32 * s, 44 * s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-10 * s, -12 * s, 4 * s, 4 * s);
    ctx.fillRect(6 * s, -12 * s, 4 * s, 4 * s);
  },
  corrector(ctx, s) {
    ctx.fillStyle = '#343a40';
    ctx.fillRect(-12 * s, -18 * s, 24 * s, 36 * s);
    ctx.fillStyle = '#c92a2a';
    ctx.save();
    ctx.translate(12 * s, 10 * s);
    ctx.rotate(-0.3);
    ctx.fillRect(0, 0, 20 * s, 6 * s);
    ctx.restore();
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(14 * s, 6 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  },
};

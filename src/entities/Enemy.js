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
      case 'slow_trail':
        // 碎纸机：缓慢追击，身后留下减速带
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        if (now >= this.nextAttackAt) {
          this.scene._spawnSlowZone?.(this.x + this.w / 2, this.y + this.h / 2);
          this.nextAttackAt = now + 1500;
        }
        break;
      case 'comma_period':
        // 标点兵：保持中距离，交替发射逗号弹（减速）和句号弹（定身）
        if (dist < 180) { this.x -= (dx / dist) * this.speed; this.y -= (dy / dist) * this.speed; }
        else if (dist > 280) { this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed; }
        if (now >= this.nextAttackAt) {
          const isComma = Math.random() < 0.5;
          this.scene.spawnEnemyBullet(
            this.x + this.w / 2, this.y + this.h / 2,
            (dx / dist) * 4, (dy / dist) * 4,
            { color: isComma ? '#ffd43b' : '#fa5252', damage: 1, special: isComma ? 'slow' : 'stun' }
          );
          this.nextAttackAt = now + this.def.attackCd;
        }
        break;
      case 'full_beam':
        // 满分者：快速追击，定期发射全屏直线光束
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        if (now >= this.nextAttackAt) {
          this.scene._spawnBeam?.(this.x + this.w / 2, this.y + this.h / 2, dx / dist, dy / dist);
          this.nextAttackAt = now + this.def.attackCd;
        }
        break;
      case 'spawn_minion':
        // 档案柜：缓慢移动，定期打开抽屉释放杂兵
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        if (now >= this.nextAttackAt && this.scene.enemies.length < 8) {
          const minion = {
            x: this.x + this.w / 2, y: this.y + this.h / 2,
            hp: 2, maxHp: 2, size: 14,
            def: { id: 'paper', name: '纸片', color: '#e9ecef', speed: 1.8, goldMin: 1, goldMax: 3 },
            vx: 0, vy: 0, dead: false,
            getHitBox() { return { x: this.x - 8, y: this.y - 8, w: 16, h: 16 }; },
            takeHit(n, d = 1) { this.hp -= d; if (this.hp <= 0) this.dead = true; },
            update(player, n) {
              const ddx = player.x - this.x, ddy = player.y - this.y;
              const dd = Math.hypot(ddx, ddy) || 1;
              this.x += (ddx / dd) * (this.def.speed || 1);
              this.y += (ddy / dd) * (this.def.speed || 1);
            },
            draw(ctx) {
              ctx.fillStyle = this.def.color;
              ctx.fillRect(this.x - 7, this.y - 7, 14, 14);
            },
          };
          this.scene.enemies.push(minion);
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
    // 护甲：档案柜受到的伤害减半
    let dmg = damage;
    if (this.def.armored) dmg = Math.max(1, Math.floor(dmg / 2));
    this.hp -= dmg;
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
  // 纸片人 - 纸张质感
  paperling(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6 * s;
    const g = ctx.createLinearGradient(-22 * s, -24 * s, -22 * s, 24 * s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#f8f9fa');
    g.addColorStop(1, '#e9ecef');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-22 * s, -24 * s, 44 * s, 48 * s, 3 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.roundRect(-22 * s, -24 * s, 44 * s, 48 * s, 3 * s);
    ctx.stroke();
    // 折角
    ctx.fillStyle = '#dee2e6';
    ctx.beginPath();
    ctx.moveTo(22 * s, -24 * s);
    ctx.lineTo(22 * s, -14 * s);
    ctx.lineTo(12 * s, -24 * s);
    ctx.closePath();
    ctx.fill();
    // 墨迹横线
    ctx.strokeStyle = 'rgba(52,58,64,0.35)';
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16 * s, -12 * s); ctx.lineTo(16 * s, -12 * s);
    ctx.moveTo(-16 * s, -4 * s); ctx.lineTo(12 * s, -4 * s);
    ctx.moveTo(-16 * s, 4 * s); ctx.lineTo(8 * s, 4 * s);
    ctx.moveTo(-16 * s, 12 * s); ctx.lineTo(18 * s, 12 * s);
    ctx.stroke();
    // 眼睛
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.ellipse(-10 * s, -18 * s, 2.5 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(10 * s, -18 * s, 2.5 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-11 * s, -19 * s, 1 * s, 0, Math.PI * 2);
    ctx.arc(9 * s, -19 * s, 1 * s, 0, Math.PI * 2);
    ctx.fill();
  },
  // 红叉兵 - 深色方块配红色发光叉号
  redmarker(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 5 * s;
    const g = ctx.createLinearGradient(-20 * s, -22 * s, 20 * s, 22 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(1, '#212529');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-20 * s, -22 * s, 40 * s, 44 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.roundRect(-20 * s, -22 * s, 40 * s, 44 * s, 4 * s);
    ctx.stroke();
    // 红色发光叉号
    ctx.save();
    ctx.shadowColor = '#fa5252';
    ctx.shadowBlur = 10 * s;
    ctx.strokeStyle = '#fa5252';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14 * s, -16 * s); ctx.lineTo(14 * s, 16 * s);
    ctx.moveTo(14 * s, -16 * s); ctx.lineTo(-14 * s, 16 * s);
    ctx.stroke();
    ctx.restore();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-10 * s, -10 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.arc(7 * s, -10 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fa5252';
    ctx.beginPath();
    ctx.arc(-10 * s, -10 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.arc(7 * s, -10 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();
  },
  // 墨滴 - 径向渐变+高光
  inkdrop(ctx, s) {
    ctx.fillStyle = 'rgba(33,37,41,0.4)';
    ctx.beginPath();
    ctx.arc(-16 * s, -12 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(16 * s, -16 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.arc(18 * s, 8 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(-6 * s, -8 * s, 2, 0, 0, 24 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(0.4, '#212529');
    g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -2 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-8 * s, -10 * s, 5 * s, 3.5 * s, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212529';
    ctx.beginPath();
    ctx.moveTo(-4 * s, 16 * s);
    ctx.quadraticCurveTo(0, 26 * s, 4 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
  },
  // 纸飞机
  paperplane(ctx, s) {
    const g = ctx.createLinearGradient(-24 * s, 0, 24 * s, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#ced4da');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-24 * s, 0);
    ctx.lineTo(24 * s, -16 * s);
    ctx.lineTo(24 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#868e96';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(24 * s, -16 * s);
    ctx.lineTo(-10 * s, 2 * s);
    ctx.lineTo(24 * s, 16 * s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(-24 * s, 0);
    ctx.lineTo(-10 * s, 2 * s);
    ctx.lineTo(24 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
  },
  // 铃铛手
  bellringer(ctx, s) {
    const g = ctx.createLinearGradient(-16 * s, -20 * s, 16 * s, 12 * s);
    g.addColorStop(0, '#ffec99');
    g.addColorStop(0.5, '#ffd43b');
    g.addColorStop(1, '#f59f00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-16 * s, -20 * s);
    ctx.quadraticCurveTo(-20 * s, -20 * s, -18 * s, -16 * s);
    ctx.lineTo(-12 * s, 12 * s);
    ctx.quadraticCurveTo(-12 * s, 16 * s, -8 * s, 16 * s);
    ctx.lineTo(8 * s, 16 * s);
    ctx.quadraticCurveTo(12 * s, 16 * s, 12 * s, 12 * s);
    ctx.lineTo(18 * s, -16 * s);
    ctx.quadraticCurveTo(20 * s, -20 * s, 16 * s, -20 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e67700';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.strokeStyle = '#f59f00';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(0, -22 * s, 5 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e67700';
    ctx.beginPath();
    ctx.arc(0, 14 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = '#fff3bf';
    ctx.shadowBlur = 6 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-8 * s, -10 * s, 4 * s, 6 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  // 堆积体
  stackpile(ctx, s) {
    const colors = ['#495057', '#343a40', '#212529'];
    for (let i = 0; i < 3; i++) {
      const y = (-20 + i * 14) * s;
      const w = (48 - i * 8) * s;
      const x = (-24 + i * 4) * s;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3 * s;
      const g = ctx.createLinearGradient(x, y, x, y + 14 * s);
      g.addColorStop(0, colors[i]);
      g.addColorStop(1, '#000');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, w, 14 * s, 1 * s);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 1, y + 1, w - 2, 2 * s);
    }
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(-12 * s, -23 * s, 12 * s, 4 * s);
  },
  // 回声
  echo(ctx, s) {
    ctx.save();
    ctx.shadowColor = '#aab0ff';
    ctx.shadowBlur = 12 * s;
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 24 * s);
    g.addColorStop(0, 'rgba(170,176,255,0.8)');
    g.addColorStop(0.7, 'rgba(170,176,255,0.4)');
    g.addColorStop(1, 'rgba(170,176,255,0.1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-16 * s, -22 * s, 32 * s, 44 * s, 6 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(170,176,255,0.9)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.roundRect(-16 * s, -22 * s, 32 * s, 44 * s, 6 * s);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-8 * s, -10 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(8 * s, -10 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#748ffc';
    ctx.beginPath();
    ctx.arc(-8 * s, -10 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(8 * s, -10 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,176,255,0.6)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-16 * s, 20 * s);
    ctx.quadraticCurveTo(-10 * s, 24 * s, -4 * s, 20 * s);
    ctx.quadraticCurveTo(2 * s, 16 * s, 8 * s, 20 * s);
    ctx.quadraticCurveTo(14 * s, 24 * s, 16 * s, 20 * s);
    ctx.stroke();
  },
  // 批改者
  corrector(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4 * s;
    const g = ctx.createLinearGradient(-12 * s, -18 * s, 12 * s, 18 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(1, '#212529');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-12 * s, -18 * s, 24 * s, 36 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(12 * s, 10 * s);
    ctx.rotate(-0.3);
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 6 * s;
    const pg = ctx.createLinearGradient(0, 0, 20 * s, 0);
    pg.addColorStop(0, '#fa5252');
    pg.addColorStop(1, '#c92a2a');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.roundRect(0, -3 * s, 20 * s, 6 * s, 2 * s);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 8 * s;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(14 * s, 6 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath();
    ctx.arc(-5 * s, -8 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.arc(5 * s, -8 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
  },
  // 碎纸机
  shredder(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4 * s;
    const g = ctx.createLinearGradient(-16 * s, -16 * s, 16 * s, 16 * s);
    g.addColorStop(0, '#495057');
    g.addColorStop(1, '#212529');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-16 * s, -16 * s, 32 * s, 32 * s, 4 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.roundRect(-16 * s, -16 * s, 32 * s, 32 * s, 4 * s);
    ctx.stroke();
    ctx.fillStyle = '#212529';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-14 * s, (-12 + i * 6) * s, 28 * s, 3 * s);
    }
    ctx.fillStyle = '#868e96';
    ctx.beginPath();
    ctx.roundRect(-10 * s, 10 * s, 20 * s, 4 * s, 1 * s);
    ctx.fill();
  },
  // 标点兵
  punctuator(ctx, s) {
    ctx.save();
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 8 * s;
    const g = ctx.createRadialGradient(-4 * s, -4 * s, 2, 0, 0, 16 * s);
    g.addColorStop(0, '#fff3bf');
    g.addColorStop(0.5, '#ffd43b');
    g.addColorStop(1, '#f59f00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#212529';
    ctx.font = `${20 * s}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('，', 0, 0);
  },
  // 满分者
  perfect(ctx, s) {
    ctx.save();
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 15 * s;
    const g = ctx.createRadialGradient(0, -4 * s, 2, 0, 0, 18 * s);
    g.addColorStop(0, '#fff3bf');
    g.addColorStop(0.5, '#ffd43b');
    g.addColorStop(1, '#f59f00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -8 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-7 * s, 0, 14 * s, 20 * s);
    ctx.restore();
    ctx.fillStyle = '#212529';
    ctx.font = `bold ${10 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('100', 0, 10 * s);
  },
  // 档案柜
  cabinet(ctx, s) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4 * s;
    const g = ctx.createLinearGradient(-20 * s, -22 * s, 20 * s, 22 * s);
    g.addColorStop(0, '#6b4423');
    g.addColorStop(1, '#3d2817');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-20 * s, -22 * s, 40 * s, 44 * s, 3 * s);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#3d2817';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.roundRect(-16 * s, (-18 + i * 14) * s, 32 * s, 10 * s, 1 * s);
      ctx.stroke();
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(-2 * s, (-13 + i * 14) * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

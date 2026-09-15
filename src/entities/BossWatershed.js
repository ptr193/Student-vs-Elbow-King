// 小/关卡 BOSS：一生分水岭（规格 6.2.6，v2.0 六/七周目专属）
// 隐喻：人生重大转折点。核心技能"一刀两断"生成与玩家等强的黑影
export class BossWatershed {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.w = 80; this.h = 120;
    this.maxHp = 60;
    this.hp = 60;
    this.defeated = false;
    this.phase = 1;
    this.nextAttackAt = performance.now() + 2000;
    this.shadows = [];
    // 7 周目加强：黑影生成更快，最多 4 个
    const cycle = scene.cycleSys?.getCurrentCycle() || 6;
    this.maxShadows = cycle >= 7 ? 4 : 3;
    this.shadowSpawnInterval = cycle >= 7 ? 3500 : 5000;
    this.nextShadowAt = performance.now() + this.shadowSpawnInterval;
  }

  getHitBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  takeHit(now) {
    if (this.defeated) return;
    this.hp -= 1;
    if (this.hp <= 0) {
      this.defeated = true;
      this.scene.bossDefeated?.add('watershed');
    }
  }

  update(player, now) {
    if (this.defeated) return;
    // 生成黑影（一刀两断）
    if (now > this.nextShadowAt && this.shadows.length < this.maxShadows) {
      this._spawnShadow(player);
      this.nextShadowAt = now + this.shadowSpawnInterval;
    }
    // 黑影攻击玩家
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      const sh = this.shadows[i];
      sh.update(player, now);
      if (sh.dead) this.shadows.splice(i, 1);
    }
    // 刀气斩（远程弹幕）
    if (now > this.nextAttackAt) {
      this._slashWave(player);
      this.nextAttackAt = now + 2200;
    }
  }

  _spawnShadow(player) {
    const s = this.scene;
    // 黑影攻击力 = 玩家攻击力，血量 = 玩家血量
    const atk = player.attackMultiplier || 1;
    const hp = player.hp || 2;
    const shadow = new ShadowClone(s, this.x, this.y, atk, hp);
    this.shadows.push(shadow);
    s.showBanner('一刀两断！黑影降临', '#fa5252');
  }

  _slashWave(player) {
    const s = this.scene;
    const dx = player.x - this.x;
    const dir = Math.sign(dx) || 1;
    for (let i = -1; i <= 1; i++) {
      s.enemyBullets.push({
        x: this.x, y: this.y + i * 30,
        vx: dir * 5, vy: i * 0.8,
        damage: 1, w: 20, h: 8, color: '#dee2e6',
        life: 120, type: 'slash',
      });
    }
  }

  draw(ctx) {
    // 巨大刀形剪影
    ctx.save();
    ctx.translate(this.x, this.y);
    // 刀柄
    ctx.fillStyle = '#212529';
    ctx.fillRect(-8, -60, 16, 30);
    // 刀身
    ctx.fillStyle = '#ced4da';
    ctx.beginPath();
    ctx.moveTo(-20, -30);
    ctx.lineTo(20, -30);
    ctx.lineTo(12, 50);
    ctx.lineTo(-12, 50);
    ctx.closePath();
    ctx.fill();
    // 压迫光晕
    ctx.fillStyle = 'rgba(250, 82, 82, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 血条
    this._drawHpBar(ctx);
    // 黑影
    this.shadows.forEach(sh => sh.draw(ctx));
  }

  _drawHpBar(ctx) {
    const bw = 100, bh = 6;
    const bx = this.x - bw / 2, by = this.y - this.h / 2 - 16;
    ctx.fillStyle = '#495057';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(bx, by, bw * Math.max(0, this.hp / this.maxHp), bh);
  }
}

// 黑影克隆：攻击力=玩家攻击力，血量=玩家血量，主动攻击玩家
class ShadowClone {
  constructor(scene, x, y, atk, hp) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.w = 24; this.h = 44;
    this.atk = atk;
    this.maxHp = hp;
    this.hp = hp;
    this.dead = false;
    this.speed = 1.5;
    this.nextHitAt = 0;
  }

  getHitBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  takeHit(now, dmg = 1) {
    this.hp -= dmg;
    if (this.hp <= 0) this.dead = true;
  }

  update(player, now) {
    if (this.dead) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed * 0.3;
    // 接触伤害
    if (d < 30 && now > this.nextHitAt) {
      player.hp -= 1;
      this.nextHitAt = now + 800;
      if (player.hp <= 0) {
        this.scene._onPlayerDeath?.();
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    // 红眼
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(-6, -this.h / 2 + 8, 4, 4);
    ctx.fillRect(2, -this.h / 2 + 8, 4, 4);
    ctx.restore();
    // 血条
    const bw = 30, bh = 3;
    ctx.fillStyle = '#495057';
    ctx.fillRect(this.x - bw / 2, this.y - this.h / 2 - 8, bw, bh);
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(this.x - bw / 2, this.y - this.h / 2 - 8, bw * Math.max(0, this.hp / this.maxHp), bh);
  }
}

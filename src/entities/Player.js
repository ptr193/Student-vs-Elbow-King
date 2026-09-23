import playerConfig from '../config/player.json';

// 俯视角玩家：四向自由移动，无重力、无跳跃
export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = playerConfig.width;
    this.h = playerConfig.height;
    this.vx = 0;
    this.vy = 0;
    this.maxHp = playerConfig.maxHp;
    this.hp = playerConfig.maxHp;
    // 朝向角度（弧度），用于子弹发射方向和精灵朝向
    this.angle = 0;
    this.facingX = 1;
    this.facingY = 0;
    this.lastFireAt = 0;
    this.invincibleUntil = 0;
    this.flashUntil = 0;
    this.slowUntil = 0;
    this.stunUntil = 0;
    this.shield = 0;
    this.hasRevive = false;
    this.attackMultiplier = 1;
    this.bonusShots = 0;
    this.bonusDamage = 0;
    this.critShots = 0;
    this.moveSpeedMult = 1;
    this.fireRateMult = 1;
    this.bulletSpeedMult = 1;
    this.invincibleBonus = 0;
  }

  applySkill(skill) {
    if (!skill) return;
    switch (skill.effect) {
      case 'moveSpeed': this.moveSpeedMult = skill.value; break;
      case 'fireRate': this.fireRateMult = skill.value; break;
      case 'bulletSpeed': this.bulletSpeedMult = skill.value; break;
      case 'maxHp': this.maxHp += skill.value; this.hp += skill.value; break;
      case 'invincibleBonus': this.invincibleBonus = skill.value; break;
    }
  }

  // input: { moveX, moveY, fire }
  update(input, dt, bounds) {
    const now = performance.now();
    // 控制锁定
    if (this.controlLocked) {
      this.vx = 0; this.vy = 0;
      return;
    }
    // 基础速度
    let speed = playerConfig.moveSpeed * this.moveSpeedMult;
    if (now < this.slowUntil) speed *= 0.5;
    if (now < this.stunUntil) {
      this.vx = 0; this.vy = 0;
    } else {
      // 归一化斜向移动，避免对角线更快
      let mx = input.moveX || 0;
      let my = input.moveY || 0;
      const len = Math.hypot(mx, my);
      if (len > 0.01) {
        mx /= len; my /= len;
        this.vx = mx * speed;
        this.vy = my * speed;
        this.facingX = mx;
        this.facingY = my;
        this.angle = Math.atan2(my, mx);
      } else {
        this.vx = 0; this.vy = 0;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // 边界限制（俯视角：四面墙）
    const lw = this.scene?.logicW || 1280;
    const lh = this.scene?.logicH || 720;
    const pad = this.w / 2;
    if (this.x < pad) this.x = pad;
    if (this.x > lw - pad) this.x = lw - pad;
    if (this.y < pad) this.y = pad;
    if (this.y > lh - pad) this.y = lh - pad;
  }

  takeDamage(now, amount = 1) {
    if (now < this.invincibleUntil) return false;
    if (this.shield > 0) {
      this.shield--;
      this.invincibleUntil = now + 500;
      return false;
    }
    if (this.hasRevive) {
      this.hasRevive = false;
      this.hp = 1;
      this.invincibleUntil = now + 1500;
      this.flashUntil = now + 1500;
      return false;
    }
    this.hp -= amount;
    this.invincibleUntil = now + (900 + this.invincibleBonus);
    this.flashUntil = now + (900 + this.invincibleBonus);
    return this.hp <= 0;
  }

  draw(ctx, texture) {
    const now = performance.now();
    const invincible = now < this.invincibleUntil;
    const flash = now < this.flashUntil;
    let draw = true;
    if (invincible && Math.floor(now / 80) % 2 === 0) draw = false;
    if (draw) {
      ctx.save();
      ctx.translate(this.x, this.y);
      // 俯视角朝向旋转
      ctx.rotate(this.angle);
      if (flash) ctx.filter = 'brightness(2.2) saturate(1.6)';
      ctx.drawImage(texture, -this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    }
    // 护盾光圈
    if (this.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(now / 100);
      ctx.strokeStyle = '#74c0fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.w * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // 信念微光
    if (this.attackMultiplier >= 2) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      const g = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, 60);
      g.addColorStop(0, 'rgba(255,243,191,0.6)');
      g.addColorStop(1, 'rgba(255,243,191,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

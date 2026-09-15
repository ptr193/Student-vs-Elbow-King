import playerConfig from '../config/player.json';

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
    this.onGround = true;
    this.jumpCount = 0;
    this.facing = 1;
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
    this.jumpBonus = 0;
  }

  applySkill(skill) {
    if (!skill) return;
    switch (skill.effect) {
      case 'moveSpeed': this.moveSpeedMult = skill.value; break;
      case 'fireRate': this.fireRateMult = skill.value; break;
      case 'bulletSpeed': this.bulletSpeedMult = skill.value; break;
      case 'maxHp': this.maxHp += skill.value; this.hp += skill.value; break;
      case 'jumpBonus': this.jumpBonus = skill.value; break;
      case 'invincibleBonus': this.invincibleBonus = skill.value; break;
    }
  }

  update(input, dt, groundY) {
    const now = performance.now();
    // 控制锁定（如三周目"为什么"动画期间）
    if (this.controlLocked) {
      this.vx = 0;
      input.jumpPressed = false;
      return;
    }
    // 减速
    let speed = playerConfig.moveSpeed * this.moveSpeedMult;
    if (now < this.slowUntil) speed *= 0.5;
    // 眩晕
    if (now < this.stunUntil) {
      this.vx = 0;
    } else {
      this.vx = input.moveX * speed;
    }
    if (Math.abs(this.vx) > 0.01) this.facing = this.vx > 0 ? 1 : -1;

    // 跳跃
    if (input.jumpPressed) {
      if (this.onGround) {
        this.vy = playerConfig.jumpVelocity;
        this.onGround = false;
        this.jumpCount = 1;
        this.scene.audio?.jump();
      } else if (this.jumpCount < 2) {
        this.vy = playerConfig.jumpVelocity * (playerConfig.doubleJumpMultiplier + this.jumpBonus);
        this.jumpCount = 2;
        this.scene.audio?.doubleJump();
      }
    }
    input.jumpPressed = false;

    // 重力
    this.vy += 0.58;
    this.x += this.vx;
    this.y += this.vy;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
      this.jumpCount = 0;
    }
    // 边界
    const lw = this.scene?.logicW || 960;
    if (this.x < 6) this.x = 6;
    if (this.x + this.w > lw - 6) this.x = lw - 6 - this.w;
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
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      if (this.facing < 0) ctx.scale(-1, 1);
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
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // 信念微光
    if (this.attackMultiplier >= 2) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      const g = ctx.createRadialGradient(this.x + this.w / 2, this.y + this.h / 2, 5, this.x + this.w / 2, this.y + this.h / 2, 60);
      g.addColorStop(0, 'rgba(255,243,191,0.6)');
      g.addColorStop(1, 'rgba(255,243,191,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

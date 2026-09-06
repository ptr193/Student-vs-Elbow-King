import bossConfig from '../config/boss_zjw.json';

const CHARGE = { IDLE: 'idle', PREPARE: 'prepare', CHARGING: 'charging', STUN: 'stun', RECOVER: 'recover' };
const PHASE = { P1: 'p1', P2: 'p2' };
const MODE = { NORMAL: 'normal', DEFENSE: 'defense' };

export class BossZJW {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = bossConfig.width;
    this.h = bossConfig.height;
    this.homeX = x;
    this.homeY = y;
    this.phase = 1;
    this.mode = MODE.NORMAL;
    this.hpMax = bossConfig.phase1Hp;
    this.hp = bossConfig.phase1Hp;
    this.cellHits = 0;
    this.nextAttackAt = 0;
    this.dir = -1;
    this.flashUntil = 0;
    this.defenseTriggered = false;
    this.transitionUntil = 0;
    this.chargeState = CHARGE.IDLE;
    this.chargeUntil = 0;
    this.chargeVX = 0;
    this.chargeOriginX = x;
    this.chargeMaxDistance = 0;
    this.chargeNextAt = 0;
    this.chargeHitThisTime = false;
    this.defeated = false;
    this.c = bossConfig;
  }

  currentCfg() {
    if (this.phase === 2) {
      return {
        hitsPerHp: 5, attackCD: this.c.phase2AttackCd, attackCount: 3 + Math.floor(Math.random() * 2),
        isP2: true, oneHitKill: true, sprite: 'zjw2',
      };
    }
    const isDef = this.mode === MODE.DEFENSE;
    return {
      hitsPerHp: isDef ? 6 : 2,
      attackCD: isDef ? this.c.phase1DefenseAttackCd : this.c.phase1AttackCd,
      attackCount: isDef ? 2 + Math.floor(Math.random() * 2) : 1,
      isP2: false, oneHitKill: false, sprite: 'zjw1',
    };
  }

  update(player, now) {
    if (this.defeated) return;
    const canShoot = now > this.transitionUntil
      && this.chargeState !== CHARGE.PREPARE
      && this.chargeState !== CHARGE.CHARGING
      && this.chargeState !== CHARGE.STUN;
    this.dir = (player.x + player.w / 2) < (this.x + this.w / 2) ? -1 : 1;

    if (this.phase === 2) this._updateCharge(player, now);
    if (this.chargeState === CHARGE.IDLE) {
      this.x = this.homeX;
      this.y = this.homeY;
    }
    if (canShoot && now >= this.nextAttackAt) this._attack(player, now);
  }

  _updateCharge(player, now) {
    const st = this.chargeState;
    const c = this.c.charge;
    switch (st) {
      case CHARGE.IDLE:
        if (now > this.transitionUntil && now >= this.chargeNextAt) {
          const pcx = player.x + player.w / 2;
          const bcx = this.x + this.w / 2;
          this.chargeState = CHARGE.PREPARE;
          this.chargeUntil = now + c.prepareMs;
          this.chargeDir = pcx < bcx ? -1 : 1;
          this.chargeOriginX = this.x;
          this.chargeVX = this.chargeDir * c.speed;
          this.chargeHitThisTime = false;
          this.scene.audio?.chargeWarn();
        }
        break;
      case CHARGE.PREPARE:
        this.x = this.chargeOriginX + Math.sin(now / 22) * 2.2;
        if (now >= this.chargeUntil) {
          this.chargeState = CHARGE.CHARGING;
          this.chargeVX = this.chargeDir * c.speed;
        }
        break;
      case CHARGE.CHARGING: {
        this.x += this.chargeVX;
        const traveled = Math.abs(this.x - this.chargeOriginX);
        const lw = this.scene.logicW || 960;
        const hitEdge = (this.chargeDir === -1 && this.x <= 4) || (this.chargeDir === 1 && this.x + this.w >= lw - 4) || traveled >= this.chargeMaxDistance;
        if (hitEdge) {
          this.chargeVX = 0;
          this.chargeState = CHARGE.RECOVER;
          this.chargeUntil = now + c.missWaitMs;
        }
        break;
      }
      case CHARGE.STUN:
        if (now >= this.chargeUntil) {
          this.chargeState = CHARGE.RECOVER;
          this.chargeUntil = now + c.missWaitMs;
        }
        break;
      case CHARGE.RECOVER: {
        const dx = this.homeX - this.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), c.speed * 0.35);
        this.x += step;
        if (Math.abs(this.x - this.homeX) < 0.6) {
          this.x = this.homeX;
          this.chargeState = CHARGE.IDLE;
          this.chargeVX = 0;
          this.chargeNextAt = now + (c.cooldownMs[0] + Math.random() * (c.cooldownMs[1] - c.cooldownMs[0]));
        }
        break;
      }
    }
  }

  _attack(player, now) {
    const cfg = this.currentCfg();
    const count = cfg.attackCount;
    const originX = this.x + this.w * 0.15;
    const originY = this.y + this.h - 10;
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;
    const baseAng = Math.atan2(targetY - originY, targetX - originX);
    let spread = Math.PI / 7;
    if (cfg.isP2) spread = Math.PI / 4.2;
    else if (this.mode === MODE.DEFENSE) spread = Math.PI / 5.2;
    const speed = cfg.isP2 ? this.c.zjSpeed * this.c.phase2ZjSpeedMultiplier : this.c.zjSpeed;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : (i / (count - 1) - 0.5);
      const ang = baseAng + t * spread * (cfg.isP2 ? 1.6 : 1.4) + (Math.random() - 0.5) * 0.1;
      this.scene.spawnZj(originX, originY, Math.cos(ang) * speed, Math.sin(ang) * speed, { p2: cfg.isP2 });
    }
    const [lo, hi] = cfg.attackCD;
    this.nextAttackAt = now + lo + Math.random() * (hi - lo);
    this.scene.audio?.bossZJ();
  }

  takeHit(now) {
    this.cellHits++;
    this.flashUntil = now + 120;
    const cfg = this.currentCfg();
    if (this.cellHits >= cfg.hitsPerHp) {
      this.cellHits = 0;
      this.hp--;
      if (this.phase === 1 && !this.defenseTriggered && this.hp <= Math.floor(this.hpMax / 2)) {
        this.defenseTriggered = true;
        this.mode = MODE.DEFENSE;
        this.scene.showBanner('防御模式', '#4dabf7');
      }
      if (this.phase === 1 && this.hp <= 0) {
        this.enterPhase2(now);
      } else if (this.phase === 2 && this.hp <= 0) {
        this.defeated = true;
        this.scene.onBossDefeated('zjw');
      }
    }
  }

  enterPhase2(now) {
    this.phase = 2;
    this.mode = MODE.NORMAL;
    this.hpMax = this.c.phase2Hp;
    this.hp = this.c.phase2Hp;
    this.cellHits = 0;
    this.defenseTriggered = false;
    this.nextAttackAt = now + 900;
    this.transitionUntil = now + 1400;
    this.x = this.homeX;
    this.y = this.homeY;
    this.dir = -1;
    // 触发阶段切换剧情
    if (this.scene.narrativeTrigger) {
      this.scene.narrativeTrigger('zjw_phase2');
    }
    this.chargeState = CHARGE.IDLE;
    this.chargeOriginX = this.homeX;
    this.chargeMaxDistance = (this.scene.logicW || 960) * this.c.charge.distancePct;
    this.chargeNextAt = now + 3000 + Math.random() * 1500;
    this.scene.showBanner('肘击王觉醒 · 二阶段', '#ff6b6b');
    this.scene.audio?.phaseChange();
  }

  draw(ctx, textures) {
    const now = performance.now();
    const cfg = this.currentCfg();
    const flash = now < this.flashUntil;
    const img = textures[cfg.sprite] || textures.zjw1;
    // P2 光环
    if (cfg.isP2) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      const g = ctx.createRadialGradient(this.x + this.w / 2, this.y + this.h / 2, 8, this.x + this.w / 2, this.y + this.h / 2, 120);
      g.addColorStop(0, 'rgba(255,0,110,0.5)');
      g.addColorStop(1, 'rgba(255,0,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 防御护盾
    if (this.mode === MODE.DEFENSE) {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.1 * Math.sin(now / 200);
      ctx.strokeStyle = '#4dabf7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.8, this.h * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2.2) saturate(1.6)';
    const drawW = cfg.isP2 ? this.w * 1.08 : this.w;
    const drawH = cfg.isP2 ? this.h * 1.08 : this.h;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 蓄力预警
    if (this.chargeState === CHARGE.PREPARE) {
      ctx.save();
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h * 0.55;
      ctx.strokeStyle = 'rgba(255,0,90,0.75)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -now / 40;
      const endX = cx + this.chargeDir * this.chargeMaxDistance;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(endX, cy);
      ctx.stroke();
      ctx.restore();
    }
    // 眩晕星星
    if (this.chargeState === CHARGE.STUN) {
      ctx.save();
      const cx = this.x + this.w / 2;
      const cy = this.y - 18;
      for (let i = 0; i < 3; i++) {
        const ang = now / 400 + (i * Math.PI * 2 / 3);
        const sx = cx + Math.cos(ang) * 26;
        const sy = cy + Math.sin(ang) * 8;
        ctx.fillStyle = i % 2 ? '#ffd43b' : '#aab0ff';
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = k * Math.PI * 2 / 5 - Math.PI / 2;
          const a2 = a + Math.PI / 5;
          ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
          ctx.lineTo(Math.cos(a2) * 2.5, Math.sin(a2) * 2.5);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // 冲撞气流
    if (this.chargeState === CHARGE.CHARGING) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 4; i++) {
        const tx = this.x + this.w / 2 - this.chargeDir * (10 + i * 18);
        const ty = this.y + this.h * 0.5 + Math.sin(now / 60 + i) * 4;
        const g = ctx.createRadialGradient(tx, ty, 1, tx, ty, 22);
        g.addColorStop(0, 'rgba(255,200,120,0.9)');
        g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tx, ty, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  getHitBox() {
    return { x: this.x + 6, y: this.y + 6, w: this.w - 12, h: this.h - 12 };
  }

  getBodyBox() {
    return { x: this.x + 8, y: this.y + 20, w: this.w - 16, h: this.h - 24 };
  }
}

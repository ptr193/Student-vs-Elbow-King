// 关卡 BOSS：通告板 —— 通告弹幕 + 张贴定身 + 召唤杂兵 + 板面砸地
import { Enemy } from './Enemy.js';

export class StageBossBulletin {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = 160;
    this.h = 200;
    this.homeX = x;
    this.homeY = y;
    this.phase = 1;
    this.hpMax = 15;
    this.hp = 15;
    this.cellHits = 0;
    this.hitsPerHp = 3;
    this.nextBarrageAt = 0;
    this.nextPinAt = 0;
    this.nextSummonAt = 0;
    this.nextSlamAt = 0;
    this.flashUntil = 0;
    this.defeated = false;
    this.pinUntil = 0;
    this.slamWarning = 0;
  }

  update(player, now) {
    if (this.defeated) return;

    // 横移
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const spd = this.phase === 1 ? 0 : this.phase === 2 ? 0.6 : 1.2;
    if (Math.abs(dx) > 50) this.x += Math.sign(dx) * spd;

    // 通告弹幕
    if (now >= this.nextBarrageAt) {
      this._barrage(player, now);
      const cd = [5000, 4000, 3000][this.phase - 1];
      this.nextBarrageAt = now + cd;
    }

    // 张贴定身
    if (now >= this.nextPinAt) {
      this._pin(player, now);
      const cd = [10000, 7000, 5000][this.phase - 1];
      this.nextPinAt = now + cd;
    }

    // 召唤杂兵（P2+）
    if (this.phase >= 2 && now >= this.nextSummonAt) {
      this._summon(now);
      this.nextSummonAt = now + 12000;
    }

    // 板面砸地（P3）
    if (this.phase === 3 && now >= this.nextSlamAt) {
      this._slam(now);
      this.nextSlamAt = now + 8000;
    }

    // 解除定身
    if (this.pinUntil && now >= this.pinUntil) {
      this.pinUntil = 0;
      player.stunUntil = 0;
    }
  }

  _barrage(player, now) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const baseAng = Math.atan2(py - cy, px - cx);
    const dirCount = [6, 8, 12][this.phase - 1];
    const spread = this.phase === 1 ? Math.PI / 3 : Math.PI * 2;
    const tracking = this.phase >= 2;
    for (let i = 0; i < dirCount; i++) {
      const ang = baseAng + (i - (dirCount - 1) / 2) * (spread / dirCount);
      this.scene.spawnEnemyBullet(cx, cy, Math.cos(ang) * 4, Math.sin(ang) * 4, {
        color: '#f8f9fa', damage: 1, size: 8, tracking, trackTime: tracking ? 600 : 0,
      });
    }
    this.scene.audio?.bossZJ?.();
  }

  _pin(player, now) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const ang = Math.atan2(py - cy, px - cx);
    // 发射一张大纸条
    this.scene.spawnEnemyBullet(cx, cy, Math.cos(ang) * 6, Math.sin(ang) * 6, {
      color: '#e9ecef', damage: 1, size: 20, pinPlayer: true,
    });
    this.scene.showBanner('张贴定身！', '#fa5252');
    this.scene.audio?.grab?.();
  }

  _summon(now) {
    const count = this.phase === 2 ? 2 : 3;
    for (let i = 0; i < count; i++) {
      const def = { id: 'paperling', name: '纸片人', hp: 2, speed: 0.8, goldMin: 5, goldMax: 10, attack: 'ink_shot', attackCd: 2000, color: '#f8f9fa', size: 28 };
      const ex = this.x + (i - 1) * 50;
      this.scene.enemies.push(new Enemy(this.scene, def, ex, this.y + this.h + 20));
    }
    this.scene.showBanner('通告板召唤了杂兵！', '#adb5bd');
  }

  _slam(now) {
    this.slamWarning = now + 1000;
    this.scene.showBanner('板面砸地！翻滚闪避', '#fa5252');
    setTimeout(() => {
      if (this.defeated) return;
      // 全屏冲击波
      const player = this.scene.player;
      if (player.onGround) {
        player.takeDamage(performance.now(), 1);
        this.scene.audio?.hurt();
      }
      this.scene._spawnParticles(this.x + this.w / 2, this.y + this.h, '#fa5252', 20);
    }, 1000);
  }

  takeHit(now) {
    if (this.defeated) return;
    this.cellHits++;
    this.flashUntil = now + 100;
    if (this.cellHits >= this.hitsPerHp) {
      this.cellHits = 0;
      this.hp--;
      if (this.phase === 1 && this.hp <= 0) {
        this._enterPhase(2, now);
      } else if (this.phase === 2 && this.hp <= 0) {
        this._enterPhase(3, now);
      } else if (this.phase === 3 && this.hp <= 0) {
        this.defeated = true;
        this.scene.onBossDefeated('bulletin');
      }
    }
  }

  _enterPhase(p, now) {
    this.phase = p;
    const hpVals = [15, 25, 35];
    this.hpMax = hpVals[p - 1];
    this.hp = hpVals[p - 1];
    this.cellHits = 0;
    this.nextBarrageAt = now + 1500;
    this.scene.showBanner('通告板 · 第 ' + p + ' 阶段', '#ffd43b');
    this.scene.audio?.phaseChange?.();
  }

  draw(ctx) {
    const now = performance.now();
    const flash = now < this.flashUntil;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2)';

    const w = 70, h = 95;
    // 板体
    const boardColor = ['#3a3a4a', '#4a2a2a', '#2a1a1a'][this.phase - 1];
    ctx.fillStyle = boardColor;
    ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 5;
    ctx.strokeRect(-w, -h, w * 2, h * 2);

    // 纸条
    ctx.fillStyle = this.phase >= 2 ? 'rgba(250,82,82,0.6)' : 'rgba(248,249,250,0.5)';
    for (let i = 0; i < 6; i++) {
      const nx = -w + 10 + (i % 3) * 42;
      const ny = -h + 10 + Math.floor(i / 3) * 50;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate((i - 3) * 0.05 + Math.sin(now / 500 + i) * 0.02);
      ctx.fillRect(0, 0, 36, 44);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 36, 44);
      ctx.restore();
    }

    // 三阶段：齿轮
    if (this.phase === 3) {
      ctx.fillStyle = '#495057';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ang = now / 200 + (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 15, Math.sin(ang) * 15);
        ctx.lineTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 砸地预警
    if (this.slamWarning && now < this.slamWarning) {
      ctx.save();
      ctx.strokeStyle = 'rgba(250,82,82,0.8)';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(0, this.y + this.h);
      ctx.lineTo(this.scene.logicW, this.y + this.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  getHitBox() {
    return { x: this.x + 15, y: this.y + 15, w: this.w - 30, h: this.h - 30 };
  }
}

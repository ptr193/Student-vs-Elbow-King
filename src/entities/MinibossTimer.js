// 计时器小 BOSS —— 倒计时炸弹 + 时间剥夺 + 齿轮飞射
export class MinibossTimer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = 100;
    this.h = 100;
    this.homeX = x;
    this.homeY = y;
    this.phase = 1;
    this.hpMax = 8;
    this.hp = 8;
    this.cellHits = 0;
    this.hitsPerHp = 2;
    this.nextBombAt = 0;
    this.nextPulseAt = 0;
    this.nextGearAt = 0;
    this.bombs = [];
    this.flashUntil = 0;
    this.defeated = false;
    this.gearAngle = 0;
  }

  update(player, now) {
    if (this.defeated) return;

    // 偶尔横移
    if (Math.random() < 0.01) {
      this.x = this.homeX + (Math.random() - 0.5) * 120;
      this.y = this.homeY + (Math.random() - 0.5) * 60;
    }

    // 倒计时炸弹
    if (now >= this.nextBombAt) {
      this._spawnBombs(now);
      const cd = this.phase === 1 ? 10000 : 7000;
      this.nextBombAt = now + cd;
    }

    // 时间剥夺脉冲
    if (now >= this.nextPulseAt) {
      this._timePulse(player, now);
      const cd = this.phase === 1 ? 8000 : 5000;
      this.nextPulseAt = now + cd;
    }

    // 二阶段：齿轮飞射
    if (this.phase === 2 && now >= this.nextGearAt) {
      this._gearBarrage(now);
      this.nextGearAt = now + 6000;
    }

    // 更新炸弹
    this._updateBombs(player, now);
    this.gearAngle += 0.05;
  }

  _spawnBombs(now) {
    const count = this.phase === 1 ? 2 : 3;
    const timer = this.phase === 1 ? 5000 : 4000;
    for (let i = 0; i < count; i++) {
      const bx = 150 + Math.random() * (this.scene.logicW - 300);
      const by = 150 + Math.random() * (this.scene.logicH - 300);
      this.bombs.push({ x: bx, y: by, deadline: now + timer, exploded: false });
    }
    this.scene.showBanner('倒计时炸弹！击碎它们！', '#ff6b6b');
    this.scene.audio?.readerNoise?.();
  }

  _updateBombs(player, now) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      if (b.exploded) { this.bombs.splice(i, 1); continue; }
      if (now >= b.deadline) {
        b.exploded = true;
        // 爆炸伤害
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        if (Math.hypot(px - b.x, py - b.y) < 80) {
          player.takeDamage(now, 2);
          this.scene.audio?.hurt();
        }
        this.scene._spawnParticles(b.x, b.y, '#fa5252', 12);
        this.bombs.splice(i, 1);
      }
    }
  }

  _timePulse(player, now) {
    player.slowUntil = now + 3000;
    this.scene.showBanner('时间剥夺：移动减速', '#aab0ff');
    this.scene.audio?.grab?.();
    // 视觉脉冲
    this.scene._spawnParticles(this.x + this.w / 2, this.y + this.h / 2, '#aab0ff', 8);
  }

  _gearBarrage(now) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      this.scene.spawnEnemyBullet(cx, cy, Math.cos(ang) * 4, Math.sin(ang) * 4, {
        color: '#adb5bd', damage: 1, size: 10,
      });
    }
    this.scene.audio?.bossZJ?.();
  }

  takeHit(now) {
    if (this.defeated) return;
    this.cellHits++;
    this.flashUntil = now + 100;
    if (this.cellHits >= this.hitsPerHp) {
      this.cellHits = 0;
      this.hp--;
      if (this.phase === 1 && this.hp <= 0) {
        this.phase = 2;
        this.hpMax = 14;
        this.hp = 14;
        this.hitsPerHp = 2;
        this.scene.showBanner('计时器 · 二阶段', '#aab0ff');
        this.scene.audio?.phaseChange?.();
      } else if (this.phase === 2 && this.hp <= 0) {
        this.defeated = true;
        this.scene.onBossDefeated('timer');
      }
    }
  }

  draw(ctx) {
    const now = performance.now();
    const flash = now < this.flashUntil;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2)';

    // 钟体
    const bodyColor = this.phase === 1 ? '#495057' : '#6f4242';
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();

    // 齿轮
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const ang = this.gearAngle + (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 38, Math.sin(ang) * 38);
      ctx.lineTo(Math.cos(ang) * 50, Math.sin(ang) * 50);
      ctx.stroke();
    }

    // 倒计时数字
    ctx.fillStyle = this.phase === 1 ? '#ffd43b' : '#fa5252';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const num = Math.ceil((this.bombs[0]?.deadline - now) / 1000) || 0;
    ctx.fillText(num > 0 ? num : '0', 0, 0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();

    // 炸弹
    this.bombs.forEach(b => {
      const remain = Math.max(0, (b.deadline - now) / 1000);
      ctx.save();
      ctx.translate(b.x, b.y);
      // 地雷
      ctx.fillStyle = remain < 2 ? '#fa5252' : '#495057';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 倒计时数字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(remain.toFixed(1), 0, 0);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });
  }

  getHitBox() {
    return { x: this.x + 10, y: this.y + 10, w: this.w - 20, h: this.h - 20 };
  }

  // 供玩家子弹击碎炸弹时调用
  hitBomb(bomb) {
    bomb.exploded = true;
  }
}

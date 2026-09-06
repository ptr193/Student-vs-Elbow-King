// 排名表小 BOSS —— 排名光柱 + 比较波动 + 数字弹幕
export class MinibossRanking {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = 120;
    this.h = 160;
    this.homeX = x;
    this.homeY = y;
    this.phase = 1;
    this.hpMax = 12;
    this.hp = 12;
    this.cellHits = 0;
    this.hitsPerHp = 2;
    this.nextWaveAt = 0;
    this.nextNumberAt = 0;
    this.pillars = []; // {x, w, vx}
    this.flashUntil = 0;
    this.defeated = false;
    this.numberOffset = 0;
  }

  update(player, now) {
    if (this.defeated) return;

    // 缓慢横移追击
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    this.x += Math.sign(dx) * 0.3;

    // 排名光柱（持续存在，定期重排）
    if (this.pillars.length === 0 || now >= this.nextWaveAt) {
      this._spawnPillars(now);
      this.nextWaveAt = now + 10000;
    }
    this._updatePillars(player, now);

    // 比较波动（二阶段）
    if (this.phase === 2) {
      // 持续效果在 _updatePillars 中处理
    }

    // 数字弹幕
    if (now >= this.nextNumberAt) {
      this._numberBarrage(now);
      this.nextNumberAt = now + 5000;
    }

    this.numberOffset = (this.numberOffset + 0.5) % 10;
  }

  _spawnPillars(now) {
    const count = this.phase === 1 ? 3 : 5;
    const W = this.scene.logicW;
    this.pillars = [];
    for (let i = 0; i < count; i++) {
      const gap = W / (count + 1);
      this.pillars.push({
        x: gap * (i + 1) + (Math.random() - 0.5) * 60,
        w: this.phase === 1 ? 50 : 35,
        vx: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5),
      });
    }
    this.scene.showBanner('排名光柱！穿行于缝隙间', '#ffd43b');
    this.scene.audio?.readerNoise?.();
  }

  _updatePillars(player, now) {
    const W = this.scene.logicW;
    const H = this.scene.logicH;
    for (const p of this.pillars) {
      p.x += p.vx;
      if (p.x < 30 || p.x > W - 30) p.vx *= -1;

      // 碰撞检测
      const px = player.x + player.w / 2;
      if (Math.abs(px - p.x) < p.w / 2) {
        // 被光柱照到
        if (!player._pillarHitUntil || now > player._pillarHitUntil) {
          player.takeDamage(now, 1);
          player.slowUntil = now + 1000;
          player._pillarHitUntil = now + 800;
          this.scene.audio?.hurt();
        }
      }
    }
  }

  _numberBarrage(now) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const count = this.phase === 1 ? 6 : 10;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 3;
      this.scene.spawnEnemyBullet(cx, cy, Math.cos(ang) * spd, Math.sin(ang) * spd, {
        color: '#ffd43b', damage: 1, size: 8, number: Math.floor(Math.random() * 10),
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
        this.hpMax = 20;
        this.hp = 20;
        this.hitsPerHp = 2;
        this.scene.showBanner('排名表 · 二阶段', '#ffd43b');
        this.scene.audio?.phaseChange?.();
      } else if (this.phase === 2 && this.hp <= 0) {
        this.defeated = true;
        this.scene.onBossDefeated('ranking');
      }
    }
  }

  draw(ctx) {
    const now = performance.now();
    const flash = now < this.flashUntil;

    // 排名光柱
    this.pillars.forEach(p => {
      ctx.save();
      const grad = ctx.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0);
      grad.addColorStop(0, 'rgba(255,212,59,0)');
      grad.addColorStop(0.5, 'rgba(255,212,59,0.4)');
      grad.addColorStop(1, 'rgba(255,212,59,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x - p.w / 2, 0, p.w, this.scene.logicH);
      // 流动数字
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i < 8; i++) {
        const ny = ((i * 60 + this.numberOffset * 10) % this.scene.logicH);
        ctx.fillText(Math.floor(Math.random() * 100), p.x, ny);
      }
      ctx.textAlign = 'left';
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2)';

    // 表格
    const tableColor = this.phase === 1 ? '#2a2a3a' : '#3a1a1a';
    ctx.fillStyle = tableColor;
    ctx.fillRect(-55, -75, 110, 150);
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 2;
    ctx.strokeRect(-55, -75, 110, 150);

    // 数字行
    ctx.fillStyle = this.phase === 1 ? '#ffd43b' : '#fa5252';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < 8; i++) {
      const num = ((i * 7 + Math.floor(this.numberOffset)) % 99) + 1;
      const y = -60 + i * 18;
      ctx.fillText(String(num).padStart(2, '0'), 0, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(-50, y + 6);
      ctx.lineTo(50, y + 6);
      ctx.stroke();
    }
    ctx.textAlign = 'left';

    // 皇冠
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.moveTo(-15, -80);
    ctx.lineTo(-10, -90);
    ctx.lineTo(-5, -82);
    ctx.lineTo(0, -92);
    ctx.lineTo(5, -82);
    ctx.lineTo(10, -90);
    ctx.lineTo(15, -80);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  getHitBox() {
    return { x: this.x + 10, y: this.y + 10, w: this.w - 20, h: this.h - 20 };
  }
}

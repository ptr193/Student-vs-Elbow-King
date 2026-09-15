// 小 BOSS：监工（规格 5.1，v1.5 新增）
// 隐喻：监视/不信任/被人盯着。攻击：追踪光线 + 眼线杂兵
export class MinibossOverseer {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.w = 70; this.h = 90;
    this.maxHp = 40;
    this.hp = 40;
    this.defeated = false;
    this.phase = 1;
    this.nextAttackAt = performance.now() + 1500;
    this.nextSpawnAt = performance.now() + 3000;
    this.lightBeams = []; // 追踪光线
  }

  getHitBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  takeHit(now) {
    if (this.defeated) return;
    this.hp -= 1;
    if (this.hp <= this.maxHp / 2 && this.phase === 1) {
      this.phase = 2;
      this.scene.showBanner('监工二阶段：天罗地网', '#fa5252');
    }
    if (this.hp <= 0) {
      this.defeated = true;
      this.scene.onBossDefeated?.('overseer');
    }
  }

  update(player, now) {
    if (this.defeated) return;
    // 追踪光线
    if (now > this.nextAttackAt) {
      this._castLightBeam(player);
      this.nextAttackAt = this.phase === 2 ? 1200 : 2000;
      this.nextAttackAt = now + this.nextAttackAt;
    }
    // 生成眼线杂兵
    if (now > this.nextSpawnAt && this.scene.enemies.length < 6) {
      this._spawnMinion();
      this.nextSpawnAt = now + 4000;
    }
    // 更新光线
    for (let i = this.lightBeams.length - 1; i >= 0; i--) {
      const beam = this.lightBeams[i];
      beam.life--;
      // 光线追踪玩家
      const dx = player.x - beam.x;
      const dy = player.y - beam.y;
      const d = Math.hypot(dx, dy) || 1;
      beam.x += (dx / d) * 2;
      beam.y += (dy / d) * 2;
      // 命中玩家造成持续伤害
      if (d < 30 && now > beam.nextDmgAt) {
        player.hp -= 1;
        beam.nextDmgAt = now + 600;
        if (player.hp <= 0) this.scene._onPlayerDeath?.();
      }
      if (beam.life <= 0) this.lightBeams.splice(i, 1);
    }
  }

  _castLightBeam(player) {
    if (this.phase === 1) {
      this.lightBeams.push({
        x: this.x, y: this.y, life: 180, nextDmgAt: 0,
      });
    } else {
      // 二阶段：多条交叉光线
      for (let i = 0; i < 3; i++) {
        this.lightBeams.push({
          x: this.x + (i - 1) * 40, y: this.y, life: 200, nextDmgAt: 0,
        });
      }
    }
  }

  _spawnMinion() {
    const s = this.scene;
    s.enemies.push({
      x: this.x + (Math.random() - 0.5) * 100,
      y: this.y + 60,
      hp: 2, maxHp: 2, size: 16,
      def: { id: 'spy', name: '眼线', color: '#ffd43b', speed: 1.5, goldMin: 2, goldMax: 5 },
      vx: 0, vy: 0, dead: false,
      getHitBox() { return { x: this.x - 10, y: this.y - 10, w: 20, h: 20 }; },
      takeHit(now, dmg = 1) { this.hp -= dmg; if (this.hp <= 0) this.dead = true; },
      update(player, now) {
        const dx = player.x - this.x;
        this.x += Math.sign(dx) * (this.def.speed || 1);
      },
      draw(ctx) {
        ctx.fillStyle = this.def.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      },
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // 身体（监视器造型）
    ctx.fillStyle = '#212529';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    // 屏幕（眼睛）
    ctx.fillStyle = this.phase === 2 ? '#fa5252' : '#ffd43b';
    ctx.fillRect(-this.w / 2 + 8, -this.h / 2 + 10, this.w - 16, 30);
    // 天线
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -this.h / 2);
    ctx.lineTo(-15, -this.h / 2 - 15);
    ctx.moveTo(10, -this.h / 2);
    ctx.lineTo(15, -this.h / 2 - 15);
    ctx.stroke();
    ctx.restore();
    // 光线
    this.lightBeams.forEach(b => {
      ctx.fillStyle = 'rgba(255, 212, 59, 0.6)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 212, 59, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    // 血条
    const bw = 80, bh = 5;
    ctx.fillStyle = '#495057';
    ctx.fillRect(this.x - bw / 2, this.y - this.h / 2 - 12, bw, bh);
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(this.x - bw / 2, this.y - this.h / 2 - 12, bw * Math.max(0, this.hp / this.maxHp), bh);
  }
}

// 小 BOSS：广播站（规格 5.1，v1.5 新增）
// 隐喻：公开点名/公开处刑/广播通报。攻击：全屏声波脉冲 + 安全死角
export class MinibossBroadcast {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.w = 80; this.h = 80;
    this.maxHp = 45;
    this.hp = 45;
    this.defeated = false;
    this.phase = 1;
    this.nextWaveAt = performance.now() + 2000;
    this.nextSpawnAt = performance.now() + 3500;
    this.safeZoneX = x; // 安全死角位置
    this.safeZoneMoving = false;
  }

  getHitBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  takeHit(now) {
    if (this.defeated) return;
    this.hp -= 1;
    if (this.hp <= this.maxHp / 2 && this.phase === 1) {
      this.phase = 2;
      this.safeZoneMoving = true;
      this.scene.showBanner('广播站二阶段：死角游移', '#fa5252');
    }
    if (this.hp <= 0) {
      this.defeated = true;
      this.scene.onBossDefeated?.('broadcast');
    }
  }

  update(player, now) {
    if (this.defeated) return;
    // 声波脉冲
    if (now > this.nextWaveAt) {
      this._emitWave(player);
      this.nextWaveAt = now + (this.phase === 2 ? 1600 : 2400);
    }
    // 安全死角移动（二阶段）
    if (this.safeZoneMoving) {
      this.safeZoneX += Math.sin(now / 800) * 2;
      this.safeZoneX = Math.max(100, Math.min(this.scene.logicW - 100, this.safeZoneX));
    }
    // 召唤杂兵
    if (now > this.nextSpawnAt && this.scene.enemies.length < 4) {
      this._spawnMinion();
      this.nextSpawnAt = now + 4500;
    }
  }

  _emitWave(player) {
    const s = this.scene;
    // 全屏声波，但安全死角区域无伤害
    const safeW = this.phase === 2 ? 80 : 120;
    const inSafe = Math.abs(player.x - this.safeZoneX) < safeW / 2;
    if (!inSafe) {
      player.hp -= 1;
      s.audio?.hurt();
      s._spawnParticles(player.x, player.y, '#fa5252', 6);
      if (player.hp <= 0) s._onPlayerDeath?.();
    } else {
      s._spawnParticles(player.x, player.y, '#51cf66', 3);
    }
    // 视觉声波（通过 banner 提示）
    s.showBanner('声波脉冲！快躲到死角', '#fa5252');
  }

  _spawnMinion() {
    const s = this.scene;
    s.enemies.push({
      x: this.x, y: this.y + 40,
      hp: 2, maxHp: 2, size: 18,
      def: { id: 'listener', name: '听众', color: '#aab0ff', speed: 1.2, goldMin: 3, goldMax: 6 },
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
    const s = this.scene;
    // 安全死角指示
    const safeW = this.phase === 2 ? 80 : 120;
    ctx.fillStyle = 'rgba(81, 207, 102, 0.2)';
    ctx.fillRect(this.safeZoneX - safeW / 2, 0, safeW, s.logicH);
    ctx.strokeStyle = 'rgba(81, 207, 102, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.safeZoneX - safeW / 2, 0, safeW, s.logicH);

    ctx.save();
    ctx.translate(this.x, this.y);
    // 喇叭造型
    ctx.fillStyle = '#343a40';
    ctx.beginPath();
    ctx.moveTo(-this.w / 2, -this.h / 2);
    ctx.lineTo(this.w / 2, -this.h / 4);
    ctx.lineTo(this.w / 2, this.h / 4);
    ctx.lineTo(-this.w / 2, this.h / 2);
    ctx.closePath();
    ctx.fill();
    // 发声口
    ctx.fillStyle = this.phase === 2 ? '#fa5252' : '#ffd43b';
    ctx.beginPath();
    ctx.arc(this.w / 2 - 5, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 血条
    const bw = 90, bh = 5;
    ctx.fillStyle = '#495057';
    ctx.fillRect(this.x - bw / 2, this.y - this.h / 2 - 12, bw, bh);
    ctx.fillStyle = '#fa5252';
    ctx.fillRect(this.x - bw / 2, this.y - this.h / 2 - 12, bw * Math.max(0, this.hp / this.maxHp), bh);
  }
}

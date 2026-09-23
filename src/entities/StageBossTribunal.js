// 关卡 BOSS：审判台 —— 罪名光环 + 审判锤 + 宣判弹幕 + 天平倾斜
export class StageBossTribunal {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = 140;
    this.h = 220;
    this.homeX = x;
    this.homeY = y;
    this.phase = 1;
    this.hpMax = 20;
    this.hp = 20;
    this.cellHits = 0;
    this.hitsPerHp = 3;
    this.nextAuraAt = 0;
    this.nextHammerAt = 0;
    this.nextVerdictAt = 0;
    this.nextTiltAt = 0;
    this.auras = [];
    this.hammerWarning = 0;
    this.flashUntil = 0;
    this.defeated = false;
    this.tiltSide = 0; // -1 左重, 1 右重
  }

  update(player, now) {
    if (this.defeated) return;

    // 横移
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const spd = this.phase === 1 ? 0 : this.phase === 2 ? 0.5 : 1.0;
    if (Math.abs(dx) > 40) this.x += Math.sign(dx) * spd;

    // 罪名光环
    if (now >= this.nextAuraAt) {
      this._spawnAura(player, now);
      this.nextAuraAt = now + 8000;
    }
    this._updateAuras(player, now);

    // 审判锤
    if (now >= this.nextHammerAt) {
      this._hammer(now);
      const cd = [10000, 8000, 6000][this.phase - 1];
      this.nextHammerAt = now + cd;
    }

    // 宣判弹幕
    if (now >= this.nextVerdictAt) {
      this._verdict(player, now);
      this.nextVerdictAt = now + 6000;
    }

    // 天平倾斜（P3）
    if (this.phase === 3 && now >= this.nextTiltAt) {
      this._tilt(now);
      this.nextTiltAt = now + 10000;
    }
  }

  _spawnAura(player, now) {
    const count = [1, 2, 3][this.phase - 1];
    this.auras = [];
    for (let i = 0; i < count; i++) {
      this.auras.push({
        x: player.x + player.w / 2,
        y: player.y + player.h / 2,
        radius: 60,
        until: now + 5000,
      });
    }
    this.scene.showBanner('罪名光环！持续移动脱离', '#cc5de8');
    this.scene.audio?.readerNoise?.();
  }

  _updateAuras(player, now) {
    for (let i = this.auras.length - 1; i >= 0; i--) {
      const a = this.auras[i];
      if (now >= a.until) { this.auras.splice(i, 1); continue; }
      // 缓慢追踪玩家
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      a.x += (px - a.x) * 0.02;
      a.y += (py - a.y) * 0.02;
      // 持续伤害
      if (Math.hypot(px - a.x, py - a.y) < a.radius) {
        if (!player._auraHitUntil || now > player._auraHitUntil) {
          player.takeDamage(now, 0.5);
          player._auraHitUntil = now + 1000;
        }
      }
    }
  }

  _hammer(now) {
    const count = [1, 2, 3][this.phase - 1];
    this.hammerWarning = now + 1000;
    this.scene.showBanner('审判锤！跳跃闪避', '#ff6b6b');
    this.scene.audio?.chargeWarn?.();
    setTimeout(() => {
      if (this.defeated) return;
      const player = this.scene.player;
      // 多道冲击波
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          // 俯视角：改为距离判定（冲击波范围内受伤）
          if (Math.hypot(player.x - (this.x + this.w / 2), player.y - (this.y + this.h / 2)) < 200) {
            player.takeDamage(performance.now(), 1);
            this.scene.audio?.hurt();
          }
          this.scene._spawnParticles(this.x + this.w / 2, this.y + this.h, '#ff6b6b', 10);
        }, i * 300);
      }
    }, 1000);
  }

  _verdict(player, now) {
    const cx = this.x + this.w / 2;
    const count = [4, 6, 8][this.phase - 1];
    for (let i = 0; i < count; i++) {
      const vx = 100 + Math.random() * (this.scene.logicW - 200);
      this.scene.spawnEnemyBullet(vx, 0, 0, 4, {
        color: '#dee2e6', damage: 1, size: 10, groundZone: true, zoneUntil: now + 3000,
      });
    }
    this.scene.audio?.bossZJ?.();
  }

  _tilt(now) {
    this.tiltSide = Math.random() < 0.5 ? -1 : 1;
    this.scene.showBanner('天平倾斜！到轻的一侧去', '#ffd43b');
    // 5秒后翻转
    setTimeout(() => { this.tiltSide *= -1; }, 5000);
    setTimeout(() => { this.tiltSide = 0; }, 10000);
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
        // 触发身份揭示
        this.scene.showBanner('身份揭示：你竟是……肘击王曾经的得意门生', '#ff006e');
        setTimeout(() => this.scene.onBossDefeated('tribunal'), 2500);
      }
    }
  }

  _enterPhase(p, now) {
    this.phase = p;
    const hpVals = [20, 30, 45];
    this.hpMax = hpVals[p - 1];
    this.hp = hpVals[p - 1];
    this.cellHits = 0;
    this.nextAuraAt = now + 1500;
    this.scene.showBanner('审判台 · 第 ' + p + ' 阶段', '#cc5de8');
    this.scene.audio?.phaseChange?.();
  }

  draw(ctx) {
    const now = performance.now();
    const flash = now < this.flashUntil;

    // 罪名光环
    this.auras.forEach(a => {
      ctx.save();
      const grad = ctx.createRadialGradient(a.x, a.y, 10, a.x, a.y, a.radius);
      grad.addColorStop(0, 'rgba(204,93,232,0.3)');
      grad.addColorStop(1, 'rgba(204,93,232,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(204,93,232,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2)';

    // 台座
    const baseColor = ['#2a2a3a', '#3a2a2a', '#1a1a2a'][this.phase - 1];
    ctx.fillStyle = baseColor;
    ctx.fillRect(-60, -100, 120, 200);
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 3;
    ctx.strokeRect(-60, -100, 120, 200);

    // 法槌
    ctx.fillStyle = this.phase >= 2 ? '#fa5252' : '#8b5a2b';
    ctx.fillRect(-15, -110, 30, 20);
    ctx.fillRect(-5, -90, 10, 30);

    // 天平
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, -80);
    ctx.lineTo(40, -80);
    ctx.stroke();
    const tilt = this.tiltSide * 0.1;
    ctx.beginPath();
    ctx.moveTo(-40, -80 + tilt * 10);
    ctx.lineTo(-50, -60 + tilt * 10);
    ctx.moveTo(40, -80 - tilt * 10);
    ctx.lineTo(50, -60 - tilt * 10);
    ctx.stroke();

    // 发光符号
    ctx.fillStyle = this.phase === 3 ? '#fa5252' : '#ffd43b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚖', 0, 0);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  getHitBox() {
    return { x: this.x + 15, y: this.y + 15, w: this.w - 30, h: this.h - 30 };
  }
}

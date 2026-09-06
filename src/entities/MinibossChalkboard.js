// 抄写板小 BOSS —— 笔迹追踪 + 书写牢笼 + 粉笔飞溅
export class MinibossChalkboard {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = 140;
    this.h = 100;
    this.homeX = x;
    this.homeY = y;
    this.phase = 1;
    this.hpMax = 10;
    this.hp = 10;
    this.cellHits = 0;
    this.hitsPerHp = 2;
    this.nextTrailAt = 0;
    this.nextShrapnelAt = 0;
    this.nextCageAt = 0;
    this.trails = []; // {x1,y1,x2,y2,deadline}
    this.cage = null; // {x,y,w,h,deadline,hp}
    this.flashUntil = 0;
    this.defeated = false;
    this.chalkAngle = 0;
  }

  update(player, now) {
    if (this.defeated) return;

    // 缓慢追击玩家（二阶段）
    if (this.phase === 2) {
      const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
      this.x += Math.sign(dx) * 0.5;
    }

    // 笔迹追踪
    if (now >= this.nextTrailAt) {
      this._spawnTrails(player, now);
      const cd = this.phase === 1 ? 6000 : 4000;
      this.nextTrailAt = now + cd;
    }

    // 粉笔飞溅
    if (now >= this.nextShrapnelAt) {
      this._shrapnel(player, now);
      this.nextShrapnelAt = now + 5000;
    }

    // 二阶段：书写牢笼
    if (this.phase === 2 && now >= this.nextCageAt) {
      this._spawnCage(player, now);
      this.nextCageAt = now + 12000;
    }

    this._updateTrails(player, now);
    this._updateCage(player, now);
    this.chalkAngle += 0.03;
  }

  _spawnTrails(player, now) {
    const count = this.phase === 1 ? 3 : 5;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 80 + Math.random() * 120;
      this.trails.push({
        x1: cx + Math.cos(ang) * 60,
        y1: cy + Math.sin(ang) * 60,
        x2: cx + Math.cos(ang) * (60 + len),
        y2: cy + Math.sin(ang) * (60 + len),
        deadline: now + 1000,
        active: false,
      });
    }
    this.scene.showBanner('笔迹追踪！', '#e9ecef');
    this.scene.audio?.readerNoise?.();
  }

  _updateTrails(player, now) {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      if (!t.active && now >= t.deadline) {
        t.active = true;
        t.damageUntil = now + 3000;
      }
      if (t.active && now >= t.damageUntil) {
        this.trails.splice(i, 1);
        continue;
      }
      // 碰撞检测
      if (t.active) {
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dist = this._pointToLineDist(px, py, t.x1, t.y1, t.x2, t.y2);
        if (dist < 12) {
          player.takeDamage(now, 1);
          this.scene.audio?.hurt();
        }
      }
    }
  }

  _pointToLineDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  _spawnCage(player, now) {
    const w = 160, h = 120;
    this.cage = {
      x: player.x + player.w / 2 - w / 2,
      y: player.y + player.h / 2 - h / 2,
      w, h,
      deadline: now + 2000,
      active: false,
      wallHp: 3,
    };
    this.scene.showBanner('书写牢笼！射破壁逃出', '#ced4da');
    this.scene.audio?.grab?.();
  }

  _updateCage(player, now) {
    if (!this.cage) return;
    const c = this.cage;
    if (!c.active && now >= c.deadline) {
      c.active = true;
      c.damageUntil = now + 5000;
    }
    if (c.active) {
      if (now >= c.damageUntil || c.wallHp <= 0) {
        this.cage = null;
        return;
      }
      // 限制玩家在笼内
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      if (cx < c.x + 10) player.x = c.x + 10 - player.w / 2;
      if (cx > c.x + c.w - 10) player.x = c.x + c.w - 10 - player.w / 2;
      if (cy < c.y + 10) player.y = c.y + 10 - player.h / 2;
      if (cy > c.y + c.h - 10) player.y = c.y + c.h - 10 - player.h / 2;
    }
  }

  _shrapnel(player, now) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const baseAng = Math.atan2(py - cy, px - cx);
    const count = this.phase === 1 ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const ang = baseAng + (i - (count - 1) / 2) * 0.3;
      this.scene.spawnEnemyBullet(cx, cy, Math.cos(ang) * 5, Math.sin(ang) * 5, {
        color: '#e9ecef', damage: 1, size: 6,
      });
    }
    this.scene.audio?.bossZJ?.();
  }

  takeHit(now) {
    if (this.defeated) return;
    // 检查是否打到牢笼壁
    if (this.cage && this.cage.active) {
      // 简化：子弹命中 BOSS 也可能命中笼壁
    }
    this.cellHits++;
    this.flashUntil = now + 100;
    if (this.cellHits >= this.hitsPerHp) {
      this.cellHits = 0;
      this.hp--;
      if (this.phase === 1 && this.hp <= 0) {
        this.phase = 2;
        this.hpMax = 16;
        this.hp = 16;
        this.hitsPerHp = 2;
        this.scene.showBanner('抄写板 · 二阶段', '#ced4da');
        this.scene.audio?.phaseChange?.();
      } else if (this.phase === 2 && this.hp <= 0) {
        this.defeated = true;
        this.scene.onBossDefeated('chalkboard');
      }
    }
  }

  draw(ctx) {
    const now = performance.now();
    const flash = now < this.flashUntil;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    if (flash) ctx.filter = 'brightness(2)';

    // 黑板
    const boardColor = this.phase === 1 ? '#2d4a3e' : '#3d2a2a';
    ctx.fillStyle = boardColor;
    ctx.fillRect(-60, -44, 120, 88);
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 6;
    ctx.strokeRect(-60, -44, 120, 88);

    // 粉笔轨迹流动
    ctx.strokeStyle = this.phase === 1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,100,100,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const y = -30 + i * 20 + Math.sin(now / 300 + i) * 4;
      ctx.moveTo(-50, y);
      ctx.lineTo(50, y);
      ctx.stroke();
    }

    // 四角粉笔
    ctx.fillStyle = '#fff';
    [[-52, -36], [52, -36], [-52, 36], [52, 36]].forEach(([cx, cy]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.chalkAngle);
      ctx.fillRect(-8, -2, 16, 4);
      ctx.restore();
    });
    ctx.restore();

    // 笔迹轨迹
    this.trails.forEach(t => {
      ctx.save();
      ctx.strokeStyle = t.active ? 'rgba(250,82,82,0.8)' : 'rgba(233,236,239,0.6)';
      ctx.lineWidth = t.active ? 8 : 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
      ctx.restore();
    });

    // 书写牢笼
    if (this.cage) {
      const c = this.cage;
      ctx.save();
      ctx.strokeStyle = c.active ? 'rgba(250,82,82,0.9)' : 'rgba(233,236,239,0.5)';
      ctx.lineWidth = 6;
      ctx.setLineDash(c.active ? [] : [10, 6]);
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.setLineDash([]);
      // 笼壁血量
      if (c.active) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText('壁 HP: ' + c.wallHp, c.x + 5, c.y - 8);
      }
      ctx.restore();
    }
  }

  getHitBox() {
    return { x: this.x + 10, y: this.y + 10, w: this.w - 20, h: this.h - 20 };
  }
}

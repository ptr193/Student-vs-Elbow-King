// 碰撞管理模块 — 集中处理玩家子弹/敌人子弹/BOSS/敌人间的碰撞
// 提取自 GameScene，便于维护和测试

export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  // 主入口：每帧调用
  update(now) {
    this._playerBulletsVsBoss(now);
    this._playerBulletsVsEnemies(now);
    this._enemyBulletsVsPlayer(now);
    this._enemyContactVsPlayer(now);
    this._playerBulletsVsTimerBombs(now);
  }

  // 玩家子弹 vs BOSS（含肘击 vs 玩家、P2 冲撞身体碰撞）
  _playerBulletsVsBoss(now) {
    const scene = this.scene;
    const boss = scene.boss;
    if (!boss || boss.defeated) return;
    const bbox = boss.getHitBox();
    for (let i = scene.playerBullets.length - 1; i >= 0; i--) {
      const b = scene.playerBullets[i];
      if (this._rectHit(b, bbox)) {
        if (!b.pierce) scene.playerBullets.splice(i, 1);
        boss.takeHit(now);
        scene._applySpecialBullet(b, boss, b.x, b.y);
        scene._spawnParticles(b.x, b.y, b.color, 4);
        scene.audio?.hit();
      }
    }
    // 肘击 vs 玩家
    for (let i = scene.zjAttacks.length - 1; i >= 0; i--) {
      const z = scene.zjAttacks[i];
      if (this._rectHit(z, this._playerBox())) {
        scene.zjAttacks.splice(i, 1);
        const cfg = boss.currentCfg ? boss.currentCfg() : { isP2: false };
        const died = scene.player.takeDamage(now, cfg.isP2 ? 99 : 1);
        scene._spawnParticles(scene.player.x, scene.player.y, '#fa5252', 8);
        scene.audio?.hurt();
        if (died) scene._onPlayerDeath();
      }
    }
    // BOSS 身体碰撞（P2 冲撞）
    if (boss.getBodyBox && boss.chargeState === 'charging') {
      if (this._rectHit(boss.getBodyBox(), this._playerBox()) && !boss.chargeHitThisTime) {
        boss.chargeHitThisTime = true;
        boss.chargeState = 'stun';
        boss.chargeUntil = now + 1400;
        const died = scene.player.takeDamage(now, 1);
        if (died) scene._onPlayerDeath();
      }
    }
  }

  // 玩家子弹 vs 敌人
  _playerBulletsVsEnemies(now) {
    const scene = this.scene;
    for (let i = scene.playerBullets.length - 1; i >= 0; i--) {
      const b = scene.playerBullets[i];
      for (const e of scene.enemies) {
        if (e.dead) continue;
        if (this._rectHit(b, e.getHitBox())) {
          if (!b.pierce) scene.playerBullets.splice(i, 1);
          e.takeHit(now, b.damage);
          scene._applySpecialBullet(b, e, b.x, b.y);
          scene._spawnParticles(b.x, b.y, e.color, 3);
          scene.audio?.hit();
          if (!b.pierce) break;
        }
      }
    }
  }

  // 敌人子弹 vs 玩家
  _enemyBulletsVsPlayer(now) {
    const scene = this.scene;
    const pBox = this._playerBox();
    for (let i = scene.enemyBullets.length - 1; i >= 0; i--) {
      const b = scene.enemyBullets[i];
      if (this._rectHit(b, pBox)) {
        if (!b.groundZone) scene.enemyBullets.splice(i, 1); // 地面区域不消失，持续伤害
        const died = scene.player.takeDamage(now, b.damage);
        if (b.pinPlayer) {
          scene.player.stunUntil = now + 2000;
          scene.showBanner('被张贴定身！', '#fa5252');
        }
        scene._spawnParticles(scene.player.x, scene.player.y, '#fa5252', 6);
        scene.audio?.hurt();
        if (died) scene._onPlayerDeath();
      }
    }
  }

  // 敌人接触 vs 玩家
  _enemyContactVsPlayer(now) {
    const scene = this.scene;
    const pBox = this._playerBox();
    for (const e of scene.enemies) {
      if (e.dead) continue;
      if (this._rectHit(e.getHitBox(), pBox)) {
        const died = scene.player.takeDamage(now, 1);
        if (died) scene._onPlayerDeath();
      }
    }
  }

  // 玩家子弹 vs 计时器炸弹
  _playerBulletsVsTimerBombs(now) {
    const scene = this.scene;
    if (!scene.boss || !scene.boss.bombs) return;
    for (let i = scene.playerBullets.length - 1; i >= 0; i--) {
      const b = scene.playerBullets[i];
      for (let j = scene.boss.bombs.length - 1; j >= 0; j--) {
        const bomb = scene.boss.bombs[j];
        if (bomb.exploded) continue;
        if (Math.hypot(b.x - bomb.x, b.y - bomb.y) < 20) {
          scene.boss.bombs.splice(j, 1);
          scene.playerBullets.splice(i, 1);
          scene._spawnParticles(bomb.x, bomb.y, '#ffd43b', 6);
          break;
        }
      }
    }
  }

  _playerBox() {
    const p = this.scene.player;
    return { x: p.x + 6, y: p.y + 10, w: p.w - 12, h: p.h - 18 };
  }

  _rectHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
}

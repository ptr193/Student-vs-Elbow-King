import Phaser from 'phaser';
import gameConfig from '../config/game_config.json';
import { Player } from '../entities/Player.js';
import { BossZJW } from '../entities/BossZJW.js';
import { MinibossReader } from '../entities/MinibossReader.js';
import { Enemy } from '../entities/Enemy.js';
import { Bullet, ZjAttack } from '../entities/Bullet.js';
import { NPC } from '../entities/NPC.js';
import { RoguelikeSystem } from '../systems/RoguelikeSystem.js';
import { ItemSystem } from '../systems/ItemSystem.js';
import { GoldSystem } from '../systems/GoldSystem.js';
import { SuccessionSystem } from '../systems/SuccessionSystem.js';
import { MetaManager } from '../systems/SettingsManager.js';
import npcsData from '../data/npcs.json';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init() {
    this.logicW = gameConfig.logicWidth;
    this.logicH = gameConfig.logicHeight;
    this.groundY = this.logicH - 80;
  }

  create() {
    this.audio = this.game.registry.get('audio');
    this.roguelike = new RoguelikeSystem();
    this.itemSys = new ItemSystem(this);
    this.goldSys = new GoldSystem();
    this.succession = new SuccessionSystem();

    // 创建渲染用 Canvas 纹理（所有实体通过 draw(ctx) 绘制到此）
    // 重启场景时需移除旧纹理，避免 "key already in use" 错误
    if (this.textures.exists('worldTex')) {
      this.textures.remove('worldTex');
    }
    this.worldTex = this.textures.createCanvas('worldTex', this.logicW, this.logicH);
    this.worldCtx = this.worldTex.getContext();
    this.worldImage = this.add.image(0, 0, 'worldTex').setOrigin(0, 0).setDepth(0);
    this._bgColor = '#2a1a3a';

    this.playerBullets = [];
    this.enemyBullets = [];
    this.zjAttacks = [];
    this.enemies = [];
    this.npcs = [];
    this.particles = [];

    this.paused = false;
    this.gameOver = false;
    this.won = false;
    this.bossDefeated = new Set();

    // 输入
    this.inputState = { moveX: 0, moveY: 0, fire: false, jump: false, jumpPressed: false };
    this._setupInput();

    // 玩家
    this.player = new Player(this, 60, this.groundY);
    // 应用随机被动技能
    this.player.applySkill(this.roguelike.passiveSkill);

    // BOSS 文本
    this.boss = null;
    this.bannerText = '';
    this.bannerUntil = 0;
    this.bannerColor = '#ffd43b';

    // 生成第一间房
    this.roguelike.generateRun();
    this._loadRoom();

    this.audio?.startBgm('battle');

    // 启动 HUD
    this.scene.launch('UIScene');
  }

  update(time, delta) {
    this._update(time, delta);
  }

  _setupInput() {
    // 键盘
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      fire: Phaser.Input.Keyboard.KeyCodes.J,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      item1: Phaser.Input.Keyboard.KeyCodes.ONE,
      item2: Phaser.Input.Keyboard.KeyCodes.TWO,
      item3: Phaser.Input.Keyboard.KeyCodes.THREE,
      special: Phaser.Input.Keyboard.KeyCodes.Q,
    });
    this.keys.jump.on('down', () => { this.inputState.jumpPressed = true; });
    this.keys.fire.on('down', () => { this.inputState.fire = true; });
    this.keys.fire.on('up', () => { this.inputState.fire = false; });
    this.keys.esc.on('down', () => this._togglePause());
    this.keys.item1.on('down', () => this._useItem(0));
    this.keys.item2.on('down', () => this._useItem(1));
    this.keys.item3.on('down', () => this._useItem(2));
    this.keys.special.on('down', () => this._switchBullet());

    // 触屏（简化版，单键射击+跳跃）
    this._setupTouchControls();
  }

  _useItem(slot) {
    const def = this.itemSys.useItem(slot);
    if (def) {
      this.itemSys.applyItemEffect(def, this.player);
      this.audio?.skillActivate();
      this.showBanner('使用：' + def.name, def.color || '#ffd43b');
    }
  }

  _switchBullet() {
    if (this.roguelike.specialAmmo > 0 && this.roguelike.specialBullet !== 'normal') {
      this.roguelike.specialBullet = 'normal';
      this.showBanner('切换：普通弹', '#ffd43b');
    } else {
      this.showBanner('无特殊弹药', '#868e96');
    }
  }

  _setupTouchControls() {
    // 左侧移动区
    const moveZone = this.add.zone(0, 0, this.scale.width * 0.5, this.scale.height)
      .setOrigin(0, 0).setInteractive();
    moveZone.on('pointerdown', (p) => this._moveStart(p));
    moveZone.on('pointermove', (p) => this._moveMove(p));
    moveZone.on('pointerup', () => this._moveEnd());
    this._movePointer = null;
    this._moveCenter = { x: 0, y: 0 };

    // 右侧射击区
    const fireZone = this.add.zone(this.scale.width * 0.5, 0, this.scale.width * 0.5, this.scale.height * 0.6)
      .setOrigin(0, 0).setInteractive();
    fireZone.on('pointerdown', () => { this.inputState.fire = true; });
    fireZone.on('pointerup', () => { this.inputState.fire = false; });

    // 右侧跳跃按钮
    const jumpBtn = this.add.zone(this.scale.width * 0.75, this.scale.height * 0.8, this.scale.width * 0.4, this.scale.height * 0.3)
      .setOrigin(0.5).setInteractive();
    jumpBtn.on('pointerdown', () => { this.inputState.jumpPressed = true; });

    // 抽查点击
    this.input.on('pointerdown', (p) => {
      if (this.boss instanceof MinibossReader && this.boss.quizActive) {
        // 转换到逻辑坐标
        const lx = p.x / this.scale.width * this.logicW;
        const ly = p.y / this.scale.height * this.logicH;
        const idx = this.boss.getQuizOptionAt(lx, ly, this.logicW, this.logicH);
        if (idx >= 0) this.boss.answerQuiz(idx, performance.now());
      }
    });
  }

  _moveStart(p) {
    this._movePointer = p;
    this._moveCenter = { x: p.x, y: p.y };
  }
  _moveMove(p) {
    if (!this._movePointer) return;
    const dx = p.x - this._moveCenter.x;
    const dy = p.y - this._moveCenter.y;
    this.inputState.moveX = Math.max(-1, Math.min(1, dx / 80));
    this.inputState.moveY = Math.max(-1, Math.min(1, dy / 80));
  }
  _moveEnd() {
    this._movePointer = null;
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
  }

  _loadRoom() {
    const room = this.roguelike.getCurrentRoom();
    if (!room) {
      this._win();
      return;
    }
    this.enemies = [];
    this.npcs = [];
    this.boss = null;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.zjAttacks = [];
    this.player.x = 60;
    this.player.y = this.groundY;
    // 房间初始无敌，避免刚出生就被秒
    this.player.invincibleUntil = performance.now() + 3000;
    this.player.flashUntil = performance.now() + 3000;

    const ch = this.roguelike.getCurrentChapter();
    this._bgColor = ch.color;

    if (room.type === 'miniBoss' && ch.miniBoss === 'reader') {
      this.boss = new MinibossReader(this, this.logicW * 0.7, 200);
      this.showBanner('小 BOSS：读卡机', '#cc5de8');
    } else if (room.type === 'stageBoss' && ch.stageBoss === 'bulletin') {
      // 通告板简化为强力杂兵群
      const enemies = [
        { id: 'redmarker', hp: 8, speed: 1.8, goldMin: 40, goldMax: 60, attack: 'rush_and_throw', attackCd: 1800, color: '#fa5252', size: 40, isElite: true },
        { id: 'redmarker', hp: 8, speed: 1.8, goldMin: 40, goldMax: 60, attack: 'rush_and_throw', attackCd: 1800, color: '#fa5252', size: 40, isElite: true },
        { id: 'corrector', hp: 10, speed: 1.2, goldMin: 50, goldMax: 70, attack: 'red_arc', attackCd: 1600, color: '#c92a2a', size: 42, isElite: true },
      ];
      enemies.forEach((e, i) => this.enemies.push(new Enemy(this, e, this.logicW * 0.6 + i * 60, 200 + i * 40)));
      this.showBanner('关卡 BOSS：通告板', '#ffd43b');
    } else if (room.type === 'stageBoss' && ch.stageBoss === 'tribunal') {
      const enemies = [
        { id: 'corrector', hp: 12, speed: 1.3, goldMin: 50, goldMax: 70, attack: 'red_arc', attackCd: 1500, color: '#c92a2a', size: 44, isElite: true },
        { id: 'echo', hp: 8, speed: 1.5, goldMin: 40, goldMax: 60, attack: 'mimic_shot', attackCd: 2000, color: '#aab0ff', size: 36, isElite: true },
        { id: 'stackpile', hp: 10, speed: 0.7, goldMin: 50, goldMax: 70, attack: 'none', attackCd: 0, color: '#495057', size: 46, isElite: true },
      ];
      enemies.forEach((e, i) => this.enemies.push(new Enemy(this, e, this.logicW * 0.6 + i * 60, 200 + i * 40)));
      this.showBanner('关卡 BOSS：审判台', '#ff6b6b');
    } else if (ch.id === 'C3' && room.room === this.roguelike.roomsPerSubArea - 1) {
      // 最终 BOSS 肘击王（C3 最后一间）
      this.boss = new BossZJW(this, this.logicW * 0.75, this.groundY + 80 - 200);
      this.boss.chargeMaxDistance = this.logicW * 0.55;
      this.boss.nextAttackAt = performance.now() + 2500; // 给玩家反应时间
      this.showBanner('最终 BOSS：肘击王', '#ff006e');
      this.audio?.startBgm('boss');
    } else {
      // 普通战斗房
      const enemies = this.roguelike.spawnEnemiesForRoom(room);
      enemies.forEach((e, i) => {
        this.enemies.push(new Enemy(this, e, this.logicW * 0.5 + (i % 3) * 80, 150 + Math.floor(i / 3) * 80));
      });
      // 道具房
      if (room.type === 'item') {
        this._spawnItemDrop(this.logicW * 0.5, this.groundY - 20);
      }
      // NPC 房（小概率）
      if (Math.random() < 0.15 && this.npcs.length === 0) {
        const npcDef = npcsData[Math.floor(Math.random() * npcsData.length)];
        this.npcs.push(new NPC(this, npcDef, this.logicW * 0.4, 300));
      }
    }
  }

  _spawnItemDrop(x, y) {
    const items = ['ink_bottle', 'red_pen', 'eraser', 'paperclip', 'shredded_paper', 'paperweight'];
    const id = items[Math.floor(Math.random() * items.length)];
    this.itemDrops = this.itemDrops || [];
    this.itemDrops.push({ x, y, id, bob: Math.random() * Math.PI * 2 });
  }

  _update(time, delta) {
    if (this.paused || this.gameOver) return;
    const now = performance.now();

    // 键盘轮询
    if (this.keys.left.isDown) this.inputState.moveX = -1;
    else if (this.keys.right.isDown) this.inputState.moveX = 1;
    else if (!this._movePointer) this.inputState.moveX = 0;

    // 玩家
    this.player.update(this.inputState, delta, this.groundY);

    // 射击
    if (this.inputState.fire) this._playerFire(now);

    // BOSS
    if (this.boss) this.boss.update(this.player, now);

    // 敌人
    this.enemies.forEach(e => e.update(this.player, now));
    this.enemies = this.enemies.filter(e => !e.dead);

    // 玩家子弹
    this.playerBullets.forEach(b => b.update());
    this.playerBullets = this.playerBullets.filter(b => !b.isExpired() && b.x > -20 && b.x < this.logicW + 20 && b.y > -20 && b.y < this.logicH + 20);

    // 敌人子弹
    this.enemyBullets.forEach(b => b.update());
    this.enemyBullets = this.enemyBullets.filter(b => !b.isExpired() && b.x > -20 && b.x < this.logicW + 20);

    // 肘击
    this.zjAttacks.forEach(z => z.update());
    this.zjAttacks = this.zjAttacks.filter(z => z.x > -50 && z.x < this.logicW + 50);

    // 碰撞
    this._collisions(now);

    // 粒子
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.05;
    });
    this.particles = this.particles.filter(p => now - p.born < p.life);

    // 道具掉落拾取
    if (this.itemDrops) {
      this.itemDrops.forEach((d, i) => {
        d.bob += 0.05;
        if (Math.abs(this.player.x + this.player.w / 2 - d.x) < 40 && Math.abs(this.player.y - d.y) < 60) {
          if (this.itemSys.addItem(d.id)) {
            this.audio?.pickup();
            this.showBanner('获得道具', '#51cf66');
          }
          this.itemDrops.splice(i, 1);
        }
      });
    }

    // NPC 交互
    this.npcs.forEach(n => {
      if (!n.interacted && this._rectHit(this.player, n.getHitBox())) {
        n.interacted = true;
        this.showBanner(n.def.rescue, n.def.color);
        this.audio?.pickup();
        if (n.def.reward === 'rare_item') this._spawnItemDrop(n.x, n.y - 30);
      }
    });

    // 检查房间是否清空
    const room = this.roguelike.getCurrentRoom();
    if (room && (room.type === 'battle' || room.type === 'trap')) {
      if (this.enemies.length === 0) {
        this._nextRoom();
      }
    } else if (room && room.type === 'stageBoss') {
      if (this.enemies.length === 0 && !this.bossDefeated.has(room.type + room.chapter)) {
        this.bossDefeated.add(room.type + room.chapter);
        this._onStageBossDefeated();
      }
    } else if (room && room.type === 'miniBoss') {
      // BOSS 被击败后进入下一间
    } else if (room && (room.type === 'item' || room.type === 'rest')) {
      // 休息回血
      if (room.type === 'rest') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        room.type = 'cleared';
      }
    }

    this._renderWorld();
  }

  _renderWorld() {
    const ctx = this.worldCtx;
    const W = this.logicW, H = this.logicH;
    // 背景
    ctx.fillStyle = this._bgColor || '#2a1a3a';
    ctx.fillRect(0, 0, W, H);
    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 地面
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, this.groundY + 48, W, H - this.groundY - 48);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, this.groundY + 48, W, 2);

    // 道具掉落
    if (this.itemDrops) {
      this.itemDrops.forEach(d => {
        const y = d.y + Math.sin(d.bob) * 4;
        ctx.save();
        ctx.translate(d.x, y);
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
        g.addColorStop(0, 'rgba(255,212,59,0.6)');
        g.addColorStop(1, 'rgba(255,212,59,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd43b';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      });
    }

    // NPC
    this.npcs.forEach(n => n.draw(ctx));

    // 敌人
    this.enemies.forEach(e => e.draw(ctx));

    // BOSS
    if (this.boss) {
      const tex = {
        zjw1: this.textures.get('zjw1').getSourceImage(),
        zjw2: this.textures.get('zjw2').getSourceImage(),
      };
      this.boss.draw(ctx, tex);
    }

    // 玩家
    const playerTex = this.textures.get('player').getSourceImage();
    this.player.draw(ctx, playerTex);

    // 子弹
    this.enemyBullets.forEach(b => b.draw(ctx));
    this.zjAttacks.forEach(z => z.draw(ctx));
    this.playerBullets.forEach(b => b.draw(ctx));

    // 粒子
    const now = performance.now();
    this.particles.forEach(p => {
      const a = 1 - (now - p.born) / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // BOSS 抽查面板
    if (this.boss instanceof MinibossReader && this.boss.quizActive) {
      this.boss.drawQuiz(ctx, W, H);
    }

    // BOSS 血条
    if (this.boss && !this.boss.defeated) {
      const bw = 300, bh = 10;
      const bx = (W - bw) / 2, by = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.boss.phase === 2 ? '#ff006e' : '#fa5252';
      ctx.fillRect(bx, by, bw * (this.boss.hp / this.boss.hpMax), bh);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const name = this.boss instanceof BossZJW ? '肘击王' : '读卡机';
      ctx.fillText(name + ' · P' + this.boss.phase, W / 2, by - 6);
      ctx.textAlign = 'left';
    }

    // Banner
    if (now < this.bannerUntil) {
      const remain = (this.bannerUntil - now) / 1800;
      ctx.globalAlpha = Math.min(1, remain * 3);
      ctx.fillStyle = this.bannerColor;
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.bannerText, W / 2, H * 0.18);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    this.worldTex.refresh();
  }

  _playerFire(now) {
    if (now - this.player.lastFireAt < gameConfig.fireCooldownMs * this.player.fireRateMult) return;
    this.player.lastFireAt = now;
    const bx = this.player.x + this.player.w - 4;
    const by = this.player.y + 18;
    const targetX = this.boss ? this.boss.x + this.boss.w / 2 : (this.enemies[0]?.x || this.logicW);
    const targetY = this.boss ? this.boss.y + this.boss.h / 2 : (this.enemies[0]?.y || this.groundY);
    const dx = targetX - bx, dy = targetY - by;
    const L = Math.hypot(dx, dy) || 1;
    let damage = 1 * this.player.attackMultiplier;
    if (this.player.bonusShots > 0) {
      damage *= (1 + this.player.bonusDamage);
      this.player.bonusShots--;
    }
    if (this.player.critShots > 0) {
      damage *= 2;
      this.player.critShots--;
    }
    const speed = gameConfig.bulletSpeed * this.player.bulletSpeedMult;
    this.playerBullets.push(new Bullet(this, bx, by, dx / L * speed, dy / L * speed, {
      damage, color: this.player.critShots > 0 ? '#ff006e' : '#ffd43b',
    }));
    this.audio?.shoot();
  }

  spawnEnemyBullet(x, y, vx, vy, opts) {
    this.enemyBullets.push(new Bullet(this, x, y, vx, vy, opts));
  }

  spawnZj(x, y, vx, vy, opts) {
    this.zjAttacks.push(new ZjAttack(this, x, y, vx, vy, opts));
  }

  _collisions(now) {
    const pBox = { x: this.player.x + 6, y: this.player.y + 10, w: this.player.w - 12, h: this.player.h - 18 };
    // 玩家子弹 vs BOSS
    if (this.boss && !this.boss.defeated) {
      const bbox = this.boss.getHitBox();
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        if (this._rectHit(b, bbox)) {
          this.playerBullets.splice(i, 1);
          this.boss.takeHit(now);
          this._spawnParticles(b.x, b.y, '#ffd43b', 4);
          this.audio?.hit();
        }
      }
      // 肘击 vs 玩家
      for (let i = this.zjAttacks.length - 1; i >= 0; i--) {
        const z = this.zjAttacks[i];
        if (this._rectHit(z, pBox)) {
          this.zjAttacks.splice(i, 1);
          const cfg = this.boss.currentCfg();
          const died = this.player.takeDamage(now, cfg.isP2 ? 99 : 1);
          this._spawnParticles(this.player.x, this.player.y, '#fa5252', 8);
          this.audio?.hurt();
          if (died) this._onPlayerDeath();
        }
      }
      // BOSS 身体碰撞（P2 冲撞）
      if (this.boss instanceof BossZJW && this.boss.chargeState === 'charging') {
        if (this._rectHit(this.boss.getBodyBox(), pBox) && !this.boss.chargeHitThisTime) {
          this.boss.chargeHitThisTime = true;
          this.boss.chargeState = 'stun';
          this.boss.chargeUntil = now + 1400;
          const died = this.player.takeDamage(now, 1);
          if (died) this._onPlayerDeath();
        }
      }
    }
    // 玩家子弹 vs 敌人
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (this._rectHit(b, e.getHitBox())) {
          this.playerBullets.splice(i, 1);
          e.takeHit(now, b.damage);
          this._spawnParticles(b.x, b.y, e.color, 3);
          this.audio?.hit();
          break;
        }
      }
    }
    // 敌人子弹 vs 玩家
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      if (this._rectHit(b, pBox)) {
        this.enemyBullets.splice(i, 1);
        const died = this.player.takeDamage(now, b.damage);
        this._spawnParticles(this.player.x, this.player.y, '#fa5252', 6);
        this.audio?.hurt();
        if (died) this._onPlayerDeath();
      }
    }
    // 敌人接触
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (this._rectHit(e.getHitBox(), pBox)) {
        const died = this.player.takeDamage(now, 1);
        if (died) this._onPlayerDeath();
      }
    }
  }

  onEnemyKilled(enemy) {
    const gold = enemy.def.goldMin + Math.floor(Math.random() * (enemy.def.goldMax - enemy.def.goldMin));
    this.goldSys.add(gold);
    this.audio?.gold();
    if (Math.random() < 0.1) this._spawnItemDrop(enemy.x, enemy.y);
  }

  onBossDefeated(bossId) {
    this.bossDefeated.add(bossId);
    this.audio?.bossDie();
    this.showBanner('击败 ' + (bossId === 'zjw' ? '肘击王' : bossId), '#51cf66');
    if (bossId === 'zjw') {
      // 击败肘击王，重置三败计数
      const meta = MetaManager.load();
      meta.threeDefeatCount = 0;
      MetaManager.save(meta);
      this._win();
    } else {
      setTimeout(() => this._nextRoom(), 1500);
    }
  }

  _onStageBossDefeated() {
    const ch = this.roguelike.getCurrentChapter();
    if (ch.id === 'C2') {
      this.showBanner('身份揭示：你竟是……肘击王曾经的得意门生', '#ff006e');
    }
    setTimeout(() => this._nextRoom(), 2500);
  }

  _nextRoom() {
    const next = this.roguelike.getNextRoom();
    if (!next) { this._win(); return; }
    this._loadRoom();
  }

  _onPlayerDeath() {
    this.gameOver = true;
    this.audio?.defeat();
    // 肘击王战失败计数（持久化到 meta，跨传承累计）
    if (this.boss instanceof BossZJW) {
      const meta = MetaManager.load();
      meta.threeDefeatCount = (meta.threeDefeatCount || 0) + 1;
      MetaManager.save(meta);
      if (meta.threeDefeatCount >= 3) {
        this._threeDefeat();
        return;
      }
    } else {
      // 非 BOSS 死亡重置肘击王连败计数
      const meta = MetaManager.load();
      if (meta.threeDefeatCount) {
        meta.threeDefeatCount = 0;
        MetaManager.save(meta);
      }
    }
    // 传承
    const snapshot = {
      items: this.itemSys.inventory.map(i => i.id),
      gold: this.goldSys.getGold(),
      skills: this.roguelike.passiveSkill,
      specialBullet: this.roguelike.specialBullet,
      specialAmmo: this.roguelike.specialAmmo,
      hasFaith: this.player.attackMultiplier >= 2,
      chapterIdx: this.roguelike.currentChapterIdx,
      roomIdx: this.roguelike.currentRoom,
    };
    this.succession.onDeath(snapshot);
    this.scene.stop('UIScene');
    this.scene.start('End', { win: false, succession: true });
  }

  _threeDefeat() {
    this.scene.stop('UIScene');
    this.scene.start('End', { win: false, threeDefeat: true });
  }

  _win() {
    this.gameOver = true;
    this.won = true;
    this.audio?.victory();
    this.scene.stop('UIScene');
    this.scene.start('End', { win: true });
  }

  _spawnParticles(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
        color, size: 2 + Math.random() * 2,
        life: 400 + Math.random() * 300, born: performance.now(),
      });
    }
  }

  _rectHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  showBanner(text, color) {
    this.bannerText = text;
    this.bannerColor = color || '#ffd43b';
    this.bannerUntil = performance.now() + 1800;
  }

  _togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.pause();
      this.scene.stop('UIScene');
      this.scene.launch('UIScene', { pause: true });
    }
  }

  // ---- 渲染 ----
  render() {} // Phaser 自动渲染，但我们用自定义 Canvas 覆盖

  // 由于 Phaser 的 Graphics 比较复杂，这里直接在 DOM canvas 上绘制
  // 实际使用 Phaser 的 renderToCanvas
}

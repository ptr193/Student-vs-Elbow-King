import Phaser from 'phaser';
import gameConfig from '../config/game_config.json';
import { Player } from '../entities/Player.js';
import { BossZJW } from '../entities/BossZJW.js';
import { MinibossReader } from '../entities/MinibossReader.js';
import { MinibossTimer } from '../entities/MinibossTimer.js';
import { MinibossChalkboard } from '../entities/MinibossChalkboard.js';
import { MinibossRanking } from '../entities/MinibossRanking.js';
import { StageBossBulletin } from '../entities/StageBossBulletin.js';
import { StageBossTribunal } from '../entities/StageBossTribunal.js';
import { BossWatershed } from '../entities/BossWatershed.js';
import { MinibossOverseer } from '../entities/MinibossOverseer.js';
import { MinibossBroadcast } from '../entities/MinibossBroadcast.js';
import { Enemy } from '../entities/Enemy.js';
import { Bullet, ZjAttack } from '../entities/Bullet.js';
import { NPC } from '../entities/NPC.js';
import { RoguelikeSystem } from '../systems/RoguelikeSystem.js';
import { ItemSystem } from '../systems/ItemSystem.js';
import { GoldSystem } from '../systems/GoldSystem.js';
import { SuccessionSystem } from '../systems/SuccessionSystem.js';
import { CodexSystem } from '../systems/CodexSystem.js';
import { NarrativeSystem } from '../systems/NarrativeSystem.js';
import { RecordManager } from '../systems/RecordManager.js';
import { MetaManager } from '../systems/SettingsManager.js';
import { NPCSystem } from '../systems/NPCSystem.js';
import { ThreeDefeatSystem } from '../systems/ThreeDefeatSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CycleSystem } from '../systems/CycleSystem.js';
import { CycleEventManager } from '../systems/CycleEventManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import departureLines from '../data/departure_lines.json';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    // 横屏游戏固定设计分辨率 1280x720（16:9）
    // Scale.FIT 保证任意屏幕上宽高比不变，不拉伸、不旋转
    this.logicW = 1280;
    this.logicH = 720;
    this.groundY = this.logicH - 100;
    // 三败结局选择"不放弃"后回到游戏，授予"信念"
    this.fromPersevere = !!data?.fromPersevere;
    this.grantFaith = !!data?.grantFaith;
  }

  create() {
    this.audio = this.game.registry.get('audio');
    this.roguelike = new RoguelikeSystem();
    this.itemSys = new ItemSystem(this);
    this.goldSys = new GoldSystem();
    this.succession = new SuccessionSystem();
    // 武器系统：加载玩家在 WeaponSelectScene 选择的武器
    this.weapon = new WeaponSystem();
    const meta = MetaManager.load();
    if (meta.selectedWeapon) this.weapon.select(meta.selectedWeapon);
    this.npcSys = new NPCSystem(this);
    this.threeDefeatSys = new ThreeDefeatSystem();
    this.collisionSys = new CollisionSystem(this);
    this.cycleSys = new CycleSystem();
    this.cycleEvent = new CycleEventManager(this);

    // 创建渲染用 Canvas 纹理（所有实体通过 draw(ctx) 绘制到此）
    // 重启场景时需移除旧纹理，避免 "key already in use" 错误
    if (this.textures.exists('worldTex')) {
      this.textures.remove('worldTex');
    }
    this.worldTex = this.textures.createCanvas('worldTex', this.logicW, this.logicH);
    this.worldCtx = this.worldTex.getContext();
    // FIT 模式下画布尺寸 == 逻辑尺寸，无需缩放
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

    // ===== 周目配置应用（规格 6.1.2 固定主角 + 血条封锁）=====
    if (this.cycleSys.isFixedProtagonist()) {
      // 2-8 周目：固定为第一任起义军（男，显示"起义军"）
      this.succession.currentName = this.cycleSys.getProtagonistName() || '起义军';
      this.succession.currentGender = this.cycleSys.getProtagonistGender() || '男';
    }
    if (this.cycleSys.isHpLocked()) {
      // 血条封锁：最大血量封锁一半
      const lockRatio = this.cycleSys.getHpLockRatio();
      this.player.maxHp = Math.max(1, Math.floor(this.player.maxHp * lockRatio));
      this.player.hp = this.player.maxHp;
    }

    // 应用随机被动技能
    this.player.applySkill(this.roguelike.passiveSkill);
    // 应用永久信念之力（复用上方声明的 meta）
    if (meta.faithPower > 0) {
      this.player.attackMultiplier *= (1 + meta.faithPower * 0.1);
    }
    // 三败结局选择"不放弃"后获得"信念"道具：攻击力翻倍（×2）
    if (this.grantFaith || this.threeDefeatSys.hasFaith()) {
      this.player.attackMultiplier = 2;
      this.showBanner('获得信念：承载所有人的希望，你不再是一个人', '#fff3bf');
    }

    // 周目色调偏移（2/4/8 周目有特殊视觉风格）
    const tint = this.cycleSys.getColorTint();
    if (tint) {
      this._cycleTint = tint;
    }

    // BOSS 文本
    this.boss = null;
    this.bannerText = '';
    this.bannerUntil = 0;
    this.bannerColor = '#ffd43b';

    // 对话系统
    this.dialogue = null; // { name, text, color }
    this.dialogueActive = false;
    this.runStartTime = performance.now();

    // 周目难度倍率应用到 RoguelikeSystem
    this.roguelike.setCycleMultipliers(
      this.cycleSys.getEnemyHpMult(),
      this.cycleSys.getEnemyAtkMult(),
      this.cycleSys.getEnemyDensity()
    );

    // 生成第一间房
    this.roguelike.generateRun();
    // 应用传承
    this._applySuccession();
    this._loadRoom();

    // 出发台词（首任才有）
    if (!this.succession.hasSuccessionPending()) {
      const line = departureLines[Math.floor(Math.random() * departureLines.length)];
      this.dialogue = { name: '出发', text: line, color: '#ffd43b' };
      this.dialogueActive = true;
    }

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

    // 对话关闭：任意键或点击
    this.input.keyboard.on('keydown', (event) => {
      if (this.dialogueActive) {
        if (this.shopActive) {
          // 商店模式
          const key = event.key;
          if (key === '1') this._buyShopItem(0);
          else if (key === '2') this._buyShopItem(1);
          else if (key === '3') this._buyShopItem(2);
          else if (key === 'Escape') this._closeShop();
        } else {
          this._closeDialogue();
        }
      }
    });
    this.input.on('pointerdown', () => {
      if (this.dialogueActive && !this.shopActive) this._closeDialogue();
    });

    // 触屏（简化版，单键射击+跳跃）
    this._setupTouchControls();
  }

  _closeDialogue() {
    this.dialogueActive = false;
    this.dialogue = null;
  }

  _openShop(npcDef) {
    // 生成随机商品
    const allItems = this.itemSys.items;
    const shopItems = [];
    const pool = allItems.filter(i => i.rarity !== 'epic');
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const item = pool[idx];
      const price = item.rarity === 'rare' ? 120 : 50 + Math.floor(Math.random() * 40);
      shopItems.push({ id: item.id, name: item.name || item.id, price, effect: item.effect });
      pool.splice(idx, 1);
    }
    this.shop = { items: shopItems, npcName: npcDef.name };
    this.shopActive = true;
    // 暂停游戏
    this.dialogueActive = true;
  }

  _buyShopItem(idx) {
    if (!this.shop || idx >= this.shop.items.length) return;
    const item = this.shop.items[idx];
    if (this.itemSys.inventory.length >= this.itemSys.maxSlots) {
      this.showBanner('道具栏已满！', '#fa5252');
      return;
    }
    if (this.goldSys.spend(item.price)) {
      this.itemSys.addItem(item.id);
      this.audio?.gold();
      this.showBanner('购得：' + item.name, '#51cf66');
      this.shop.items.splice(idx, 1);
      if (this.shop.items.length === 0) {
        this.shopActive = false;
        this.shop = null;
        this.dialogueActive = false;
      }
    } else {
      this.showBanner('金币不足！', '#fa5252');
    }
  }

  _closeShop() {
    this.shopActive = false;
    this.shop = null;
    this.dialogueActive = false;
  }

  narrativeTrigger(fragmentId) {
    NarrativeSystem.trigger(this, fragmentId);
  }

  recordPoem() {
    RecordManager.recordPoem();
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
    const rl = this.roguelike;
    if (rl.specialAmmo > 0 && rl.specialBullet !== 'normal') {
      rl.specialBullet = 'normal';
      this.showBanner('切换：普通弹', '#ffd43b');
    } else if (rl.unlockedBullets && rl.unlockedBullets.length > 0) {
      // 循环切换已解锁的特殊子弹
      const unlocked = rl.unlockedBullets;
      const idx = unlocked.indexOf(rl.specialBullet);
      const next = unlocked[(idx + 1) % unlocked.length];
      rl.specialBullet = next;
      const def = this._bulletDef(next);
      this.showBanner('切换：' + def.name, def.color || '#ffd43b');
    } else {
      this.showBanner('无特殊弹药', '#868e96');
    }
  }

  _bulletDef(id) {
    const defs = {
      normal: { name: '普通弹', color: '#ffd43b' },
      ink: { name: '墨迹弹', color: '#1a1a1a' },
      staple: { name: '钉书弹', color: '#495057' },
      red_cross: { name: '红叉弹', color: '#fa5252' },
    };
    return defs[id] || defs.normal;
  }

  _applySpecialBullet(b, target, x, y) {
    if (!b.specialKind) return;
    switch (b.specialKind) {
      case 'ink': {
        // 墨迹区域：持续伤害
        const zone = {
          x: x - 15, y: this.groundY - 8, w: 30, h: 16,
          damage: 0.5, until: performance.now() + 3000, kind: 'ink',
        };
        this.inkZones = this.inkZones || [];
        this.inkZones.push(zone);
        break;
      }
      case 'staple': {
        // 钉书弹：延迟敌人攻击
        if (target.nextAttackAt) {
          target.nextAttackAt = Math.max(target.nextAttackAt, performance.now()) + 2500;
        } else if (target.attackCd) {
          target._stunUntil = performance.now() + 1500;
        }
        break;
      }
      // red_cross 是高伤害穿透，在 _playerFire 中已处理
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
    this.inkZones = [];
    this.player.x = 60;
    this.player.y = this.groundY;
    // 房间初始无敌，避免刚出生就被秒
    this.player.invincibleUntil = performance.now() + 3000;
    this.player.flashUntil = performance.now() + 3000;
    // 房间门状态
    this.roomCleared = room.type === 'item' || room.type === 'rest' || room.type === 'special' || room.cleared;

    const ch = this.roguelike.getCurrentChapter();
    this._bgColor = ch.color;

    if (room.type === 'miniBoss') {
      const miniBossMap = {
        reader: { cls: MinibossReader, name: '读卡机', color: '#cc5de8' },
        timer: { cls: MinibossTimer, name: '计时器', color: '#aab0ff' },
        chalkboard: { cls: MinibossChalkboard, name: '抄写板', color: '#ced4da' },
        ranking: { cls: MinibossRanking, name: '排名表', color: '#ffd43b' },
        overseer: { cls: MinibossOverseer, name: '监工', color: '#ffd43b' },
        broadcast: { cls: MinibossBroadcast, name: '广播站', color: '#aab0ff' },
      };
      const mb = miniBossMap[room.miniBossType || ch.miniBoss];
      if (mb) {
        this.boss = new mb.cls(this, this.logicW * 0.7, 200);
        this.showBanner('小 BOSS：' + mb.name, mb.color);
        this.audio?.startBgm('miniboss');
      }
    } else if (room.type === 'stageBoss' && ch.stageBoss === 'bulletin') {
      this.boss = new StageBossBulletin(this, this.logicW * 0.7, 150);
      this.showBanner('关卡 BOSS：通告板', '#ffd43b');
    } else if (room.type === 'stageBoss' && ch.stageBoss === 'tribunal') {
      this.boss = new StageBossTribunal(this, this.logicW * 0.7, 150);
      this.showBanner('关卡 BOSS：审判台', '#cc5de8');
    } else if (ch.id === 'C3' && room.room === this.roguelike.roomsPerSubArea - 2 &&
               (this.cycleSys.getSpecialEvent() === 'watershed_boss' || this.cycleSys.getSpecialEvent() === 'watershed_boss_plus')) {
      // 六/七周目：C3 倒数第二间生成"一生分水岭"BOSS
      this.boss = new BossWatershed(this, this.logicW * 0.7, this.groundY - 60);
      this.showBanner('关卡 BOSS：一生分水岭', '#fa5252');
      this.audio?.startBgm('boss');
    } else if (ch.id === 'C3' && room.room === this.roguelike.roomsPerSubArea - 1) {
      // 八周目：肘击王不在，直接触发完结
      if (this.cycleSys.getCurrentCycle() >= 8) {
        this._win();
        return;
      }
      // 最终 BOSS 肘击王（C3 最后一间）
      this.boss = new BossZJW(this, this.logicW * 0.75, this.groundY + 80 - 200);
      this.boss.chargeMaxDistance = this.logicW * 0.55;
      this.boss.nextAttackAt = performance.now() + 2500; // 给玩家反应时间
      this.showBanner('最终 BOSS：肘击王', '#ff006e');
      this.audio?.startBgm('boss');
      // 三败结局对白：第二次失败时肘击王嘲讽；获得信念后肘击王动摇
      const faithLine = this.threeDefeatSys.getFaithLine();
      const mockLine = this.threeDefeatSys.getMockingLine();
      if (faithLine) {
        this.dialogue = { name: '肘击王', text: faithLine, color: '#ff006e' };
        this.dialogueActive = true;
      } else if (mockLine) {
        this.dialogue = { name: '肘击王', text: mockLine, color: '#ff006e' };
        this.dialogueActive = true;
      }
    }

    // 周目 BOSS 血量倍率应用（规格 6.1.3 难度递增）
    if (this.boss) {
      const bossHpMult = this.cycleSys.getBossHpMult();
      if (bossHpMult !== 1.0 && this.boss.maxHp !== undefined) {
        this.boss.maxHp = Math.max(1, Math.ceil(this.boss.maxHp * bossHpMult));
        this.boss.hp = this.boss.maxHp;
      }
    }

    if (!this.boss) {
      // 普通战斗房
      const enemies = this.roguelike.spawnEnemiesForRoom(room);
      enemies.forEach((e, i) => {
        this.enemies.push(new Enemy(this, e, this.logicW * 0.5 + (i % 3) * 80, 150 + Math.floor(i / 3) * 80));
        // 图鉴记录
        const enemyDesc = {
          redmarker: '红笔卫：用红笔圈出你的错误。',
          corrector: '修正者：擦掉你的答案，写上它的。',
          echo: '回声：模仿你的每一个动作。',
          stackpile: '堆卷怪：试卷堆成的怪物，沉重而缓慢。',
        };
        if (enemyDesc[e.id]) {
          CodexSystem.recordEnemy(e.id, e.id, enemyDesc[e.id]);
        }
      });
      // 道具房
      if (room.type === 'item') {
        this._spawnItemDrop(this.logicW * 0.5, this.groundY - 20);
      }
      // NPC 站点生成（每局 1–2 个站点，背刺 NPC 救出后下一站点出现）
      if (this.npcSys.shouldSpawnStation(room) && this.npcs.length === 0) {
        this.npcSys.spawnStation(this.logicW * 0.4, 300);
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

    // 对话进行中：暂停游戏
    if (this.dialogueActive) return;

    // 键盘轮询
    if (this.keys.left.isDown) this.inputState.moveX = -1;
    else if (this.keys.right.isDown) this.inputState.moveX = 1;
    else if (!this._movePointer) this.inputState.moveX = 0;

    // 玩家（减速带判定）
    if (this.slowZones) {
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y + this.player.h / 2;
      for (const z of this.slowZones) {
        if (Math.hypot(px - z.x, py - z.y) < z.r) {
          this.player.slowUntil = now + 200;
          break;
        }
      }
    }
    this.player.update(this.inputState, delta, this.groundY);
    // 门锁限制
    if (!this.roomCleared && this.player.x > this.logicW - 60) {
      this.player.x = this.logicW - 60;
    }

    // 射击
    if (this.inputState.fire) this._playerFire(now);

    // BOSS
    if (this.boss) this.boss.update(this.player, now);

    // 敌人
    this.enemies.forEach(e => e.update(this.player, now));

    // 墨迹区域
    if (this.inkZones) {
      this.inkZones = this.inkZones.filter(z => now < z.until);
      for (const z of this.inkZones) {
        // 伤害 BOSS
        if (this.boss && !this.boss.defeated) {
          const bb = this.boss.getHitBox();
          if (this._rectHit(z, bb)) this.boss.takeHit(now);
        }
        // 伤害敌人
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (this._rectHit(z, e.getHitBox())) e.takeHit(now, z.damage);
        }
      }
    }
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

    // 碰撞（委托给 CollisionSystem 集中管理）
    this.collisionSys.update(now);
    this.cycleEvent?.update(now, delta);

    // 粒子
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.05;
    });
    this.particles = this.particles.filter(p => now - p.born < p.life);
    // 清理过期减速带与光束
    if (this.slowZones) this.slowZones = this.slowZones.filter(z => now - z.born < z.life);
    if (this.beams) this.beams = this.beams.filter(b => now - b.born < b.life);

    // 道具掉落拾取
    if (this.itemDrops) {
      this.itemDrops.forEach((d, i) => {
        d.bob += 0.05;
        if (Math.abs(this.player.x + this.player.w / 2 - d.x) < 40 && Math.abs(this.player.y - d.y) < 60) {
          if (this.itemSys.addItem(d.id)) {
            this.audio?.pickup();
            this.showBanner('获得道具：' + d.id, '#51cf66');
            // 图鉴记录
            const def = this.itemSys.items.find(it => it.id === d.id);
            if (def) {
              CodexSystem.recordItem(d.id, def.name || d.id, def.desc || def.effect || '');
            }
          }
          this.itemDrops.splice(i, 1);
        }
      });
    }

    // NPC 交互（含背刺对话与交易）
    this.npcs.forEach(n => {
      if (!n.interacted && this._rectHit(this.player, n.getHitBox())) {
        const result = this.npcSys.onInteract(n);
        if (result?.shop) {
          this._openShop(result.shop);
        } else if (result?.dialogue) {
          this.dialogue = result.dialogue;
          this.dialogueActive = true;
        }
      }
    });

    // 检查房间是否清空
    const room = this.roguelike.getCurrentRoom();
    if (room && (room.type === 'battle' || room.type === 'trap')) {
      if (this.enemies.length === 0) {
        this.roomCleared = true;
        room.cleared = true;
        this.showBanner('房间清空！→ 继续', '#51cf66');
      }
    } else if (room && room.type === 'stageBoss') {
      if ((!this.boss || this.boss.defeated) && !this.bossDefeated.has(room.type + room.chapter)) {
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

    // 玩家走到门口进入下一间
    if (this.roomCleared && this.player.x > this.logicW - 50) {
      this._nextRoom();
      return;
    }

    this._renderWorld();
  }

  _renderWorld() {
    const ctx = this.worldCtx;
    const W = this.logicW, H = this.logicH;
    // 背景（多层渐变：天空→远景→近景，营造纵深感）
    const bgColor = this._bgColor || '#2a1a3a';
    // 天空渐变
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, this._lightenColor(bgColor, 45));
    skyGrad.addColorStop(0.4, this._lightenColor(bgColor, 15));
    skyGrad.addColorStop(1, bgColor);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, this.groundY + 48);
    // 中央光晕（月光/灯光感）
    const haloGrad = ctx.createRadialGradient(W * 0.35, H * 0.25, 20, W * 0.35, H * 0.25, W * 0.5);
    haloGrad.addColorStop(0, this._lightenColor(bgColor, 70) + '');
    haloGrad.addColorStop(0.3, this._lightenColor(bgColor, 30) + '');
    haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, W, this.groundY + 48);
    ctx.globalAlpha = 1;
    // 远景建筑剪影（教学楼轮廓，营造场景感）
    ctx.fillStyle = this._darkenColor(bgColor, 35);
    const buildSeed = (this.roguelike?.currentChapter || 0) * 7 + (this.roguelike?.currentRoom || 0);
    for (let i = 0; i < 8; i++) {
      const bx = (i * 170 + (buildSeed * 23) % 60) % W;
      const bh = 80 + ((buildSeed + i * 13) % 120);
      const bw = 90 + ((buildSeed + i * 7) % 50);
      ctx.fillRect(bx, this.groundY + 48 - bh, bw, bh);
      // 窗户光点
      ctx.fillStyle = 'rgba(255,212,59,0.12)';
      for (let wy = this.groundY + 48 - bh + 10; wy < this.groundY + 38; wy += 16) {
        for (let wx = bx + 8; wx < bx + bw - 8; wx += 14) {
          if ((wx + wy + i) % 3 === 0) ctx.fillRect(wx, wy, 6, 8);
        }
      }
      ctx.fillStyle = this._darkenColor(bgColor, 35);
    }
    // 网格（淡淡的透视感）
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 地面（渐变 + 纹理线）
    const groundGrad = ctx.createLinearGradient(0, this.groundY + 48, 0, H);
    groundGrad.addColorStop(0, this._darkenColor(bgColor, 10));
    groundGrad.addColorStop(0.3, this._darkenColor(bgColor, 30));
    groundGrad.addColorStop(1, this._darkenColor(bgColor, 55));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY + 48, W, H - this.groundY - 48);
    // 地面纹理线（地砖缝）
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, this.groundY + 48); ctx.lineTo(x, H); ctx.stroke();
    }
    // 地面边缘发光线（地平线）
    const lineGrad = ctx.createLinearGradient(0, this.groundY + 48, W, this.groundY + 48);
    lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
    lineGrad.addColorStop(0.3, 'rgba(255,212,59,0.25)');
    lineGrad.addColorStop(0.7, 'rgba(255,212,59,0.25)');
    lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, this.groundY + 48, W, 2);

    // 门（右侧出口）- 带光晕
    const doorX = W - 30;
    if (this.roomCleared) {
      // 门打开 - 绿色光门（径向渐变光晕）
      const doorGrad = ctx.createRadialGradient(doorX, this.groundY * 0.5, 10, doorX, this.groundY * 0.5, 80);
      doorGrad.addColorStop(0, 'rgba(81,207,102,0.5)');
      doorGrad.addColorStop(1, 'rgba(81,207,102,0)');
      ctx.fillStyle = doorGrad;
      ctx.fillRect(doorX - 60, 0, 120, this.groundY + 48);
      ctx.fillStyle = 'rgba(81,207,102,0.3)';
      ctx.fillRect(doorX - 20, 0, 50, this.groundY + 48);
      ctx.fillStyle = '#51cf66';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', doorX, this.groundY * 0.5);
      ctx.textAlign = 'left';
    } else {
      // 门关闭 - 红色锁门
      ctx.fillStyle = 'rgba(250,82,82,0.2)';
      ctx.fillRect(doorX - 20, 0, 40, this.groundY + 48);
      ctx.strokeStyle = 'rgba(250,82,82,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(doorX - 20, 0, 40, this.groundY + 48);
    }

    // 墨迹区域
    if (this.inkZones) {
      for (const z of this.inkZones) {
        ctx.fillStyle = 'rgba(26,26,26,0.7)';
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeRect(z.x, z.y, z.w, z.h);
      }
    }

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

    // 减速带（碎纸机）
    if (this.slowZones) {
      this.slowZones.forEach(z => {
        const a = 1 - (now - z.born) / z.life;
        ctx.fillStyle = `rgba(134, 142, 150, ${0.3 * a})`;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(134, 142, 150, ${0.6 * a})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
    // 全屏光束（满分者）
    if (this.beams) {
      this.beams.forEach(b => {
        const a = 1 - (now - b.born) / b.life;
        ctx.strokeStyle = `rgba(255, 212, 59, ${a})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    }

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
      const name = this.boss instanceof BossZJW ? '肘击王'
        : this.boss instanceof MinibossReader ? '读卡机'
        : this.boss instanceof MinibossTimer ? '计时器'
        : this.boss instanceof MinibossChalkboard ? '抄写板'
        : this.boss instanceof MinibossRanking ? '排名表'
        : this.boss instanceof StageBossBulletin ? '通告板'
        : this.boss instanceof StageBossTribunal ? '审判台'
        : 'BOSS';
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

    // 对话框
    if (this.dialogueActive && this.dialogue) {
      const d = this.dialogue;
      const boxX = W * 0.1, boxY = H * 0.62, boxW = W * 0.8, boxH = H * 0.3;
      // 半透明遮罩
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      // 对话框背景
      ctx.fillStyle = 'rgba(20,22,40,0.95)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = d.color || '#ffd43b';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      // 名字
      ctx.fillStyle = d.color || '#ffd43b';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(d.name, boxX + 16, boxY + 32);
      // 分割线
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boxX + 16, boxY + 42);
      ctx.lineTo(boxX + boxW - 16, boxY + 42);
      ctx.stroke();
      // 对话文本（自动换行）
      ctx.fillStyle = '#dee2e6';
      ctx.font = '16px sans-serif';
      const textX = boxX + 16, textY = boxY + 60, maxW = boxW - 32;
      const lines = this._wrapText(ctx, d.text, maxW);
      lines.forEach((line, i) => {
        ctx.fillText(line, textX, textY + i * 22);
      });
      // 提示
      ctx.fillStyle = '#868e96';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('点击或按键继续', boxX + boxW - 16, boxY + boxH - 12);
      ctx.textAlign = 'left';
    }

    // 交易界面
    if (this.shopActive && this.shop) {
      const s = this.shop;
      const boxX = W * 0.15, boxY = H * 0.15, boxW = W * 0.7, boxH = H * 0.7;
      // 遮罩
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      // 面板
      ctx.fillStyle = 'rgba(30,28,50,0.97)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      // 标题
      ctx.fillStyle = '#ffd43b';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.npcName + ' 的商店', W / 2, boxY + 32);
      // 金币
      ctx.fillStyle = '#fcc419';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('持有金币：' + this.goldSys.getGold(), boxX + boxW - 16, boxY + 32);
      ctx.textAlign = 'left';

      // 商品列表
      if (s.items.length === 0) {
        ctx.fillStyle = '#868e96';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('商品已售罄', W / 2, boxY + boxH / 2);
      } else {
        s.items.forEach((item, i) => {
          const iy = boxY + 60 + i * 70;
          // 商品背景
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(boxX + 16, iy, boxW - 32, 56);
          ctx.strokeStyle = 'rgba(255,212,59,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(boxX + 16, iy, boxW - 32, 56);
          // 名称
          ctx.fillStyle = '#f8f9fa';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(item.name, boxX + 32, iy + 24);
          // 效果
          ctx.fillStyle = '#adb5bd';
          ctx.font = '13px sans-serif';
          ctx.fillText('效果：' + (item.effect || '—'), boxX + 32, iy + 44);
          // 价格
          ctx.fillStyle = '#fcc419';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(item.price + ' 金币', boxX + boxW - 32, iy + 24);
          ctx.textAlign = 'left';
        });
      }

      // 操作提示
      ctx.fillStyle = '#868e96';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('按 1/2/3 购买商品，ESC 离开', W / 2, boxY + boxH - 16);
      ctx.textAlign = 'left';
    }

    // 周目色调覆盖层
    this.cycleEvent?.drawOverlay(ctx, this.logicW, this.logicH);

    this.worldTex.refresh();
  }

  _wrapText(ctx, text, maxWidth) {
    const chars = text.split('');
    const lines = [];
    let line = '';
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // 颜色辅助：变亮/变暗
  _lightenColor(hex, amount) {
    const c = this._parseColor(hex);
    if (!c) return hex;
    const r = Math.min(255, c.r + amount);
    const g = Math.min(255, c.g + amount);
    const b = Math.min(255, c.b + amount);
    return `rgb(${r},${g},${b})`;
  }
  _darkenColor(hex, amount) {
    const c = this._parseColor(hex);
    if (!c) return hex;
    const r = Math.max(0, c.r - amount);
    const g = Math.max(0, c.g - amount);
    const b = Math.max(0, c.b - amount);
    return `rgb(${r},${g},${b})`;
  }
  _parseColor(hex) {
    if (!hex) return null;
    const m = hex.replace('#', '');
    if (m.length === 6) {
      return {
        r: parseInt(m.slice(0, 2), 16),
        g: parseInt(m.slice(2, 4), 16),
        b: parseInt(m.slice(4, 6), 16),
      };
    }
    return null;
  }

  _playerFire(now) {
    // 武器系统：应用选中的基础武器射速倍率
    const weapon = this.weapon?.getBulletParams() || { fireRateMult: 1, damage: 1, count: 1, spread: 0, pierce: false, explosive: false };
    if (now - this.player.lastFireAt < gameConfig.fireCooldownMs * this.player.fireRateMult * weapon.fireRateMult) return;
    const rl = this.roguelike;
    const isSpecial = rl.specialBullet !== 'normal' && rl.specialAmmo > 0;
    this.player.lastFireAt = now;
    const bx = this.player.x + this.player.w - 4;
    const by = this.player.y + 18;
    const targetX = this.boss ? this.boss.x + this.boss.w / 2 : (this.enemies[0]?.x || this.logicW);
    const targetY = this.boss ? this.boss.y + this.boss.h / 2 : (this.enemies[0]?.y || this.groundY);
    const dx = targetX - bx, dy = targetY - by;
    const L = Math.hypot(dx, dy) || 1;
    let damage = weapon.damage * this.player.attackMultiplier;
    let bulletColor = '#ffd43b';
    let pierce = weapon.pierce;
    let specialKind = weapon.explosive ? 'explosive' : null;

    if (isSpecial) {
      rl.specialAmmo--;
      switch (rl.specialBullet) {
        case 'ink':
          specialKind = 'ink';
          bulletColor = '#1a1a1a';
          break;
        case 'staple':
          specialKind = 'staple';
          bulletColor = '#495057';
          break;
        case 'red_cross':
          damage = 4 * this.player.attackMultiplier;
          pierce = true;
          bulletColor = '#fa5252';
          break;
        case 'spread':
          specialKind = 'spread';
          break;
        case 'pierce':
          pierce = true;
          bulletColor = '#74c0fc';
          break;
        case 'circle':
          specialKind = 'circle';
          break;
        case 'bounce':
          specialKind = 'bounce';
          bulletColor = '#aab0ff';
          break;
        case 'explosive':
          specialKind = 'explosive';
          bulletColor = '#ff922b';
          break;
      }
      if (rl.specialAmmo <= 0) {
        rl.specialBullet = 'normal';
        this.showBanner('特殊弹药用尽，恢复普通弹', '#868e96');
      }
    }

    if (this.player.bonusShots > 0) {
      damage *= (1 + this.player.bonusDamage);
      this.player.bonusShots--;
    }
    if (this.player.critShots > 0) {
      damage *= 2;
      this.player.critShots--;
    }
    // 幸运暴击
    const passiveId = this.roguelike.passiveSkill?.id;
    if (passiveId === 'lucky' && Math.random() < 0.2) damage *= 2;
    // 狂战士
    if (passiveId === 'berserker' && this.player.hp / this.player.maxHp < 0.3) damage *= 1.5;

    const speed = gameConfig.bulletSpeed * this.player.bulletSpeedMult;
    const baseAngle = Math.atan2(dy, dx);
    // 武器系统：多弹散射（覆盖武器 count/spread 与特殊散弹）
    const count = specialKind === 'spread' ? 3 : (specialKind === 'circle' ? 8 : weapon.count);
    for (let i = 0; i < count; i++) {
      let angle;
      if (specialKind === 'circle') {
        angle = baseAngle + (i - (count - 1) / 2) * (Math.PI * 2 / count);
      } else if (count > 1) {
        const spread = weapon.spread || 0.4;
        angle = baseAngle + (i - (count - 1) / 2) * spread;
      } else {
        angle = baseAngle;
      }
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.playerBullets.push(new Bullet(this, bx, by, vx, vy, {
        damage, color: bulletColor, pierce, specialKind,
      }));
    }
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
          if (!b.pierce) this.playerBullets.splice(i, 1);
          this.boss.takeHit(now);
          this._applySpecialBullet(b, this.boss, b.x, b.y);
          this._spawnParticles(b.x, b.y, b.color, 4);
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
          if (!b.pierce) this.playerBullets.splice(i, 1);
          e.takeHit(now, b.damage);
          this._applySpecialBullet(b, e, b.x, b.y);
          this._spawnParticles(b.x, b.y, e.color, 3);
          this.audio?.hit();
          if (!b.pierce) break;
        }
      }
    }
    // 敌人子弹 vs 玩家
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      if (this._rectHit(b, pBox)) {
        // 地面区域不消失，持续伤害
        if (!b.groundZone) {
          this.enemyBullets.splice(i, 1);
        }
        const died = this.player.takeDamage(now, b.damage);
        // 定身效果
        if (b.pinPlayer || b.special === 'stun') {
          this.player.stunUntil = now + 2000;
          this.showBanner('被定身！', '#fa5252');
        }
        // 减速效果（逗号弹）
        if (b.special === 'slow') {
          this.player.slowUntil = now + 2000;
        }
        this._spawnParticles(this.player.x, this.player.y, '#fa5252', 6);
        this.audio?.hurt();
        if (died) this._onPlayerDeath();
      }
    }
    // 玩家子弹 vs 计时器炸弹
    if (this.boss instanceof MinibossTimer) {
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        for (let j = this.boss.bombs.length - 1; j >= 0; j--) {
          const bomb = this.boss.bombs[j];
          if (bomb.exploded) continue;
          if (Math.hypot(b.x - bomb.x, b.y - bomb.y) < 20) {
            this.boss.bombs.splice(j, 1);
            this.playerBullets.splice(i, 1);
            this._spawnParticles(bomb.x, bomb.y, '#ffd43b', 6);
            break;
          }
        }
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
    // 同时标记房间 BOSS 已击败，避免 update 循环重复触发
    const room = this.roguelike.getCurrentRoom();
    if (room && room.type === 'stageBoss') {
      this.bossDefeated.add(room.type + room.chapter);
    }
    this.audio?.bossDie();
    // 图鉴记录
    const bossLore = {
      reader: '读卡机：吞掉试卷的铁兽，只认标准答案。',
      timer: '计时器：滴答声中，时间被榨干。',
      chalkboard: '抄写板：罚抄百遍，直到手指麻木。',
      ranking: '排名表：数字的暴政，名次即命运。',
      bulletin: '通告板：张贴的不是通知，是判决。',
      tribunal: '审判台：你是否有罪，由它说了算。',
      zjw: '肘击王：教学楼的绝对统治者，曾是你最敬仰的恩师。',
    };
    const names = {
      reader: '读卡机', timer: '计时器', chalkboard: '抄写板',
      ranking: '排名表', bulletin: '通告板', tribunal: '审判台', zjw: '肘击王',
    };
    if (bossLore[bossId]) {
      CodexSystem.recordBoss(bossId, names[bossId] || bossId, bossLore[bossId]);
    }
    // 小 BOSS 击败奖励特殊子弹
    const bulletRewards = {
      reader: { bullet: 'ink', name: '墨迹弹', ammo: 10 },
      timer: { bullet: 'staple', name: '钉书弹', ammo: 12 },
      chalkboard: { bullet: 'staple', name: '钉书弹', ammo: 12 },
      ranking: { bullet: 'red_cross', name: '红叉弹', ammo: 5 },
    };
    const reward = bulletRewards[bossId];
    if (reward) {
      const rl = this.roguelike;
      if (!rl.unlockedBullets.includes(reward.bullet)) {
        rl.unlockedBullets.push(reward.bullet);
      }
      rl.specialBullet = reward.bullet;
      rl.specialAmmo = reward.ammo;
      this.showBanner('获得特殊子弹：' + reward.name + ' × ' + reward.ammo, '#ffd43b');
    }
    this.showBanner('击败 ' + (bossId === 'zjw' ? '肘击王' : bossId), '#51cf66');
    // 成就检查
    const newAch = AchievementSystem.checkAndUnlock();
    newAch.forEach(a => AchievementSystem.showToast(this, a));
    // 触发剧情碎片
    const fragmentMap = {
      reader: 'reader_defeated',
      timer: 'timer_defeated',
      chalkboard: 'chalkboard_defeated',
      ranking: 'ranking_defeated',
      bulletin: 'bulletin_defeated',
      tribunal: 'tribunal_defeated',
    };
    if (fragmentMap[bossId]) {
      setTimeout(() => NarrativeSystem.trigger(this, fragmentMap[bossId]), 600);
    }
    if (bossId === 'zjw') {
      // 击败肘击王，重置三败计数
      const meta = MetaManager.load();
      meta.threeDefeatCount = 0;
      MetaManager.save(meta);
      this._win();
    } else if (bossId === 'bulletin' || bossId === 'tribunal') {
      // 关卡 BOSS：由 _onStageBossDefeated 处理（含身份揭示）
      this._onStageBossDefeated();
    } else {
      setTimeout(() => this._nextRoom(), 1800);
    }
  }

  _onStageBossDefeated() {
    const ch = this.roguelike.getCurrentChapter();
    if (ch.id === 'C2') {
      this.showBanner('身份揭示：你竟是……肘击王曾经的得意门生', '#ff006e');
    }
    setTimeout(() => this._nextRoom(), 2500);
  }

  _applySuccession() {
    if (!this.succession.hasSuccessionPending()) return;
    const data = this.succession.inherit();
    if (!data) return;
    // 继承道具
    if (data.items && data.items.length) {
      data.items.forEach(id => {
        if (this.itemSys.inventory.length < 6) {
          this.itemSys.addItem(id);
        }
      });
    }
    // 继承金币
    if (data.gold) this.goldSys.setGold(data.gold);
    // 继承被动技能
    if (data.skills) {
      this.roguelike.passiveSkill = data.skills;
      this.player.applySkill(data.skills);
    }
    // 继承特殊子弹
    if (data.specialBullet && data.specialBullet !== 'normal' && data.specialAmmo > 0) {
      this.roguelike.specialBullet = data.specialBullet;
      this.roguelike.specialAmmo = data.specialAmmo;
      if (!this.roguelike.unlockedBullets.includes(data.specialBullet)) {
        this.roguelike.unlockedBullets.push(data.specialBullet);
      }
    }
    // 继承信念（攻击加成）
    if (data.hasFaith) {
      this.player.attackMultiplier *= 1.5;
    }
    this.showBanner('传承已激活', '#cc5de8');
  }

  _nextRoom() {
    const next = this.roguelike.getNextRoom();
    if (!next) { this._win(); return; }
    this._loadRoom();
  }

  _onPlayerDeath() {
    this.gameOver = true;
    this.audio?.defeat();
    // 记录死亡
    RecordManager.recordDeath();
    RecordManager.addPlayTime(performance.now() - this.runStartTime);
    // 成就检查（死亡次数里程碑）
    const newAchDeath = AchievementSystem.checkAndUnlock();
    newAchDeath.forEach(a => AchievementSystem.showToast(this, a));
    // 肘击王战失败计数（持久化到 meta，跨传承累计，每任起义军只触发一次三败结局）
    if (this.boss instanceof BossZJW) {
      this.threeDefeatTriggeredThisRun = this.threeDefeatTriggeredThisRun || false;
      const trigger = this.threeDefeatSys.registerDefeat(this.threeDefeatTriggeredThisRun);
      if (trigger) {
        this.threeDefeatTriggeredThisRun = true;
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
    // 2-8 周目：主角不变，损失一半金币，在当前章节起点复活（规格 6.1.2）
    if (this.cycleSys.isFixedProtagonist()) {
      this.goldSys.setGold(Math.floor(this.goldSys.getGold() / 2));
      // 回到当前章节第一间
      this.roguelike.currentChapterIdx = Math.max(0, this.roguelike.currentChapterIdx);
      this.roguelike._generateChapterRooms();
      this.roguelike.currentRoom = 0;
      this.scene.stop('UIScene');
      this.showBanner('你倒下了……损失一半金币，从章节起点重新出发', '#fa5252');
      // 短暂延迟后重载房间（保持当前场景，不换人）
      this.time.delayedCall(1500, () => {
        this.gameOver = false;
        this.player.hp = this.player.maxHp;
        this.player.invincibleUntil = performance.now() + 3000;
        this.player.flashUntil = performance.now() + 3000;
        this.enemies = [];
        this.enemyBullets = [];
        this.playerBullets = [];
        this.boss = null;
        this._loadRoom();
        this.scene.launch('UIScene');
      });
      return;
    }

    // 1 周目：传承机制（换人继续）
    const snapshot = {
      items: this.itemSys.inventory.map(i => i.id),
      gold: this.goldSys.getGold(),
      skills: this.roguelike.passiveSkill,
      specialBullet: this.roguelike.specialBullet,
      specialAmmo: this.roguelike.specialAmmo,
      hasFaith: this.player.attackMultiplier >= 2,
      chapterIdx: this.roguelike.currentChapterIdx,
      roomIdx: this.roguelike.currentRoom,
      rebelName: this.succession.currentName,
      rebelGender: this.succession.currentGender,
    };
    this.succession.onDeath(snapshot);
    this.scene.stop('UIScene');
    this.scene.start('Succession');
  }

  _threeDefeat() {
    this.scene.stop('UIScene');
    // 携带起义军信息供结局统计
    this.scene.start('End', {
      win: false, threeDefeat: true,
      succession: {
        rebelName: this.succession.currentName,
        rebelGender: this.succession.currentGender,
        items: this.itemSys.inventory.map(i => i.id),
      },
    });
  }

  _win() {
    this.gameOver = true;
    this.won = true;
    this.audio?.victory();
    const elapsed = performance.now() - this.runStartTime;
    RecordManager.recordVictory(elapsed, this.cycleSys.getCurrentCycle());
    // 速通/无伤成就
    const meta = MetaManager.load();
    if (elapsed <= 5 * 60 * 1000) {
      meta.achievements = meta.achievements || [];
      if (!meta.achievements.includes('speedrun_5min')) meta.achievements.push('speedrun_5min');
    }
    if ((meta.totalDeaths || 0) === 0) {
      meta.achievements = meta.achievements || [];
      if (!meta.achievements.includes('no_death_run')) meta.achievements.push('no_death_run');
    }
    MetaManager.save(meta);
    const newAchWin = AchievementSystem.checkAndUnlock();
    newAchWin.forEach(a => AchievementSystem.showToast(this, a));
    this.scene.stop('UIScene');
    this.scene.start('End', {
      win: true,
      succession: {
        rebelName: this.succession.currentName,
        rebelGender: this.succession.currentGender,
        generation: (MetaManager.load().totalDeaths || 0) + 1,
        items: this.itemSys.inventory.map(i => i.id),
      },
    });
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

  // 碎纸机减速带（v1.5 杂兵）
  _spawnSlowZone(x, y) {
    this.slowZones = this.slowZones || [];
    this.slowZones.push({ x, y, r: 50, born: performance.now(), life: 4000 });
  }

  // 满分者全屏光束（v1.5 精英）
  _spawnBeam(x, y, dx, dy) {
    const now = performance.now();
    this.beams = this.beams || [];
    // 沿 (dx,dy) 方向的全屏线段
    const L = Math.hypot(dx, dy) || 1;
    this.beams.push({
      x1: x, y1: y,
      x2: x + (dx / L) * 2000, y2: y + (dy / L) * 2000,
      born: now, life: 600,
    });
    // 立即判定玩家是否在光束上（简化：距离线段 < 14）
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    const dist = this._pointToSegmentDist(px, py, x, y, x + (dx / L) * 2000, y + (dy / L) * 2000);
    if (dist < 14 && now > (this.player.beamHitAt || 0) + 800) {
      this.player.hp -= 1;
      this.player.beamHitAt = now;
      this.audio?.hurt();
      if (this.player.hp <= 0) this._onPlayerDeath();
    }
  }

  _pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const L2 = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / L2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx, cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
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
    if (this.gameOver) return;
    if (this.paused) {
      // 恢复
      this.paused = false;
      this.scene.resume();
      this.scene.stop('UIScene');
      this.scene.launch('UIScene');
      this.audio?.unduckBgm();
    } else {
      // 暂停
      this.paused = true;
      this.scene.pause();
      this.scene.stop('UIScene');
      this.scene.launch('UIScene', { pause: true });
      this.audio?.duckBgm();
    }
  }

  // ---- 渲染 ----
  render() {} // Phaser 自动渲染，但我们用自定义 Canvas 覆盖

  // 由于 Phaser 的 Graphics 比较复杂，这里直接在 DOM canvas 上绘制
  // 实际使用 Phaser 的 renderToCanvas
}

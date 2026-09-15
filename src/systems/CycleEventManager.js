// 周目特殊事件管理器（规格 6.2 各周目详细设计）
// 处理 2 周目虚影引路、3 周目同学追击、4 周目妻子带路、6/7 周目分水岭、8 周目回忆
import { CycleSystem } from './CycleSystem.js';

export class CycleEventManager {
  constructor(scene) {
    this.scene = scene;
    this.cycleSys = scene.cycleSys;
    this.event = this.cycleSys.getSpecialEvent();
    this.active = false;
    this.init();
  }

  init() {
    if (!this.event) return;
    this.active = true;
    switch (this.event) {
      case 'phantom_guide': this._initPhantomGuide(); break;
      case 'classmate_chase': this._initClassmateChase(); break;
      case 'future_wife': this._initFutureWife(); break;
      case 'watershed_boss':
      case 'watershed_boss_plus': this._initWatershed(); break;
      case 'memory_replay': this._initMemoryReplay(); break;
    }
  }

  update(now, delta) {
    if (!this.active) return;
    switch (this.event) {
      case 'phantom_guide': this._updatePhantomGuide(now, delta); break;
      case 'classmate_chase': this._updateClassmateChase(now, delta); break;
      case 'future_wife': this._updateFutureWife(now, delta); break;
      case 'watershed_boss':
      case 'watershed_boss_plus': this._updateWatershed(now, delta); break;
      case 'memory_replay': this._updateMemoryReplay(now, delta); break;
    }
  }

  // ===== 二周目：虚影引路 =====
  _initPhantomGuide() {
    this.phantom = null;
    this.phantomMonologueIdx = 0;
    this.monologues = [
      '还记得吗？那天我第一次站在走廊里……',
      '他们说我是废物，说我永远考不好。',
      '肘击王的目光像针一样扎在我背上。',
      '但我还是站了起来。一次，又一次。',
      '现在，轮到你了。',
    ];
    this._spawnPhantom();
  }

  _spawnPhantom() {
    const s = this.scene;
    // 虚影：半透明蓝色人影
    this.phantom = s.add.rectangle(0, 0, 24, 48, 0x74c0fc, 0.35).setOrigin(0.5);
    this.phantomHead = s.add.circle(0, -30, 10, 0x74c0fc, 0.35);
    this.phantomContainer = s.add.container(200, s.groundY - 24, [this.phantom, this.phantomHead]);
    this.nextMonologueAt = performance.now() + 4000;
  }

  _updatePhantomGuide(now, delta) {
    const s = this.scene;
    if (!this.phantomContainer) return;
    // 虚影缓慢向前移动
    this.phantomContainer.x += 0.4;
    if (this.phantomContainer.x > s.logicW - 100) this.phantomContainer.x = 100;
    // 定期触发回忆独白
    if (now > this.nextMonologueAt && this.phantomMonologueIdx < this.monologues.length) {
      const text = this.monologues[this.phantomMonologueIdx];
      s.dialogue = { name: '虚影', text, color: '#74c0fc' };
      s.dialogueActive = true;
      this.phantomMonologueIdx++;
      this.nextMonologueAt = now + 8000;
    }
  }

  // ===== 三周目：同学追击 =====
  _initClassmateChase() {
    this.chasers = [];
    this.chaseTriggeredChapters = new Set();
    this.chaseActive = false;
    this.chaseEndAt = 0;
    this.classmateNames = ['阿强', '小红', '大壮'];
  }

  _updateClassmateChase(now, delta) {
    const s = this.scene;
    const chIdx = s.roguelike.currentChapterIdx;
    // 每个大区域（章节）触发一次追击
    if (!this.chaseTriggeredChapters.has(chIdx) && !s.dialogueActive) {
      this.chaseTriggeredChapters.add(chIdx);
      this._spawnChaser(chIdx);
    }
    // 追击者逻辑
    for (let i = this.chasers.length - 1; i >= 0; i--) {
      const c = this.chasers[i];
      if (c.caught) continue;
      const dx = s.player.x - c.sprite.x;
      const dist = Math.abs(dx);
      if (dist < 30 && !c.caught) {
        c.caught = true;
        this._triggerWhyAnimation(c);
      } else {
        c.sprite.x += Math.sign(dx) * 1.2;
      }
    }
  }

  _spawnChaser(chIdx) {
    const s = this.scene;
    const name = this.classmateNames[chIdx % this.classmateNames.length];
    const sprite = s.add.rectangle(s.logicW * 0.8, s.groundY - 24, 22, 44, 0x868e96, 0.9).setOrigin(0.5);
    const head = s.add.circle(0, -26, 9, 0xadb5bd, 0.9);
    const container = s.add.container(sprite.x, sprite.y, [sprite, head]);
    container.name = name;
    this.chasers.push({ sprite: container, caught: false, name });
    s.showBanner(name + ' 追了上来……', '#868e96');
  }

  _triggerWhyAnimation(chaser) {
    const s = this.scene;
    s.dialogueActive = true;
    s.dialogue = { name: chaser.name, text: '为什么？为什么？为什么？……', color: '#fa5252' };
    // 3 秒动画期间玩家无法移动，其他怪物可攻击
    s.player.controlLocked = true;
    s.time.delayedCall(3000, () => {
      s.player.controlLocked = false;
      s.dialogueActive = false;
      s.dialogue = null;
      chaser.sprite.destroy();
      const idx = this.chasers.indexOf(chaser);
      if (idx >= 0) this.chasers.splice(idx, 1);
    });
  }

  // ===== 四周目：未来妻子带路 =====
  _initFutureWife() {
    this.wife = null;
    this.wifeWaitUntil = 0;
    this.wifeWaiting = false;
    this.wifeDialogues = [
      '跟紧我，未来的路还很长。',
      '在未来，你会成为一个有抱负的人。',
      '无论遇到什么，都不要放弃。',
      '我会一直在未来等你。',
    ];
    this.wifeDialogueIdx = 0;
    this._spawnWife();
  }

  _spawnWife() {
    const s = this.scene;
    const body = s.add.rectangle(0, 0, 20, 44, 0xf06595, 0.9).setOrigin(0.5);
    const head = s.add.circle(0, -26, 10, 0xfcc2d3, 0.95);
    this.wife = s.add.container(150, s.groundY - 22, [body, head]);
    this.wifeSpeed = 0.8;
  }

  _updateFutureWife(now, delta) {
    const s = this.scene;
    if (!this.wife) return;
    const dist = s.player.x - this.wife.x;
    // 妻子不受怪物伤害（在绘制时不与敌人碰撞）
    if (dist > 200) {
      // 玩家落后太远，妻子停下等待（限时）
      if (!this.wifeWaiting) {
        this.wifeWaiting = true;
        this.wifeWaitUntil = now + 5000;
      }
      if (now > this.wifeWaitUntil) {
        // 超时继续走
        this.wifeWaiting = false;
        this.wife.x += this.wifeSpeed;
      }
    } else {
      this.wifeWaiting = false;
      this.wife.x += this.wifeSpeed;
    }
    if (this.wife.x > s.logicW - 60) this.wife.x = 60;
    // 定期对话
    if (!s.dialogueActive && Math.random() < 0.002 && this.wifeDialogueIdx < this.wifeDialogues.length) {
      s.dialogue = { name: '妻子', text: this.wifeDialogues[this.wifeDialogueIdx], color: '#f06595' };
      s.dialogueActive = true;
      this.wifeDialogueIdx++;
    }
  }

  // ===== 六/七周目：一生分水岭 BOSS 标记 =====
  _initWatershed() {
    // 分水岭 BOSS 在 C3 倒数第二间生成，由 GameScene 的房间生成逻辑处理
    // 这里标记已启用
    this.watershedEnabled = true;
    this.maxShadows = this.event === 'watershed_boss_plus' ? 4 : 3;
  }

  _updateWatershed(now, delta) {
    // 分水岭 BOSS 逻辑在 BossWatershed 实体类中处理
  }

  // ===== 八周目：回忆重放 =====
  _initMemoryReplay() {
    this.memoryScenes = [
      '1 周目的出发……',
      '2 周目的虚影引路……',
      '3 周目的同学追击……',
      '4 周目的妻子带路……',
      '5 周目的艰难战斗……',
      '6 周目的一生分水岭……',
      '7 周目的极限挑战……',
    ];
    this.memoryIdx = 0;
    this.nextMemoryAt = performance.now() + 5000;
  }

  _updateMemoryReplay(now, delta) {
    const s = this.scene;
    if (now > this.nextMemoryAt && this.memoryIdx < this.memoryScenes.length) {
      s.dialogue = { name: '回忆', text: this.memoryScenes[this.memoryIdx], color: '#ffd43b' };
      s.dialogueActive = true;
      this.memoryIdx++;
      this.nextMemoryAt = now + 6000;
    }
  }

  // 渲染周目色调覆盖层（在 GameScene 渲染后期调用）
  drawOverlay(ctx, W, H) {
    if (!this.active) return;
    if (this.event === 'phantom_guide') {
      // 蓝灰朦胧
      ctx.fillStyle = 'rgba(60, 80, 110, 0.15)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.event === 'future_wife') {
      // 冷色调
      ctx.fillStyle = 'rgba(30, 50, 80, 0.12)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.event === 'memory_replay') {
      // 泛黄老照片
      ctx.fillStyle = 'rgba(120, 100, 60, 0.18)';
      ctx.fillRect(0, 0, W, H);
    }
  }
}

import Phaser from 'phaser';
import { MetaManager } from '../systems/SettingsManager.js';
import { ThreeDefeatSystem } from '../systems/ThreeDefeatSystem.js';

// 结算界面 — 三种入口：
//  1. 通关 (win=true)        → 进入星战字幕史诗结局 EndingCrawlScene
//  2. 三败 (threeDefeat=true) → 跪地画面 → 选择界面 → 放弃/不放弃
//  3. 普通死亡                → 传承过渡
export class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  init(data) {
    this.win = data?.win;
    this.threeDefeat = data?.threeDefeat;
    this.succession = data?.succession;
    this.fromPersevere = data?.fromPersevere;
  }

  create() {
    this.meta = MetaManager.load();
    this.threeDefeatSys = new ThreeDefeatSystem();
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.cameras.main.setBackgroundColor('#0a0a14');

    if (this.win) {
      // 通关 → 星战字幕史诗结局
      this.scene.start('EndingCrawl', { succession: this.succession });
      return;
    }
    if (this.threeDefeat) {
      this._threeDefeatSequence();
      return;
    }
    this._succession();

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.succession) this.scene.start('Game');
      else this.scene.start('Menu');
    });
  }

  // ===== 三败结局完整序列 =====
  // 阶段一：跪地画面（怪物围困 + "我真的失败了……"）
  // 阶段二：选择界面（放弃/不放弃，无倒计时）
  // 阶段三A：放弃 → 无星战，直接制作者名单 + 结果面板
  // 阶段三B：不放弃 → 怪物消散 + 同学出现 + 白光 → 回到存档点 + 获得"信念"
  _threeDefeatSequence() {
    this._phaseKneel();
  }

  _phaseKneel() {
    const W = this.W, H = this.H;
    this.cameras.main.setBackgroundColor('#1a1a22');
    // 暗灰色调背景
    const bg = this.add.rectangle(0, 0, W, H, 0x1a1a22, 1).setOrigin(0, 0);
    // 玩家跪地（简化剪影）
    const px = W * 0.5, py = H * 0.55;
    this.add.rectangle(px - 8, py - 6, 16, 24, 0x495057).setOrigin(0.5); // 躯干
    this.add.rectangle(px, py + 6, 24, 8, 0x343a40).setOrigin(0.5); // 跪地腿
    this.add.circle(px, py - 22, 7, 0x868e96); // 头
    // 周围涌出的怪物剪影（杂兵+精英）
    this._kneelShadows = [];
    const monsterCount = 14;
    for (let i = 0; i < monsterCount; i++) {
      const ang = (i / monsterCount) * Math.PI * 2;
      const r = 90 + (i % 3) * 30;
      const mx = px + Math.cos(ang) * r;
      const my = py + 6 + Math.sin(ang) * r * 0.4;
      const shadow = this.add.rectangle(mx, my, 18 + (i % 3) * 6, 22 + (i % 2) * 8, 0x000000, 0.85)
        .setOrigin(0.5).setAlpha(0);
      this._kneelShadows.push(shadow);
    }
    // 逐个淡入怪物剪影
    this._kneelShadows.forEach((sh, i) => {
      this.tweens.add({ targets: sh, alpha: 0.85, duration: 400, delay: i * 120 });
    });
    // 文字缓缓浮现："我真的失败了……"
    const failText = this.add.text(px, H * 0.28, '我真的失败了……', {
      fontFamily: 'sans-serif', fontSize: '30px', color: '#868e96', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: failText, alpha: 1, duration: 2000, delay: 1500,
      onComplete: () => {
        // 持续约 5 秒后进入选择界面
        this.time.delayedCall(3000, () => {
          failText.destroy();
          this._phaseChoice();
        });
      },
    });
  }

  _phaseChoice() {
    const W = this.W, H = this.H;
    // 清理跪地画面
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0a0a14');
    this.add.text(W / 2, H * 0.22, '你要放弃吗？', {
      fontFamily: 'sans-serif', fontSize: '34px', color: '#dee2e6', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.32, '面对不可能的敌人，你已经失败了三次。', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.36, '只有你能做出这个选择。没有对错。', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96',
    }).setOrigin(0.5);

    // 放弃按钮（灰色，位置在左，不突出）
    this._addChoiceButton('放弃', W * 0.35, H * 0.6, 0x343a40, '#868e96', () => this._phaseGiveUp());
    // 不放弃按钮（白色，位置在右，微微发光）
    this._addChoiceButton('不放弃', W * 0.65, H * 0.6, 0x1a1a2e, '#f8f9fa', () => this._phasePersevere(), true);
  }

  _addChoiceButton(text, x, y, fill, color, onClick, glow = false) {
    const bg = this.add.rectangle(x, y, 200, 56, fill, 0.95)
      .setStrokeStyle(glow ? 2 : 1, glow ? 0xfff3bf : 0x495057, glow ? 0.9 : 0.4);
    const txt = this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '22px', color,
    }).setOrigin(0.5);
    if (glow) {
      this.tweens.add({ targets: bg, alpha: { from: 0.85, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
    }
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setScale(1.05));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', () => onClick());
  }

  // ===== 阶段三A：选择放弃 =====
  // 无星战字幕，直接显示制作者名单（简洁快速滚动）+ 结果面板
  _phaseGiveUp() {
    const result = this.threeDefeatSys.chooseGiveUp(this.succession);
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.W, H = this.H;
    // 简洁快速滚动的制作者名单
    const credits = [
      '大战肘击王',
      '',
      '一个未完成的故事',
      '',
      '你选择了放弃',
      '——这是合理的',
      '',
      '不是每个人都能打赢不可能的战争',
      '',
      '—— 全剧终 ——',
    ];
    const txt = this.add.text(W / 2, H, credits.join('\n'), {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#868e96',
      align: 'center', lineSpacing: 12,
    }).setOrigin(0.5, 1);
    this.tweens.add({
      targets: txt, y: -txt.height / 2, duration: 8000, ease: 'Linear',
      onComplete: () => this._showGiveUpStats(result),
    });
  }

  _showGiveUpStats(result) {
    this.children.removeAll(true);
    const W = this.W, H = this.H;
    this.cameras.main.setBackgroundColor('#0a0a14');
    this.add.text(W / 2, H * 0.15, '最终结果', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#fa5252', fontStyle: 'bold',
    }).setOrigin(0.5);
    const stats = [
      '起义军：' + (result.stats.rebelName),
      '性别：' + result.stats.rebelGender,
      '第 ' + result.stats.generation + ' 任起义军',
      '死亡次数：' + result.stats.deaths,
      '肘击王战失败次数：' + result.stats.threeDefeats,
      '结局标记：放弃',
    ];
    stats.forEach((line, i) => {
      this.add.text(W / 2, H * 0.3 + i * 32, line, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd',
      }).setOrigin(0.5);
    });
    this.add.text(W / 2, H * 0.72, '故事没有圆满。', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96', fontStyle: 'italic',
    }).setOrigin(0.5);
    this._addButton('返回主菜单', W / 2, H * 0.88, () => {
      this.scene.stop('End');
      this.scene.start('Menu');
    });
  }

  // ===== 阶段三B：选择不放弃 =====
  // 怪物消散 + 同学剪影出现 + 白光 → 回到存档点 + 获得"信念"
  _phasePersevere() {
    const result = this.threeDefeatSys.choosePersevere();
    this.children.removeAll(true);
    const W = this.W, H = this.H;
    this.cameras.main.setBackgroundColor('#1a1a22');
    const px = W * 0.5, py = H * 0.55;
    // 玩家跪着
    this.add.rectangle(px - 8, py - 6, 16, 24, 0x495057).setOrigin(0.5);
    this.add.rectangle(px, py + 6, 24, 8, 0x343a40).setOrigin(0.5);
    this.add.circle(px, py - 22, 7, 0x868e96);

    // 怪物剪影消散（粒子向上飘散）
    const shadows = [];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const r = 100 + (i % 3) * 25;
      const mx = px + Math.cos(ang) * r;
      const my = py + 6 + Math.sin(ang) * r * 0.4;
      const sh = this.add.rectangle(mx, my, 16, 20, 0x000000, 0.8).setOrigin(0.5);
      shadows.push(sh);
      this.tweens.add({
        targets: sh, y: sh.y - 80, alpha: 0, duration: 1500, delay: i * 80,
        onComplete: () => sh.destroy(),
      });
    }

    // 同学剪影一个个出现在玩家身后（沉默者、交易员、尖子生、旁观者、守望者）
    const npcs = ['沉默者', '交易员', '尖子生', '旁观者', '守望者'];
    const comradeColors = [0xadb5bd, 0xffd43b, 0x74c0fc, 0xced4da, 0x8ce99a];
    const comrades = [];
    npcs.forEach((name, i) => {
      const cx = W * 0.5 + (i - 2) * 70;
      const cy = py + 6;
      const sh = this.add.rectangle(cx, cy, 18, 36, comradeColors[i], 0).setOrigin(0.5, 1);
      const head = this.add.circle(cx, cy - 36, 8, 0xf0c090, 0).setOrigin(0.5);
      comrades.push(sh, head);
      this.tweens.add({
        targets: [sh, head], alpha: 0.9, duration: 800, delay: 1500 + i * 600,
      });
    });

    // 同学站满后一道白光闪过全屏
    this.time.delayedCall(1500 + npcs.length * 600 + 500, () => {
      const flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0, 0);
      this.tweens.add({
        targets: flash, alpha: 1, duration: 400,
        onComplete: () => {
          this.tweens.add({
            targets: flash, alpha: 0, duration: 1000,
            onComplete: () => {
              // 白光后回到存档点 + 获得"信念"
              this._persevereComplete();
            },
          });
        },
      });
    });
  }

  _persevereComplete() {
    // 标记获得信念（已在 choosePersevere 中持久化）
    // 返回 Game 场景（从 C3 存档点继续）
    this.scene.stop('End');
    this.scene.start('Game', { fromPersevere: true, grantFaith: true });
  }

  // ===== 普通死亡：传承过渡 =====
  _succession() {
    const W = this.W, H = this.H;
    this.add.text(W / 2, H * 0.25, '传承', {
      fontFamily: 'sans-serif', fontSize: '56px', color: '#cc5de8', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.4,
      '你倒下了。\n但你的遗物会传递给下一个起义者。\n\n每一代都比上一代更强。',
      { fontFamily: 'sans-serif', fontSize: '20px', color: '#dee2e6', align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5);
    this.meta.totalDeaths = (this.meta.totalDeaths || 0) + 1;
    MetaManager.save(this.meta);
    this.add.text(W / 2, H * 0.75, '第 ' + this.meta.totalDeaths + ' 代传承', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b',
    }).setOrigin(0.5);
    this._addButtons(W, H, true);
  }

  _addButtons(W, H, withRetry = false) {
    if (withRetry) {
      this._addButton('传承再战', W / 2, H * 0.88, () => {
        this.scene.stop('End');
        this.scene.start('Game');
      });
    } else {
      this._addButton('返回主菜单', W / 2, H * 0.88, () => {
        this.scene.stop('End');
        this.scene.start('Menu');
      });
    }
  }

  _addButton(text, x, y, onClick, width = 240) {
    const bg = this.add.rectangle(x, y, width, 50, 0x2a1a3a, 0.9)
      .setStrokeStyle(2, 0xffd43b, 0.6);
    const txt = this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#f8f9fa',
    }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x3a2a4a, 0.95));
    bg.on('pointerout', () => bg.setFillStyle(0x2a1a3a, 0.9));
    bg.on('pointerdown', () => onClick());
  }
}

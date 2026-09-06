import Phaser from 'phaser';
import { MetaManager } from '../systems/SettingsManager.js';

export class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  init(data) {
    this.win = data?.win;
    this.threeDefeat = data?.threeDefeat;
    this.succession = data?.succession;
  }

  create() {
    this.meta = MetaManager.load();
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    if (this.win) {
      this._victory(W, H);
    } else if (this.threeDefeat) {
      this._threeDefeat(W, H);
    } else {
      this._succession(W, H);
    }

    // Enter 键快捷操作
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.succession) {
        this.scene.start('Game');
      } else {
        this.scene.start('Menu');
      }
    });
  }

  _victory(W, H) {
    // 星战式滚动字幕
    this.cameras.main.setBackgroundColor('#000000');
    const story = [
      '第 ' + ((this.meta.totalDeaths || 0) + 1) + ' 代起义军终于击败了肘击王。',
      '',
      '教学楼的钟声戛然而止。',
      '走廊里堆积的试卷化为飞灰。',
      '操场上的排名表碎裂成无数数字，随风飘散。',
      '',
      '肘击王倒下时，面具裂开一条缝。',
      '你看到了一张熟悉的脸——',
      '那是曾经在讲台前对你说',
      '"你是我最得意的学生"的人。',
      '',
      '"……原来如此。" 它低语着，',
      '"你终于超越了我。"',
      '',
      '起义军的传说，',
      '将在每一届新生中流传。',
      '而钟声，永远不会再为任何人敲响。',
      '',
      '',
      '—— 全剧终 ——',
    ];

    const fullText = story.join('\n');
    const text = this.add.text(W / 2, H + 100, fullText, {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#ffd43b',
      align: 'center',
      lineSpacing: 14,
    }).setOrigin(0.5, 0);

    // 顶部渐变遮罩
    const fadeH = 120;
    const fadeG = this.add.graphics();
    fadeG.fillGradientStyle(0x000000, 0x000000, 0x00000000, 0x00000000, 1);
    fadeG.fillRect(0, 0, W, fadeH);

    // 滚动动画
    const distance = H + story.length * 36 + 200;
    this.tweens.add({
      targets: text,
      y: -distance,
      duration: 20000,
      ease: 'Linear',
      onComplete: () => {
        // 显示胜利标题
        this.add.text(W / 2, H * 0.35, '胜利', {
          fontFamily: 'sans-serif', fontSize: '72px', color: '#51cf66', fontStyle: 'bold',
        }).setOrigin(0.5).setShadow(4, 4, '#ffd43b', 0, true, true);
        this.add.text(W / 2, H * 0.5, '肘击王倒下了。\n然而钟声依旧……', {
          fontFamily: 'sans-serif', fontSize: '22px', color: '#adb5bd', align: 'center', lineSpacing: 10,
        }).setOrigin(0.5);
        this.meta.victories = (this.meta.victories || 0) + 1;
        MetaManager.save(this.meta);
        this.add.text(W / 2, H * 0.7, '已通关 ' + this.meta.victories + ' 次', {
          fontFamily: 'sans-serif', fontSize: '14px', color: '#868e96',
        }).setOrigin(0.5);
        this._addButtons(W, H);
      },
    });

    // 跳过按钮
    this._addButton('跳过', W - 60, 30, 80, () => {
      this.tweens.killAll();
      text.destroy();
      this._victory(W, H);
    });
  }

  _threeDefeat(W, H) {
    this.add.text(W / 2, H * 0.18, '三战三败', {
      fontFamily: 'sans-serif', fontSize: '64px', color: '#fa5252', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.32,
      '肘击王冷笑着站在你的尸骸上。\n\n' +
      '"这就是学生的极限吗？"',
      { fontFamily: 'sans-serif', fontSize: '20px', color: '#dee2e6', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
    this.add.text(W / 2, H * 0.52,
      '钟声持续敲响，起义军永远无法取胜……\n直到下一个你诞生。',
      { fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96', align: 'center', lineSpacing: 8 }
    ).setOrigin(0.5);

    // 信念选择
    this.add.text(W / 2, H * 0.66, '是否接受"信念"之力？', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 接受信念：攻击力永久提升，但三败计数不清零（持续挑战）
    this._addButton('✦ 接受信念，继续战斗', W / 2 - 150, H * 0.78, () => {
      const meta = MetaManager.load();
      meta.faithPower = (meta.faithPower || 0) + 1;
      meta.threeDefeatCount = 0;
      MetaManager.save(meta);
      this.scene.start('Succession', {
        fromThreeDefeat: true,
        faithReward: { name: '信念之火 +' + meta.faithPower },
      });
    }, 280);

    // 放弃：返回主菜单，清零三败计数
    this._addButton('放弃，返回主菜单', W / 2 + 150, H * 0.78, () => {
      const meta = MetaManager.load();
      meta.threeDefeatCount = 0;
      MetaManager.save(meta);
      this.scene.start('Menu');
    }, 260);
  }

  _succession(W, H) {
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

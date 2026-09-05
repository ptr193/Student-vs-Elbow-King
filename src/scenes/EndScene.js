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
    this.add.text(W / 2, H * 0.3, '胜利', {
      fontFamily: 'sans-serif', fontSize: '72px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(4, 4, '#51cf66', 0, true, true);
    this.add.text(W / 2, H * 0.45, '肘击王倒下了。\n然而钟声依旧……', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#adb5bd', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5);
    this.meta.victories = (this.meta.victories || 0) + 1;
    MetaManager.save(this.meta);
    this.add.text(W / 2, H * 0.9, '已通关 ' + this.meta.victories + ' 次', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#868e96',
    }).setOrigin(0.5);
    this._addButtons(W, H);
  }

  _threeDefeat(W, H) {
    this.add.text(W / 2, H * 0.25, '三战三败', {
      fontFamily: 'sans-serif', fontSize: '64px', color: '#fa5252', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.4,
      '肘击王冷笑着站在你的尸骸上。\n\n' +
      '"这就是学生的极限吗？"',
      { fontFamily: 'sans-serif', fontSize: '20px', color: '#dee2e6', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
    this.add.text(W / 2, H * 0.7,
      '钟声持续敲响，起义军永远无法取胜……\n直到下一个你诞生。',
      { fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96', align: 'center', lineSpacing: 8 }
    ).setOrigin(0.5);
    this._addButtons(W, H);
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

  _addButton(text, x, y, onClick) {
    const bg = this.add.rectangle(x, y, 240, 50, 0x2a1a3a, 0.9)
      .setStrokeStyle(2, 0xffd43b, 0.6);
    const txt = this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8f9fa',
    }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x3a2a4a, 0.95));
    bg.on('pointerout', () => bg.setFillStyle(0x2a1a3a, 0.9));
    bg.on('pointerdown', () => onClick());
  }
}

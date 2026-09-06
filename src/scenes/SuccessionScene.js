import Phaser from 'phaser';
import { MetaManager } from '../systems/SettingsManager.js';

// 传承空间：展示上一代遗物，新任角色信息，以及继承选择
export class SuccessionScene extends Phaser.Scene {
  constructor() { super('Succession'); }

  init(data) {
    this.fromThreeDefeat = data?.fromThreeDefeat || false;
    this.faithReward = data?.faithReward || null;
  }

  create() {
    this.meta = MetaManager.load();
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    const succ = this.meta.successionData;

    // 标题
    this.add.text(W / 2, H * 0.1, '传承空间', {
      fontFamily: 'sans-serif', fontSize: '48px', color: '#cc5de8', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (succ) {
      this._renderInheritance(W, H, succ);
    } else {
      this.add.text(W / 2, H * 0.4, '首任起义者，无物可承。\n唯有信念永存。', {
        fontFamily: 'sans-serif', fontSize: '22px', color: '#adb5bd', align: 'center', lineSpacing: 12,
      }).setOrigin(0.5);
    }

    // 三败信念奖励
    if (this.faithReward) {
      this.add.text(W / 2, H * 0.85, '获得信念遗物：' + this.faithReward.name, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b',
      }).setOrigin(0.5);
    }

    // 继续按钮
    this._addButton('继承遗志，继续战斗', W / 2, H * 0.92, () => {
      this.scene.start('Game');
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start('Game');
    });
  }

  _renderInheritance(W, H, succ) {
    // 上一代信息
    this.add.text(W / 2, H * 0.22, '上一代倒下于：' + this._chapterName(succ.deathChapter) + ' 第 ' + (succ.deathRoom + 1) + ' 间', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96',
    }).setOrigin(0.5);

    // 继承物品列表
    let y = H * 0.32;
    if (succ.items && succ.items.length > 0) {
      this.add.text(W * 0.3, y, '继承道具：', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b',
      }).setOrigin(0, 0.5);
      const itemText = succ.items.map(id => id).join('、');
      this.add.text(W * 0.45, y, itemText, {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#dee2e6', wordWrap: { width: W * 0.5 },
      }).setOrigin(0, 0.5);
      y += 32;
    }

    if (succ.gold > 0) {
      this.add.text(W * 0.3, y, '继承金币：', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b',
      }).setOrigin(0, 0.5);
      this.add.text(W * 0.45, y, succ.gold + ' 枚', {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#fcc419',
      }).setOrigin(0, 0.5);
      y += 32;
    }

    if (succ.skills) {
      this.add.text(W * 0.3, y, '继承技能：', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b',
      }).setOrigin(0, 0.5);
      this.add.text(W * 0.45, y, succ.skills.name, {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#51cf66',
      }).setOrigin(0, 0.5);
      y += 32;
    }

    if (succ.specialBullet && succ.specialBullet !== 'normal' && succ.specialAmmo > 0) {
      const names = { ink: '墨迹弹', staple: '钉书弹', red_cross: '红叉弹' };
      this.add.text(W * 0.3, y, '继承弹药：', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b',
      }).setOrigin(0, 0.5);
      this.add.text(W * 0.45, y, (names[succ.specialBullet] || succ.specialBullet) + ' × ' + succ.specialAmmo, {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#f06595',
      }).setOrigin(0, 0.5);
      y += 32;
    }

    if (succ.hasFaith) {
      this.add.text(W / 2, y + 10, '✦ 信念之火未熄，攻击力提升 ✦', {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#fa5252', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // 分隔线
    this.add.line(0, H * 0.62, W / 2, H * 0.62, 0, 0, 0x495057).setLineWidth(1);

    // 新一代
    this.add.text(W / 2, H * 0.66, '下一位起义者已就位', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#51cf66',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.72, '第 ' + ((this.meta.totalDeaths || 0) + 1) + ' 代传承者', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#adb5bd',
    }).setOrigin(0.5);
  }

  _chapterName(idx) {
    const names = ['教学楼', '走廊', '操场'];
    return names[idx] || ('第 ' + (idx + 1) + ' 章');
  }

  _addButton(text, x, y, onClick) {
    const bg = this.add.rectangle(x, y, 280, 50, 0x2a1a3a, 0.9)
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

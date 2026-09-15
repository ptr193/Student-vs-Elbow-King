import Phaser from 'phaser';
import { AchievementSystem } from '../systems/AchievementSystem.js';

// 成就页面（规格 5.6）：查看所有成就解锁进度
export class AchievementScene extends Phaser.Scene {
  constructor() { super('Achievement'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    this.add.text(W / 2, 30, '成就', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    const all = AchievementSystem.getAll();
    const unlocked = AchievementSystem.getUnlocked();

    this.add.text(W / 2, 68, `已解锁 ${unlocked.length} / ${all.length}`, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#adb5bd',
    }).setOrigin(0.5);

    const cols = 2;
    const cardW = (W * 0.9) / cols - 16;
    const cardH = 64;
    const startY = 110;

    all.forEach((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = W * 0.05 + col * (cardW + 16) + cardW / 2;
      const y = startY + row * (cardH + 10);
      const isUnlocked = unlocked.includes(a.id);

      const bg = this.add.rectangle(x, y, cardW, cardH, isUnlocked ? 0x1a1a2e : 0x0e0e18, 0.9)
        .setStrokeStyle(1, isUnlocked ? 0xffd43b : 0x212529, 0.5);
      const icon = this.add.text(x - cardW / 2 + 16, y, isUnlocked ? (a.icon || '★') : '🔒', {
        fontFamily: 'sans-serif', fontSize: '22px',
        color: isUnlocked ? '#ffd43b' : '#495057',
      }).setOrigin(0, 0.5);
      const name = this.add.text(x - cardW / 2 + 56, y - 12, isUnlocked ? a.name : '未解锁', {
        fontFamily: 'sans-serif', fontSize: '15px',
        color: isUnlocked ? '#f8f9fa' : '#495057', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const desc = this.add.text(x - cardW / 2 + 56, y + 12, isUnlocked ? a.desc : '???', {
        fontFamily: 'sans-serif', fontSize: '12px',
        color: isUnlocked ? '#adb5bd' : '#495057',
        wordWrap: { width: cardW - 72 },
      }).setOrigin(0, 0.5);
    });

    // 返回
    this._addButton('返回', W - 70, H - 30, 100, () => this.scene.start('Menu'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }

  _addButton(text, x, y, width, onClick) {
    const bg = this.add.rectangle(x, y, width, 40, 0x2a1a3a, 0.9)
      .setStrokeStyle(2, 0xffd43b, 0.6);
    const txt = this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#f8f9fa',
    }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x3a2a4a, 0.95));
    bg.on('pointerout', () => bg.setFillStyle(0x2a1a3a, 0.9));
    bg.on('pointerdown', () => onClick());
  }
}

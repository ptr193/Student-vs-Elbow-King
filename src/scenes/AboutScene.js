import Phaser from 'phaser';

// 关于页面（规格 4.10）：游戏介绍 + 操作说明图文 + 制作信息
export class AboutScene extends Phaser.Scene {
  constructor() { super('About'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    this.add.text(W / 2, 30, '关于', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 游戏介绍
    this.add.text(W / 2, 75, '大战肘击王 v1.0', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#fff3bf', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, 105, '俯视角硬核双摇杆射击肉鸽手游', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#adb5bd',
    }).setOrigin(0.5);
    this.add.text(W / 2, 130, '核心特色：不平衡的战争 —— BOSS 压倒性强大，每一代起义军的牺牲都为最终胜利铺路', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#868e96', align: 'center',
      wordWrap: { width: W * 0.8 },
    }).setOrigin(0.5);

    // 操作说明标题
    this.add.text(W / 2, 175, '操作说明', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffd43b',
    }).setOrigin(0.5);

    // 操作条目（图文：左侧按键图形 + 右侧说明）
    const ops = [
      { keys: ['A', 'D'], label: '左右移动' },
      { keys: ['空格'], label: '射击（自动瞄准最近敌人）' },
      { keys: ['Q'], label: '切换已解锁的特殊子弹' },
      { keys: ['ESC'], label: '暂停游戏' },
      { keys: ['点击'], label: '拾取道具 / 与 NPC 交互' },
    ];

    ops.forEach((op, i) => {
      const y = 210 + i * 42;
      // 按键图形
      let keyX = W * 0.28;
      op.keys.forEach((k, ki) => {
        const kw = k.length > 2 ? 56 : 36;
        const kb = this.add.rectangle(keyX, y, kw, 28, 0x2a1a3a, 0.9)
          .setStrokeStyle(1, 0xffd43b, 0.6);
        const kt = this.add.text(keyX, y, k, {
          fontFamily: 'sans-serif', fontSize: '12px', color: '#ffd43b', fontStyle: 'bold',
        }).setOrigin(0.5);
        keyX += kw + 8;
        if (ki < op.keys.length - 1) {
          // 加号
          this.add.text(keyX - 4, y, '+', {
            fontFamily: 'sans-serif', fontSize: '14px', color: '#868e96',
          }).setOrigin(0.5);
          keyX += 12;
        }
      });
      // 说明
      this.add.text(W * 0.4, y, op.label, {
        fontFamily: 'sans-serif', fontSize: '15px', color: '#dee2e6',
      }).setOrigin(0, 0.5);
    });

    // 移动端提示
    this.add.text(W / 2, 210 + ops.length * 42 + 10, '移动端：左摇杆移动 · 右摇杆射击 · 屏幕按钮切换子弹/暂停', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#69db7c', align: 'center',
    }).setOrigin(0.5);

    // 小提示
    this.add.text(W / 2, H - 90, '提示：肘击王的冲撞前有预警红光，及时闪避；抓取抽查时答对诗句可破防', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#868e96', align: 'center',
      wordWrap: { width: W * 0.85 },
    }).setOrigin(0.5);

    // 制作信息
    this.add.text(W / 2, H - 45, '制作：独立开发 · Phaser 3 + Vite + Capacitor', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#495057',
    }).setOrigin(0.5);

    // 返回按钮
    const backBtn = this.add.rectangle(W - 70, H - 30, 100, 40, 0x2a1a3a, 0.9)
      .setStrokeStyle(2, 0xffd43b, 0.6);
    const backTxt = this.add.text(W - 70, H - 30, '返回', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#f8f9fa',
    }).setOrigin(0.5);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setFillStyle(0x3a2a4a, 0.95));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x2a1a3a, 0.9));
    backBtn.on('pointerdown', () => this.scene.start('Menu'));

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }
}

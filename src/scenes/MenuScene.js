import Phaser from 'phaser';
import { SettingsManager, MetaManager } from '../systems/SettingsManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.settings = SettingsManager.load();
    this.meta = MetaManager.load();
    this.cameras.main.setBackgroundColor('#0a0a14');
    const W = this.scale.width, H = this.scale.height;

    // 背景粒子
    this._createParticles(W, H);

    // 标题
    this.add.text(W / 2, H * 0.25, '大战肘击王', {
      fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'bold',
      color: '#ffd43b', align: 'center',
    }).setOrigin(0.5).setShadow(4, 4, '#fa5252', 0, true, true);
    this.add.text(W / 2, H * 0.25 + 70, '起义军的最后一战', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#adb5bd',
    }).setOrigin(0.5);

    // 按钮
    const btnY = H * 0.5;
    this._addButton('开始征程', W / 2, btnY, () => this._startGame());
    this._addButton('图鉴', W / 2, btnY + 70, () => this._showCodex());
    this._addButton('收藏', W / 2, btnY + 140, () => this._showCollection());
    this._addButton('设置', W / 2, btnY + 210, () => this._showSettings());
    this._addButton('关于', W / 2, btnY + 280, () => this._showAbout());

    // 传承代数
    this.add.text(W / 2, H * 0.92, `传承代数：${this.meta.totalDeaths || 0}`, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.96, 'v1.0 · 修复重构版', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#495057',
    }).setOrigin(0.5);
  }

  _createParticles(W, H) {
    for (let i = 0; i < 30; i++) {
      const dot = this.add.circle(
        Math.random() * W, Math.random() * H,
        1 + Math.random() * 2, 0xffd43b, 0.3
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - 100,
        alpha: 0,
        duration: 3000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 3000,
        onRepeat: () => { dot.y = H + 20; dot.alpha = 0.3; },
      });
    }
  }

  _addButton(text, x, y, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 280, 50, 0x2a1a3a, 0.8)
      .setStrokeStyle(2, 0xffd43b, 0.6);
    const txt = this.add.text(0, 0, text, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#f8f9fa',
    }).setOrigin(0.5);
    container.add([bg, txt]);
    container.setSize(280, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x3a2a4a, 0.9));
    container.on('pointerout', () => bg.setFillStyle(0x2a1a3a, 0.8));
    container.on('pointerdown', () => {
      bg.setFillStyle(0x5a3a6a, 1);
      this.game.registry.get('audio')?.button();
      setTimeout(onClick, 150);
    });
    return container;
  }

  _startGame() {
    // 开场叙事 → Game（规格 4.10：文字逐字显示 + 剪影画面 + 出发台词）
    this.scene.start('OpeningNarrative');
  }

  _showCodex() {
    this.scene.start('Codex');
  }

  _showCollection() {
    this.scene.start('Collection');
  }

  _showSettings() {
    this._showModal('设置', 'BGM 音量：' + Math.round(this.settings.bgmVolume * 100) + '%\n音效音量：' + Math.round(this.settings.sfxVolume * 100) + '%\n屏幕震动：' + (this.settings.screenShake ? '开' : '关'));
  }

  _showAbout() {
    this.scene.start('About');
  }

  _showModal(title, content) {
    const W = this.scale.width, H = this.scale.height;
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0, 0);
    const panel = this.add.rectangle(W / 2, H / 2, 500, 320, 0x141628, 0.95)
      .setStrokeStyle(2, 0xffd43b, 0.4);
    const t = this.add.text(W / 2, H / 2 - 120, title, {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#ffd43b',
    }).setOrigin(0.5);
    const c = this.add.text(W / 2, H / 2, content, {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd', align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);
    const closeBtn = this.add.rectangle(W / 2, H / 2 + 110, 120, 40, 0xfa5252, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.3);
    const closeTxt = this.add.text(W / 2, H / 2 + 110, '返回', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#fff',
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      [bg, panel, t, c, closeBtn, closeTxt].forEach(o => o.destroy());
    });
  }
}

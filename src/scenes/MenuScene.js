import Phaser from 'phaser';
import { SettingsManager, MetaManager } from '../systems/SettingsManager.js';
import { CycleSystem } from '../systems/CycleSystem.js';

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

    // 周目信息
    const cycleSys = new CycleSystem();
    const cycle = cycleSys.getCurrentCycle();
    const completed = cycleSys.isGameCompleted();

    // 按钮
    const btnY = H * 0.48;
    this._addButton('开始征程', W / 2, btnY, () => this._startGame());
    this._addButton('图鉴', W / 2, btnY + 60, () => this._showCodex());
    this._addButton('收藏', W / 2, btnY + 120, () => this._showCollection());
    this._addButton('成就', W / 2, btnY + 180, () => this._showAchievements());
    this._addButton('排行榜', W / 2, btnY + 240, () => this.scene.start('Leaderboard'));
    this._addButton('设置', W / 2, btnY + 300, () => this._showSettings());
    this._addButton('关于', W / 2, btnY + 360, () => this._showAbout());

    // 周目进度
    const cycleColor = completed ? '#69db7c' : '#ffd43b';
    const cycleText = completed ? '✦ 游戏已完结 ✦' : `第 ${cycle} 周目 · ${cycleSys.getCycleTitle()}`;
    this.add.text(W / 2, H * 0.88, cycleText, {
      fontFamily: 'sans-serif', fontSize: '18px', color: cycleColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.93, `传承代数：${this.meta.totalDeaths || 0}`, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#868e96',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.97, 'v2.0 · 周目完整版', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#495057',
    }).setOrigin(0.5);
  }

  _showAchievements() {
    this.scene.start('Achievement');
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
    const cycleSys = new CycleSystem();
    // 完结后可选择周目（规格 7.5）
    if (cycleSys.isGameCompleted()) {
      this._showCycleSelect();
    } else {
      this.scene.start('OpeningNarrative');
    }
  }

  _showCycleSelect() {
    const W = this.scale.width, H = this.scale.height;
    const cycleSys = new CycleSystem();
    const unlocked = cycleSys.getUnlockedCycles();
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(10);
    this.add.text(W / 2, H * 0.2, '选择周目', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    const cols = 4;
    unlocked.forEach((c, i) => {
      const x = W / 2 + (i % cols - (cols - 1) / 2) * 110;
      const y = H * 0.4 + Math.floor(i / cols) * 80;
      const btn = this.add.text(x, y, `第 ${c} 周目`, {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#adb5bd',
        backgroundColor: '#1a1a2e', padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setColor('#ffd43b'));
      btn.on('pointerout', () => btn.setColor('#adb5bd'));
      btn.on('pointerdown', () => {
        cycleSys.setCycle(c);
        overlay.destroy();
        this.scene.start(c === 1 ? 'OpeningNarrative' : 'CycleTransition');
      });
    });
    // 取消
    const cancel = this.add.text(W / 2, H * 0.8, '取消', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#868e96',
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => { overlay.destroy(); this.scene.restart(); });
  }

  _showCodex() {
    this.scene.start('Codex');
  }

  _showCollection() {
    this.scene.start('Collection');
  }

  _showSettings() {
    const W = this.scale.width, H = this.scale.height;
    const objs = [];
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0);
    objs.push(bg);
    const panel = this.add.rectangle(W / 2, H / 2, 520, 360, 0x141628, 0.96)
      .setStrokeStyle(2, 0xffd43b, 0.4);
    objs.push(panel);
    const title = this.add.text(W / 2, H / 2 - 140, '设置', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#ffd43b',
    }).setOrigin(0.5);
    objs.push(title);

    const settings = SettingsManager.load();

    // BGM 音量
    const bgmLabel = this.add.text(W / 2 - 180, H / 2 - 70, 'BGM 音量', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    objs.push(bgmLabel);
    const bgmVal = this.add.text(W / 2 + 160, H / 2 - 70, Math.round(settings.bgmVolume * 100) + '%', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#fff',
    }).setOrigin(1, 0.5);
    objs.push(bgmVal);
    const bgmMinus = this._makeBtn(W / 2 + 40, H / 2 - 70, '−', () => {
      settings.bgmVolume = Math.max(0, settings.bgmVolume - 0.1);
      SettingsManager.save(settings);
      bgmVal.setText(Math.round(settings.bgmVolume * 100) + '%');
      this.game.registry.get('audio')?.setBgmVolume(settings.bgmVolume);
    });
    const bgmPlus = this._makeBtn(W / 2 + 110, H / 2 - 70, '+', () => {
      settings.bgmVolume = Math.min(1, settings.bgmVolume + 0.1);
      SettingsManager.save(settings);
      bgmVal.setText(Math.round(settings.bgmVolume * 100) + '%');
      this.game.registry.get('audio')?.setBgmVolume(settings.bgmVolume);
    });
    objs.push(...bgmMinus, ...bgmPlus);

    // 音效音量
    const sfxLabel = this.add.text(W / 2 - 180, H / 2 - 10, '音效音量', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    objs.push(sfxLabel);
    const sfxVal = this.add.text(W / 2 + 160, H / 2 - 10, Math.round(settings.sfxVolume * 100) + '%', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#fff',
    }).setOrigin(1, 0.5);
    objs.push(sfxVal);
    const sfxMinus = this._makeBtn(W / 2 + 40, H / 2 - 10, '−', () => {
      settings.sfxVolume = Math.max(0, settings.sfxVolume - 0.1);
      SettingsManager.save(settings);
      sfxVal.setText(Math.round(settings.sfxVolume * 100) + '%');
      this.game.registry.get('audio')?.setSfxVolume(settings.sfxVolume);
    });
    const sfxPlus = this._makeBtn(W / 2 + 110, H / 2 - 10, '+', () => {
      settings.sfxVolume = Math.min(1, settings.sfxVolume + 0.1);
      SettingsManager.save(settings);
      sfxVal.setText(Math.round(settings.sfxVolume * 100) + '%');
      this.game.registry.get('audio')?.setSfxVolume(settings.sfxVolume);
    });
    objs.push(...sfxMinus, ...sfxPlus);

    // 屏幕震动
    const shakeLabel = this.add.text(W / 2 - 180, H / 2 + 50, '屏幕震动', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    objs.push(shakeLabel);
    const shakeBtn = this.add.rectangle(W / 2 + 100, H / 2 + 50, 120, 36, 0x2a2a4a, 0.9)
      .setStrokeStyle(1, 0x69db7c, 0.6);
    const shakeTxt = this.add.text(W / 2 + 100, H / 2 + 50, settings.screenShake ? '开' : '关', {
      fontFamily: 'sans-serif', fontSize: '18px', color: settings.screenShake ? '#69db7c' : '#fa5252',
    }).setOrigin(0.5);
    objs.push(shakeBtn, shakeTxt);
    shakeBtn.setInteractive({ useHandCursor: true });
    shakeBtn.on('pointerdown', () => {
      settings.screenShake = !settings.screenShake;
      SettingsManager.save(settings);
      shakeTxt.setText(settings.screenShake ? '开' : '关');
      shakeTxt.setColor(settings.screenShake ? '#69db7c' : '#fa5252');
    });

    // 返回
    const closeBtn = this.add.rectangle(W / 2, H / 2 + 130, 120, 40, 0xfa5252, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.3);
    const closeTxt = this.add.text(W / 2, H / 2 + 130, '返回', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#fff',
    }).setOrigin(0.5);
    objs.push(closeBtn, closeTxt);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => objs.forEach(o => o.destroy()));
  }

  _makeBtn(x, y, label, onClick) {
    const btn = this.add.rectangle(x, y, 36, 32, 0x2a2a4a, 0.9).setStrokeStyle(1, 0xffd43b, 0.5);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffd43b',
    }).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setFillStyle(0x3a3a5a, 0.95));
    btn.on('pointerout', () => btn.setFillStyle(0x2a2a4a, 0.9));
    btn.on('pointerdown', onClick);
    return [btn, txt];
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

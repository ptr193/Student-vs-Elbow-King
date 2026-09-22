import Phaser from 'phaser';
import { SettingsManager, MetaManager } from '../systems/SettingsManager.js';
import { CycleSystem } from '../systems/CycleSystem.js';

// 生成带渐变+内阴影+发光描边的圆角按钮纹理
function makeButtonTexture(scene, key, w, h, colorTop, colorBottom, glowColor) {
  if (scene.textures.exists(key)) return key;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = Math.min(12, h / 2);
  // 外发光
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, colorTop);
  g.addColorStop(1, colorBottom);
  ctx.fillStyle = g;
  roundRectPath(ctx, 2, 2, w - 4, h - 4, r);
  ctx.fill();
  ctx.restore();
  // 顶部高光
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRectPath(ctx, 4, 4, w - 8, (h - 8) * 0.45, r);
  ctx.fill();
  // 内描边
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, 2.5, 2.5, w - 5, h - 5, r);
  ctx.stroke();
  // 外描边
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, 2, 2, w - 4, h - 4, r);
  ctx.stroke();
  scene.textures.addCanvas(key, canvas);
  return key;
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.settings = SettingsManager.load();
    this.meta = MetaManager.load();
    const W = this.scale.width, H = this.scale.height;

    // 渐变背景（深紫到近黑，径向）
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f2e, 0x1a0f2e, 0x05050f, 0x05050f, 1);
    bg.fillRect(0, 0, W, H);
    // 中央光晕
    const glow = this.add.graphics();
    glow.fillStyle(0x3a1a5a, 0.25);
    glow.fillCircle(W / 2, H * 0.3, 280);
    glow.fillStyle(0x2a1a4a, 0.15);
    glow.fillCircle(W / 2, H * 0.3, 420);

    // 背景粒子（上升光点）
    this._createParticles(W, H);

    // 标题 - 大字号 + 多层阴影营造发光感
    const title = this.add.text(W / 2, H * 0.22, '大战肘击王', {
      fontFamily: 'sans-serif', fontSize: '88px', fontStyle: 'bold',
      color: '#ffd43b', align: 'center',
      stroke: '#fa5252', strokeThickness: 3,
    }).setOrigin(0.5);
    title.setShadow(0, 0, '#ff006e', 24, true, true);
    title.setShadow(0, 4, '#000', 8, false, true);

    this.add.text(W / 2, H * 0.22 + 64, '起义军的最后一战', {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#adb5bd',
      fontStyle: '500',
    }).setOrigin(0.5);

    // 周目信息
    const cycleSys = new CycleSystem();
    const cycle = cycleSys.getCurrentCycle();
    const completed = cycleSys.isGameCompleted();

    // 按钮（两列布局更适合横屏）
    const btnW = 240, btnH = 52, gap = 16;
    const startX = W / 2 - btnW - gap / 2;
    const rightX = W / 2 + gap / 2;
    const btnY0 = H * 0.42;
    const btnList = [
      { label: '开始征程', onClick: () => this._startGame(), primary: true },
      { label: '图鉴', onClick: () => this._showCodex() },
      { label: '收藏', onClick: () => this._showCollection() },
      { label: '成就', onClick: () => this._showAchievements() },
      { label: '排行榜', onClick: () => this.scene.start('Leaderboard') },
      { label: '设置', onClick: () => this._showSettings() },
      { label: '关于', onClick: () => this._showAbout() },
    ];
    btnList.forEach((b, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? startX + btnW / 2 : rightX + btnW / 2;
      const y = btnY0 + row * (btnH + gap);
      this._addButton(b.label, x, y, btnW, btnH, b.onClick, b.primary);
    });

    // 周目进度
    const cycleColor = completed ? '#69db7c' : '#ffd43b';
    const cycleText = completed ? '✦ 游戏已完结 ✦' : `第 ${cycle} 周目 · ${cycleSys.getCycleTitle()}`;
    this.add.text(W / 2, H * 0.9, cycleText, {
      fontFamily: 'sans-serif', fontSize: '20px', color: cycleColor, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, cycleColor, 10, true, true);
    this.add.text(W / 2, H * 0.94, `传承代数：${this.meta.totalDeaths || 0}`, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#868e96',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.975, 'v2.0 · 周目完整版', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#495057',
    }).setOrigin(0.5);
  }

  _showAchievements() {
    this.scene.start('Achievement');
  }

  _createParticles(W, H) {
    for (let i = 0; i < 40; i++) {
      const size = 1 + Math.random() * 2.5;
      const dot = this.add.circle(
        Math.random() * W, Math.random() * H,
        size, 0xffd43b, 0.25 + Math.random() * 0.3
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - 120 - Math.random() * 80,
        alpha: 0,
        duration: 4000 + Math.random() * 4000,
        repeat: -1,
        delay: Math.random() * 4000,
        onRepeat: () => { dot.y = H + 20; dot.alpha = 0.3 + Math.random() * 0.3; },
      });
    }
  }

  _addButton(text, x, y, w, h, onClick, primary = false) {
    const key = primary ? 'btn_primary' : 'btn_normal';
    if (primary) {
      makeButtonTexture(this, key, w, h, '#7a2a5a', '#3a1a3a', '#ff006e');
    } else {
      makeButtonTexture(this, key, w, h, '#2a2a4a', '#141428', '#ffd43b');
    }
    const container = this.add.container(x, y);
    const bg = this.add.image(0, 0, key).setDisplaySize(w, h);
    const txt = this.add.text(0, 0, text, {
      fontFamily: 'sans-serif', fontSize: '22px', color: primary ? '#fff' : '#f8f9fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    if (primary) txt.setShadow(0, 0, '#ff006e', 8, true, true);
    container.add([bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      this.tweens.add({ targets: bg, scaleX: 1.05, scaleY: 1.05, duration: 120 });
      this.tweens.add({ targets: txt, scaleX: 1.05, scaleY: 1.05, duration: 120 });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 120 });
      this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 120 });
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true });
      this.game.registry.get('audio')?.button();
      setTimeout(onClick, 150);
    });
    return container;
  }

  _startGame() {
    const cycleSys = new CycleSystem();
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
      fontFamily: 'sans-serif', fontSize: '32px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11).setShadow(0, 0, '#ffd43b', 12, true, true);
    const cols = 4;
    const cw = 120, ch = 56;
    unlocked.forEach((c, i) => {
      const x = W / 2 + (i % cols - (cols - 1) / 2) * (cw + 16);
      const y = H * 0.4 + Math.floor(i / cols) * (ch + 16);
      makeButtonTexture(this, `cycle_${c}`, cw, ch, '#2a2a4a', '#141428', '#cc5de8');
      const bg = this.add.image(x, y, `cycle_${c}`).setDisplaySize(cw, ch).setDepth(11);
      const txt = this.add.text(x, y, `第 ${c} 周目`, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#f8f9fa', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(11);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { bg.setScale(1.06); });
      bg.on('pointerout', () => { bg.setScale(1); });
      bg.on('pointerdown', () => {
        cycleSys.setCycle(c);
        overlay.destroy();
        this.scene.start(c === 1 ? 'OpeningNarrative' : 'CycleTransition');
      });
    });
    const cancel = this.add.text(W / 2, H * 0.82, '取消', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#868e96',
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setColor('#fa5252'));
    cancel.on('pointerout', () => cancel.setColor('#868e96'));
    cancel.on('pointerdown', () => { overlay.destroy(); this.scene.restart(); });
  }

  _showCodex() { this.scene.start('Codex'); }
  _showCollection() { this.scene.start('Collection'); }

  _showSettings() {
    const W = this.scale.width, H = this.scale.height;
    const objs = [];
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0);
    objs.push(bg);
    makeButtonTexture(this, 'panel', 560, 420, '#1a1a2e', '#0e0e1a', '#ffd43b');
    const panel = this.add.image(W / 2, H / 2, 'panel').setDisplaySize(560, 420);
    objs.push(panel);
    const title = this.add.text(W / 2, H / 2 - 170, '设置', {
      fontFamily: 'sans-serif', fontSize: '30px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ffd43b', 10, true, true);
    objs.push(title);

    const settings = SettingsManager.load();

    const bgmLabel = this.add.text(W / 2 - 200, H / 2 - 100, 'BGM 音量', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    objs.push(bgmLabel);
    const bgmVal = this.add.text(W / 2 + 180, H / 2 - 100, Math.round(settings.bgmVolume * 100) + '%', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    objs.push(bgmVal);
    const bgmMinus = this._makeBtn(W / 2 + 60, H / 2 - 100, '−', () => {
      settings.bgmVolume = Math.max(0, settings.bgmVolume - 0.1);
      SettingsManager.save(settings);
      bgmVal.setText(Math.round(settings.bgmVolume * 100) + '%');
      this.game.registry.get('audio')?.setBgmVolume(settings.bgmVolume);
    });
    const bgmPlus = this._makeBtn(W / 2 + 130, H / 2 - 100, '+', () => {
      settings.bgmVolume = Math.min(1, settings.bgmVolume + 0.1);
      SettingsManager.save(settings);
      bgmVal.setText(Math.round(settings.bgmVolume * 100) + '%');
      this.game.registry.get('audio')?.setBgmVolume(settings.bgmVolume);
    });
    objs.push(...bgmMinus, ...bgmPlus);

    const sfxLabel = this.add.text(W / 2 - 200, H / 2 - 30, '音效音量', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    objs.push(sfxLabel);
    const sfxVal = this.add.text(W / 2 + 180, H / 2 - 30, Math.round(settings.sfxVolume * 100) + '%', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    objs.push(sfxVal);
    const sfxMinus = this._makeBtn(W / 2 + 60, H / 2 - 30, '−', () => {
      settings.sfxVolume = Math.max(0, settings.sfxVolume - 0.1);
      SettingsManager.save(settings);
      sfxVal.setText(Math.round(settings.sfxVolume * 100) + '%');
      this.game.registry.get('audio')?.setSfxVolume(settings.sfxVolume);
    });
    const sfxPlus = this._makeBtn(W / 2 + 130, H / 2 - 30, '+', () => {
      settings.sfxVolume = Math.min(1, settings.sfxVolume + 0.1);
      SettingsManager.save(settings);
      sfxVal.setText(Math.round(settings.sfxVolume * 100) + '%');
      this.game.registry.get('audio')?.setSfxVolume(settings.sfxVolume);
    });
    objs.push(...sfxMinus, ...sfxPlus);

    const shakeLabel = this.add.text(W / 2 - 200, H / 2 + 40, '屏幕震动', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    objs.push(shakeLabel);
    const shakeBtn = this.add.rectangle(W / 2 + 110, H / 2 + 40, 140, 40, 0x2a2a4a, 0.9)
      .setStrokeStyle(1, 0x69db7c, 0.6);
    const shakeTxt = this.add.text(W / 2 + 110, H / 2 + 40, settings.screenShake ? '开' : '关', {
      fontFamily: 'sans-serif', fontSize: '20px', color: settings.screenShake ? '#69db7c' : '#fa5252', fontStyle: 'bold',
    }).setOrigin(0.5);
    objs.push(shakeBtn, shakeTxt);
    shakeBtn.setInteractive({ useHandCursor: true });
    shakeBtn.on('pointerdown', () => {
      settings.screenShake = !settings.screenShake;
      SettingsManager.save(settings);
      shakeTxt.setText(settings.screenShake ? '开' : '关');
      shakeTxt.setColor(settings.screenShake ? '#69db7c' : '#fa5252');
    });

    const closeBtn = this.add.rectangle(W / 2, H / 2 + 140, 140, 44, 0xfa5252, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.3);
    const closeTxt = this.add.text(W / 2, H / 2 + 140, '返回', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    objs.push(closeBtn, closeTxt);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => objs.forEach(o => o.destroy()));
  }

  _makeBtn(x, y, label, onClick) {
    const btn = this.add.rectangle(x, y, 40, 36, 0x2a2a4a, 0.9).setStrokeStyle(1, 0xffd43b, 0.5);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setFillStyle(0x3a3a5a, 0.95));
    btn.on('pointerout', () => btn.setFillStyle(0x2a2a4a, 0.9));
    btn.on('pointerdown', onClick);
    return [btn, txt];
  }

  _showAbout() { this.scene.start('About'); }
}

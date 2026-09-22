import Phaser from 'phaser';

// 生成圆角面板纹理（渐变+描边+发光）
function makePanelTexture(scene, key, w, h, colorTop, colorBottom, stroke) {
  if (scene.textures.exists(key)) return key;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = 8;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, colorTop);
  g.addColorStop(1, colorBottom);
  ctx.fillStyle = g;
  roundRectPath(ctx, 1, 1, w - 2, h - 2, r);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, 1, 1, w - 2, h - 2, r);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRectPath(ctx, 3, 3, w - 6, (h - 6) * 0.5, r - 2);
  ctx.fill();
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

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create(data) {
    this.pauseMode = data?.pause;
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;

    if (this.pauseMode) {
      this._createPauseOverlay();
      return;
    }

    // 左上信息面板
    makePanelTexture(this, 'hud_panel', 280, 100, 'rgba(20,20,40,0.85)', 'rgba(10,10,25,0.85)', 'rgba(255,212,59,0.4)');
    this.add.image(16, 16, 'hud_panel').setOrigin(0, 0).setDisplaySize(280, 100);

    // 右上房间信息面板
    makePanelTexture(this, 'hud_panel_r', 180, 60, 'rgba(20,20,40,0.85)', 'rgba(10,10,25,0.85)', 'rgba(170,176,255,0.4)');
    this.add.image(W - 16, 16, 'hud_panel_r').setOrigin(1, 0).setDisplaySize(180, 60);

    // 血量（带心形图标）
    this.hpText = this.add.text(28, 28, '', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#51cf66',
      fontStyle: 'bold',
    }).setShadow(0, 0, '#51cf66', 6, true, true);

    // 起义军信息
    this.rebelText = this.add.text(28, 58, '', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#cc5de8',
    });

    // 金币
    this.goldText = this.add.text(28, 82, '', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#ffd43b',
    });

    // 右上：房间 + 章节
    this.roomText = this.add.text(W - 28, 28, '', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#f8f9fa', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.chapterText = this.add.text(W - 28, 52, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#868e96',
    }).setOrigin(1, 0);

    // 左下：技能 + 特殊弹
    this.skillText = this.add.text(16, H - 24, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#74c0fc',
    });
    this.bulletText = this.add.text(16, H - 46, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ff006e', fontStyle: 'bold',
    });

    // 道具栏（3 格，右下）
    this.itemSlots = [];
    const slotSize = 52, slotGap = 10;
    const slotsTotalW = slotSize * 3 + slotGap * 2;
    const slotsStartX = W - 16 - slotsTotalW;
    for (let i = 0; i < 3; i++) {
      const sx = slotsStartX + i * (slotSize + slotGap);
      const sy = H - 16 - slotSize;
      makePanelTexture(this, `slot_${i}`, slotSize, slotSize, 'rgba(26,26,46,0.9)', 'rgba(14,14,30,0.9)', 'rgba(73,80,87,0.8)');
      const slot = this.add.container(sx, sy);
      const bg = this.add.image(0, 0, `slot_${i}`).setOrigin(0, 0).setDisplaySize(slotSize, slotSize);
      const keyLabel = this.add.text(slotSize / 2, -14, String(i + 1), {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#868e96',
      }).setOrigin(0.5);
      const nameLabel = this.add.text(slotSize / 2, slotSize / 2, '', {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#f8f9fa',
        align: 'center', wordWrap: { width: slotSize - 8 },
      }).setOrigin(0.5);
      slot.add([bg, keyLabel, nameLabel]);
      this.itemSlots.push({ bg, nameLabel, slotSize });
    }

    this.events.on('update', this._update, this);
  }

  _update() {
    const game = this.scene.get('Game');
    if (!game || !game.player) return;
    this.hpText.setText('❤ ' + game.player.hp + ' / ' + game.player.maxHp);
    const s = game.succession;
    if (s) {
      const gen = s.currentGen || 1;
      const gender = s.currentGender || '—';
      const name = s.currentName || '起义军';
      this.rebelText.setText('✦ 第 ' + gen + ' 任 · ' + name + '（' + gender + '）');
    }
    this.goldText.setText('◈ ' + (game.goldSys?.getGold() || 0) + ' 金币');
    const ch = game.roguelike?.getCurrentChapter();
    if (ch) {
      this.chapterText.setText(ch.id + ' · ' + ch.name);
    }
    this.roomText.setText('第 ' + ((game.roguelike?.currentRoom || 0) + 1) + ' 间');
    if (game.roguelike?.passiveSkill) {
      this.skillText.setText('被动：' + game.roguelike.passiveSkill.name);
    }
    if (game.roguelike?.specialBullet && game.roguelike.specialBullet !== 'normal') {
      this.bulletText.setText('特殊弹：' + game.roguelike.specialBullet + ' x' + game.roguelike.specialAmmo);
    } else {
      this.bulletText.setText('特殊弹：—');
    }
    const inv = game.itemSys?.inventory || [];
    this.itemSlots.forEach((slot, i) => {
      const item = inv[i];
      if (item) {
        slot.nameLabel.setText(item.id.slice(0, 4));
        slot.bg.setTexture('hud_panel_r'); // 复用金色面板表示已填充
      } else {
        slot.nameLabel.setText('');
        slot.bg.setTexture(`slot_${i}`);
      }
    });
  }

  _createPauseOverlay() {
    const W = this.scale.width, H = this.scale.height;
    const game = this.scene.get('Game');
    // 半透明遮罩 + 模糊感（深色渐变）
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x000000, 0x000000, 0x0a0515, 0x0a0515, 0.85);
    overlay.fillRect(0, 0, W, H);

    this.add.text(W / 2, H * 0.14, '暂停', {
      fontFamily: 'sans-serif', fontSize: '56px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ff006e', 16, true, true);

    if (game.runStartTime) {
      const elapsed = Math.floor((performance.now() - game.runStartTime) / 1000);
      const m = Math.floor(elapsed / 60), s = elapsed % 60;
      this.add.text(W / 2, H * 0.24, '存活时间：' + m + ':' + String(s).padStart(2, '0'), {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#adb5bd',
      }).setOrigin(0.5);
    }

    if (game.roguelike) {
      const ch = game.roguelike.getCurrentChapter();
      if (ch) {
        this.add.text(W / 2, H * 0.29, '当前阶段：' + ch.id + ' · ' + ch.name, {
          fontFamily: 'sans-serif', fontSize: '17px', color: '#868e96',
        }).setOrigin(0.5);
      }
    }

    if (game.itemSys && game.itemSys.inventory.length > 0) {
      let y = H * 0.36;
      this.add.text(W / 2, y, '已收集道具：', {
        fontFamily: 'sans-serif', fontSize: '17px', color: '#ffd43b', fontStyle: 'bold',
      }).setOrigin(0.5);
      y += 24;
      const itemText = game.itemSys.inventory.map(i => i.id).join('、');
      this.add.text(W / 2, y, itemText, {
        fontFamily: 'sans-serif', fontSize: '15px', color: '#dee2e6', wordWrap: { width: W * 0.8 },
      }).setOrigin(0.5);
    }

    this._addButton('继续', W / 2, H * 0.52, () => {
      const game = this.scene.get('Game');
      game.paused = false;
      this.scene.stop('UIScene');
      this.scene.resume('Game');
      this.scene.launch('UIScene');
    });
    this._addButton('返回主菜单', W / 2, H * 0.62, () => {
      this.scene.stop('Game');
      this.scene.stop('UIScene');
      this.scene.start('Menu');
    });
  }

  _addButton(text, x, y, onClick) {
    const w = 260, h = 48;
    // 复用 MenuScene 的按钮纹理生成逻辑
    const key = 'ui_btn';
    if (!this.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const r = 10;
      ctx.save();
      ctx.shadowColor = '#ffd43b';
      ctx.shadowBlur = 14;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2a2a4a');
      g.addColorStop(1, '#141428');
      ctx.fillStyle = g;
      roundRectPath(ctx, 2, 2, w - 4, h - 4, r);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRectPath(ctx, 4, 4, w - 8, (h - 8) * 0.45, r);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,212,59,0.6)';
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, 2, 2, w - 4, h - 4, r);
      ctx.stroke();
      this.textures.addCanvas(key, canvas);
    }
    const bg = this.add.image(x, y, key).setDisplaySize(w, h);
    const txt = this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#f8f9fa', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => { bg.setScale(1.04); });
    bg.on('pointerout', () => { bg.setScale(1); });
    bg.on('pointerdown', () => onClick());
  }
}

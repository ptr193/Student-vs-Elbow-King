import Phaser from 'phaser';

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

    // HUD
    this.hpText = this.add.text(20, 20, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#51cf66',
      fontStyle: 'bold',
    });
    this.rebelText = this.add.text(20, 46, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#cc5de8',
    });
    this.goldText = this.add.text(20, 66, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ffd43b',
    });
    this.roomText = this.add.text(W - 20, 20, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#adb5bd',
    }).setOrigin(1, 0);
    this.chapterText = this.add.text(W - 20, 40, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#868e96',
    }).setOrigin(1, 0);
    this.skillText = this.add.text(20, H - 30, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#74c0fc',
    });
    this.bulletText = this.add.text(20, H - 50, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ff006e',
    });
    // 道具栏（3 格）
    this.itemSlots = [];
    for (let i = 0; i < 3; i++) {
      const slot = this.add.container(W - 180 + i * 60, H - 40);
      const bg = this.add.rectangle(0, 0, 48, 48, 0x1a1a2e, 0.8)
        .setStrokeStyle(2, 0x495057, 0.6);
      const keyLabel = this.add.text(0, -32, String(i + 1), {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#868e96',
      }).setOrigin(0.5);
      const nameLabel = this.add.text(0, 0, '', {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#f8f9fa',
        align: 'center', wordWrap: { width: 40 },
      }).setOrigin(0.5);
      slot.add([bg, keyLabel, nameLabel]);
      this.itemSlots.push({ bg, nameLabel });
    }

    this.events.on('update', this._update, this);
  }

  _update() {
    const game = this.scene.get('Game');
    if (!game || !game.player) return;
    this.hpText.setText('❤ ' + game.player.hp + ' / ' + game.player.maxHp);
    // 起义军编号 + 性别 + 金币
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
    // 道具栏
    const inv = game.itemSys?.inventory || [];
    this.itemSlots.forEach((slot, i) => {
      const item = inv[i];
      if (item) {
        slot.nameLabel.setText(item.id.slice(0, 4));
        slot.bg.setStrokeStyle(2, 0xffd43b, 0.8);
      } else {
        slot.nameLabel.setText('');
        slot.bg.setStrokeStyle(2, 0x495057, 0.6);
      }
    });
  }

  _createPauseOverlay() {
    const W = this.scale.width, H = this.scale.height;
    const game = this.scene.get('Game');
    this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0, 0);
    this.add.text(W / 2, H * 0.12, '暂停', {
      fontFamily: 'sans-serif', fontSize: '48px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 存活时间
    if (game.runStartTime) {
      const elapsed = Math.floor((performance.now() - game.runStartTime) / 1000);
      const m = Math.floor(elapsed / 60), s = elapsed % 60;
      this.add.text(W / 2, H * 0.22, '存活时间：' + m + ':' + String(s).padStart(2, '0'), {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd',
      }).setOrigin(0.5);
    }

    // 当前阶段
    if (game.roguelike) {
      const ch = game.roguelike.getCurrentChapter();
      if (ch) {
        this.add.text(W / 2, H * 0.27, '当前阶段：' + ch.id + ' · ' + ch.name, {
          fontFamily: 'sans-serif', fontSize: '16px', color: '#868e96',
        }).setOrigin(0.5);
      }
    }

    // 已收集道具
    if (game.itemSys && game.itemSys.inventory.length > 0) {
      let y = H * 0.33;
      this.add.text(W / 2, y, '已收集道具：', {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd43b',
      }).setOrigin(0.5);
      y += 20;
      const itemText = game.itemSys.inventory.map(i => i.id).join('、');
      this.add.text(W / 2, y, itemText, {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#dee2e6', wordWrap: { width: W * 0.8 },
      }).setOrigin(0.5);
    }

    this._addButton('继续', W / 2, H * 0.5, () => {
      const game = this.scene.get('Game');
      game.paused = false;
      this.scene.stop('UIScene');
      this.scene.resume('Game');
      this.scene.launch('UIScene');
    });
    this._addButton('设置', W / 2, H * 0.6, () => {});
    this._addButton('返回主菜单', W / 2, H * 0.7, () => {
      this.scene.stop('Game');
      this.scene.stop('UIScene');
      this.scene.start('Menu');
    });
  }

  _addButton(text, x, y, onClick) {
    const bg = this.add.rectangle(x, y, 260, 46, 0x2a1a3a, 0.9)
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

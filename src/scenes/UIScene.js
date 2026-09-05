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
    this.goldText = this.add.text(20, 48, '', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd43b',
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
    this.goldText.setText('◈ ' + game.goldSys.getGold());
    const ch = game.roguelike?.getCurrentChapter();
    if (ch) {
      this.chapterText.setText(ch.id + ' · ' + ch.name);
    }
    this.roomText.setText('第 ' + (game.roguelike?.currentRoom + 1) + ' 间');
    if (game.roguelike?.passiveSkill) {
      this.skillText.setText('被动：' + game.roguelike.passiveSkill.name);
    }
    if (game.roguelike?.specialBullet) {
      this.bulletText.setText('特殊弹：' + game.roguelike.specialBullet + ' x' + game.roguelike.specialAmmo);
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
    this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0, 0);
    this.add.text(W / 2, H * 0.3, '暂停', {
      fontFamily: 'sans-serif', fontSize: '48px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);
    this._addButton('继续', W / 2, H * 0.45, () => {
      const game = this.scene.get('Game');
      game.paused = false;
      this.scene.stop('UIScene');
      this.scene.resume('Game');
      this.scene.launch('UIScene');
    });
    this._addButton('设置', W / 2, H * 0.55, () => {});
    this._addButton('返回主菜单', W / 2, H * 0.65, () => {
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

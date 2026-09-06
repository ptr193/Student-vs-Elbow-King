import Phaser from 'phaser';
import { CodexSystem } from '../systems/CodexSystem.js';
import itemsData from '../config/items.json';

export class CodexScene extends Phaser.Scene {
  constructor() { super('Codex'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    this.codex = CodexSystem.load();
    this.tab = 'bosses';
    this.scrollY = 0;

    this.add.text(W / 2, 30, '图鉴', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 标签栏
    this.tabs = [
      { key: 'bosses', label: 'BOSS' },
      { key: 'items', label: '道具' },
      { key: 'enemies', label: '敌人' },
      { key: 'npcs', label: 'NPC' },
    ];
    this.tabBtns = [];
    this.tabs.forEach((t, i) => {
      const x = W * 0.2 + i * (W * 0.2);
      const btn = this.add.rectangle(x, 70, W * 0.16, 36, 0x2a1a3a, 0.9)
        .setStrokeStyle(1, 0xffd43b, 0.4);
      const txt = this.add.text(x, 70, t.label + ' (' + Object.keys(this.codex[t.key] || {}).length + ')', {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#dee2e6',
      }).setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.tab = t.key;
        this._refreshTabStyle();
        this._renderContent();
      });
      this.tabBtns.push({ btn, txt, key: t.key });
    });

    this.contentContainer = this.add.container(0, 0);

    this._refreshTabStyle();
    this._renderContent();

    // 返回按钮
    this._addButton('返回', W - 70, H - 30, 100, () => {
      this.scene.start('Menu');
    });

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }

  _refreshTabStyle() {
    this.tabBtns.forEach(t => {
      if (t.key === this.tab) {
        t.btn.setFillStyle(0x4a3a5a, 1);
        t.btn.setStrokeStyle(2, 0xffd43b, 1);
      } else {
        t.btn.setFillStyle(0x2a1a3a, 0.9);
        t.btn.setStrokeStyle(1, 0xffd43b, 0.4);
      }
    });
  }

  _renderContent() {
    this.contentContainer.removeAll(true);
    const W = this.scale.width, H = this.scale.height;
    const entries = this.codex[this.tab] || {};
    const keys = Object.keys(entries);

    if (keys.length === 0) {
      const empty = this.add.text(W / 2, H / 2, '暂无记录\n继续探索以解锁图鉴', {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#868e96', align: 'center',
      }).setOrigin(0.5);
      this.contentContainer.add(empty);
      return;
    }

    let y = 120;
    keys.forEach(key => {
      const entry = entries[key];
      // 条目背景
      const bg = this.add.rectangle(W / 2, y, W * 0.8, 60, 0x1a1a2e, 0.8)
        .setStrokeStyle(1, 0x495057, 0.5);
      this.contentContainer.add(bg);
      // 名称
      const name = this.add.text(W * 0.15, y - 15, entry.name || key, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd43b', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.contentContainer.add(name);
      // 描述
      const desc = this.add.text(W * 0.15, y + 10, entry.lore || entry.desc || entry.dialogue || '', {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#adb5bd', wordWrap: { width: W * 0.7 },
      }).setOrigin(0, 0.5);
      this.contentContainer.add(desc);
      y += 72;
    });
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

import Phaser from 'phaser';
import { MetaManager } from '../systems/SettingsManager.js';
import { CodexSystem } from '../systems/CodexSystem.js';
import itemsData from '../config/items.json';
import skillsData from '../config/skills.json';

// 收藏页面（规格 3.9/9.1/4.10）：展示 Meta 解锁进度
// - 道具图鉴（来自 codex.items，默认全可见，已获得的标注）
// - 被动技能解锁（来自 meta.unlockedSkills）
// - 特殊子弹解锁（来自 meta.unlockedItems，由 SkillSystem 写入子弹 ID）
// - 诗句收藏数（来自 meta.poemCount）
export class CollectionScene extends Phaser.Scene {
  constructor() { super('Collection'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    this.meta = MetaManager.load();
    this.codex = CodexSystem.load();
    this.tab = 'items';
    this.scrollY = 0;

    this.add.text(W / 2, 30, '收藏', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 顶部总进度
    this._drawStats(W, H);

    // 标签栏
    this.tabs = [
      { key: 'items', label: '道具' },
      { key: 'skills', label: '技能' },
      { key: 'bullets', label: '子弹' },
      { key: 'poems', label: '诗句' },
    ];
    this.tabBtns = [];
    this.tabs.forEach((t, i) => {
      const x = W * 0.2 + i * (W * 0.2);
      const btn = this.add.rectangle(x, 120, W * 0.16, 36, 0x2a1a3a, 0.9)
        .setStrokeStyle(1, 0xffd43b, 0.4);
      const count = this._getCount(t.key);
      const total = this._getTotal(t.key);
      const txt = this.add.text(x, 120, `${t.label} ${count}/${total}`, {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#dee2e6',
      }).setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.tab = t.key;
        this.scrollY = 0;
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

    // 滚轮滚动
    this.input.on('wheel', (pointer, gs, dsx, dsy) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dsy * 0.5, 0, Math.max(0, this._contentHeight - (H - 200)));
      this.contentContainer.y = -this.scrollY;
    });
  }

  _getCount(key) {
    if (key === 'items') return Object.keys(this.codex.items || {}).length;
    if (key === 'skills') return (this.meta.unlockedSkills || []).length;
    if (key === 'bullets') return (this.meta.unlockedItems || []).filter(id =>
      skillsData.bullets.some(b => b.id === id)
    ).length;
    if (key === 'poems') return this.meta.poemCount || 0;
    return 0;
  }

  _getTotal(key) {
    if (key === 'items') return itemsData.length;
    if (key === 'skills') return skillsData.passive.length;
    if (key === 'bullets') return skillsData.bullets.length;
    if (key === 'poems') return 0; // 诗句无固定总数
    return 0;
  }

  _drawStats(W, H) {
    const stats = [
      { label: '传承代数', value: this.meta.totalDeaths || 0, color: '#ffd43b' },
      { label: '已背诵诗句', value: this.meta.poemCount || 0, color: '#aab0ff' },
      { label: '击败 BOSS', value: Object.keys(this.codex.bosses || {}).length, color: '#fa5252' },
      { label: '图鉴完成', value: Object.keys(this.codex.enemies || {}).length + Object.keys(this.codex.npcs || {}).length, color: '#69db7c' },
    ];
    const sw = W * 0.22;
    stats.forEach((s, i) => {
      const x = W * 0.12 + i * sw;
      const box = this.add.rectangle(x, 80, sw - 10, 56, 0x1a1a2e, 0.8)
        .setStrokeStyle(1, 0x495057, 0.4);
      this.add.text(x, 66, s.label, {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#868e96',
      }).setOrigin(0.5);
      this.add.text(x, 88, String(s.value), {
        fontFamily: 'sans-serif', fontSize: '22px', color: s.color, fontStyle: 'bold',
      }).setOrigin(0.5);
    });
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
    const W = this.scale.width;
    let y = 180;

    const addEntry = (name, desc, color, unlocked, extra) => {
      const bg = this.add.rectangle(W / 2, y, W * 0.85, 64, unlocked ? 0x1a1a2e : 0x0e0e18, 0.9)
        .setStrokeStyle(1, unlocked ? 0x495057 : 0x212529, 0.6);
      this.contentContainer.add(bg);
      // 名称
      const nameColor = unlocked ? color : '#495057';
      const n = this.add.text(W * 0.15, y - 14, unlocked ? name : '????', {
        fontFamily: 'sans-serif', fontSize: '18px', color: nameColor, fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.contentContainer.add(n);
      // 描述
      const d = this.add.text(W * 0.15, y + 12, unlocked ? desc : '继续探索以解锁', {
        fontFamily: 'sans-serif', fontSize: '13px', color: unlocked ? '#adb5bd' : '#495057',
        wordWrap: { width: W * 0.65 },
      }).setOrigin(0, 0.5);
      this.contentContainer.add(d);
      // 额外标记（稀有度 / 已获得）
      if (extra) {
        const e = this.add.text(W * 0.85, y, extra, {
          fontFamily: 'sans-serif', fontSize: '12px', color: unlocked ? '#ffd43b' : '#495057',
        }).setOrigin(1, 0.5);
        this.contentContainer.add(e);
      }
      y += 72;
    };

    if (this.tab === 'items') {
      itemsData.forEach(item => {
        const got = !!this.codex.items[item.id];
        addEntry(item.name, item.desc, item.color || '#adb5bd', got, item.rarity);
      });
    } else if (this.tab === 'skills') {
      skillsData.passive.forEach(s => {
        const unlocked = (this.meta.unlockedSkills || []).includes(s.id);
        addEntry(s.name, s.desc, '#aab0ff', unlocked, '被动');
      });
    } else if (this.tab === 'bullets') {
      const unlockedBullets = this.meta.unlockedItems || [];
      skillsData.bullets.forEach(b => {
        const unlocked = unlockedBullets.includes(b.id);
        addEntry(b.name, b.desc, '#ffd43b', unlocked, `弹药${b.ammo}`);
      });
    } else if (this.tab === 'poems') {
      const count = this.meta.poemCount || 0;
      const box = this.add.rectangle(W / 2, y + 30, W * 0.7, 120, 0x1a1a2e, 0.9)
        .setStrokeStyle(1, 0x495057, 0.4);
      const label = this.add.text(W / 2, y + 10, '已背诵诗句', {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#adb5bd',
      }).setOrigin(0.5);
      const num = this.add.text(W / 2, y + 60, String(count), {
        fontFamily: 'sans-serif', fontSize: '48px', color: '#aab0ff', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hint = this.add.text(W / 2, y + 100, '在「读卡机」小 BOSS 战中答对诗句即可收录', {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#868e96',
      }).setOrigin(0.5);
      this.contentContainer.add([box, label, num, hint]);
      y += 160;
    }

    this._contentHeight = y;
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

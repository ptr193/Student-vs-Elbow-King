import Phaser from 'phaser';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { MetaManager } from '../systems/SettingsManager.js';

// 武器选择场景（规格 5.5）：每局开始时选择基础武器
export class WeaponSelectScene extends Phaser.Scene {
  constructor() { super('WeaponSelect'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');
    this.weaponSys = new WeaponSystem();

    this.add.text(W / 2, 50, '选择武器', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, 90, '每局开始可选择一把基础武器，影响射击模式', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#adb5bd',
    }).setOrigin(0.5);

    const weapons = this.weaponSys.getAll();
    const cardW = (W * 0.9) / weapons.length - 12;
    const cardH = 180;

    weapons.forEach((w, i) => {
      const x = W * 0.05 + i * (cardW + 12) + cardW / 2;
      const y = H * 0.45;
      const bg = this.add.rectangle(x, y, cardW, cardH, 0x1a1a2e, 0.9)
        .setStrokeStyle(2, 0x495057, 0.5);
      const name = this.add.text(x, y - 60, w.name, {
        fontFamily: 'sans-serif', fontSize: '22px', color: '#ffd43b', fontStyle: 'bold',
      }).setOrigin(0.5);
      const mode = this.add.text(x, y - 20, this._modeLabel(w.mode), {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#69db7c',
      }).setOrigin(0.5);
      const desc = this.add.text(x, y + 10, w.desc, {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#adb5bd', align: 'center',
        wordWrap: { width: cardW - 20 },
      }).setOrigin(0.5);
      const stats = this.add.text(x, y + 55,
        `伤害 ${w.damage} · 射速 ${(1 / w.fireRate).toFixed(1)}x · 弹数 ${w.bulletCount}`, {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#868e96',
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setStrokeStyle(2, 0xffd43b, 1));
      bg.on('pointerout', () => bg.setStrokeStyle(2, 0x495057, 0.5));
      bg.on('pointerdown', () => {
        this.weaponSys.select(w.id);
        // 保存到 meta 供 GameScene 读取
        const meta = MetaManager.load();
        meta.selectedWeapon = w.id;
        MetaManager.save(meta);
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
      });
    });
  }

  _modeLabel(mode) {
    const map = { single: '单发', spread: '散射', rapid: '连发', pierce: '穿透', explosive: '爆炸' };
    return map[mode] || mode;
  }
}

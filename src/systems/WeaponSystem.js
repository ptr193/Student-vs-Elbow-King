import weaponsData from '../config/weapons.json';

// 武器系统（规格 5.5）：管理基础武器选择与射击模式
export class WeaponSystem {
  constructor() {
    this.weapons = weaponsData;
    this.current = weaponsData[0]; // 默认手枪
  }

  getAll() {
    return this.weapons;
  }

  select(id) {
    const w = this.weapons.find(w => w.id === id);
    if (w) this.current = w;
    return this.current;
  }

  getCurrent() {
    return this.current;
  }

  // 根据武器模式生成子弹参数
  getBulletParams() {
    const w = this.current;
    return {
      damage: w.damage,
      count: w.bulletCount,
      spread: w.spread,
      fireRateMult: w.fireRate,
      pierce: w.mode === 'pierce',
      explosive: w.mode === 'explosive',
    };
  }
}

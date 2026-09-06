// 技能池抽取/装备/效果系统
// 管理被动技能池抽取、装备、特殊子弹解锁与切换
import skillsData from '../config/skills.json';
import { MetaManager } from './SettingsManager.js';

export class SkillSystem {
  constructor(roguelike) {
    this.roguelike = roguelike;
    this.passivePool = skillsData.passive;
    this.bulletPool = skillsData.bullets;
    this.equipped = null;       // 当前装备的被动技能
    this.unlockedBullets = ['normal']; // 已解锁的特殊子弹 ID 列表
    this.activeBullet = 'normal';
    this.activeAmmo = 0;
    this.hasFaith = false;
  }

  // 本局开始时抽取一个随机被动技能
  rollPassive() {
    const idx = Math.floor(Math.random() * this.passivePool.length);
    this.equipped = { ...this.passivePool[idx] };
    this._recordUnlock('skill', this.equipped.id);
    return this.equipped;
  }

  // 装备指定被动技能（用于传承继承）
  equipPassive(skill) {
    if (!skill) return;
    this.equipped = { ...skill };
  }

  // 解锁一种特殊子弹并补充弹药
  unlockBullet(id, ammo) {
    if (!this.unlockedBullets.includes(id)) {
      this.unlockedBullets.push(id);
    }
    this.activeBullet = id;
    this.activeAmmo = ammo;
    this._recordUnlock('bullet', id);
  }

  // 在已解锁的特殊子弹间循环切换；弹药为 0 自动跳过
  cycleBullet() {
    if (this.unlockedBullets.length <= 1) return null;
    const usable = this.unlockedBullets.filter(b => b === 'normal' || this.activeAmmo > 0 || b === this.activeBullet);
    const list = this.unlockedBullets;
    const idx = list.indexOf(this.activeBullet);
    const next = list[(idx + 1) % list.length];
    this.activeBullet = next;
    return this.getBulletDef(next);
  }

  getBulletDef(id) {
    return this.bulletPool.find(b => b.id === id) || { id, name: id, damage: 1, ammo: 0 };
  }

  // 当前是否使用特殊子弹
  isSpecialActive() {
    return this.activeBullet !== 'normal' && this.activeAmmo > 0;
  }

  // 消耗一发特殊子弹弹药；用尽自动切回普通弹
  consumeAmmo() {
    if (this.activeBullet === 'normal') return;
    this.activeAmmo--;
    if (this.activeAmmo <= 0) {
      this.activeBullet = 'normal';
      return true; // 表示用尽切回
    }
    return false;
  }

  // 获得"信念"道具：攻击翻倍，传承时保留，三败计数清零
  grantFaith() {
    this.hasFaith = true;
    const meta = MetaManager.load();
    meta.hasFaith = true;
    meta.threeDefeatCount = 0;
    MetaManager.save(meta);
  }

  // 传承快照
  snapshot() {
    return {
      equipped: this.equipped ? { ...this.equipped } : null,
      unlockedBullets: [...this.unlockedBullets],
      activeBullet: this.activeBullet,
      activeAmmo: this.activeAmmo,
      hasFaith: this.hasFaith,
    };
  }

  // 从传承数据恢复
  applySnapshot(data) {
    if (!data) return;
    if (data.equipped) this.equipPassive(data.equipped);
    if (data.unlockedBullets) this.unlockedBullets = [...data.unlockedBullets];
    if (data.activeBullet) this.activeBullet = data.activeBullet;
    if (data.activeAmmo) this.activeAmmo = data.activeAmmo;
    if (data.hasFaith) this.hasFaith = true;
  }

  _recordUnlock(kind, id) {
    const meta = MetaManager.load();
    const list = kind === 'skill' ? (meta.unlockedSkills = meta.unlockedSkills || []) : (meta.unlockedItems = meta.unlockedItems || []);
    if (!list.includes(id)) list.push(id);
    MetaManager.save(meta);
  }
}

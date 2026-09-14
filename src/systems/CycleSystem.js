import cycleConfig from '../config/cycle_config.json';
import { MetaManager } from './SettingsManager.js';

// 周目系统（规格 6.1）：管理 1-8 周目的解锁、固定主角、血条封锁、难度/装备递增
export class CycleSystem {
  constructor() {
    this.meta = MetaManager.load();
    // 确保 cycle 字段存在
    if (typeof this.meta.cycle !== 'number') this.meta.cycle = 1;
    if (typeof this.meta.cycleCompleted !== 'boolean') this.meta.cycleCompleted = false;
    if (!Array.isArray(this.meta.unlockedCycles)) this.meta.unlockedCycles = [1];
    MetaManager.save(this.meta);
  }

  // 当前周目数（1-8）
  getCurrentCycle() {
    return Math.min(Math.max(this.meta.cycle || 1, 1), 8);
  }

  // 获取当前周目的配置
  getConfig() {
    const cycle = this.getCurrentCycle();
    return cycleConfig.cycles.find(c => c.cycle === cycle) || cycleConfig.cycles[0];
  }

  // 是否为固定主角（2-8 周目）
  isFixedProtagonist() {
    return this.getConfig().fixedProtagonist === true;
  }

  // 主角显示名（2-8 周目固定为"起义军"）
  getProtagonistName() {
    return this.getConfig().protagonistName || '';
  }

  // 主角性别（2-8 周目固定男）
  getProtagonistGender() {
    return this.getConfig().protagonistGender || '';
  }

  // 血条是否封锁（2-8 周目）
  isHpLocked() {
    return this.getConfig().hpLock === true;
  }

  // 血条封锁比例（0.5 = 封锁一半）
  getHpLockRatio() {
    return this.getConfig().hpLockRatio || 1.0;
  }

  // 敌人血量倍率
  getEnemyHpMult() {
    return this.getConfig().enemyHpMult || 1.0;
  }

  // 敌人攻击倍率
  getEnemyAtkMult() {
    return this.getConfig().enemyAtkMult || 1.0;
  }

  // BOSS 血量倍率
  getBossHpMult() {
    return this.getConfig().bossHpMult || 1.0;
  }

  // BOSS 攻击倍率
  getBossAtkMult() {
    return this.getConfig().bossAtkMult || 1.0;
  }

  // 怪物密度
  getEnemyDensity() {
    return this.getConfig().enemyDensity || 'normal';
  }

  // 当前周目的特殊事件
  getSpecialEvent() {
    return this.getConfig().specialEvent || null;
  }

  // 色调偏移（2/4/8 周目有特殊色调）
  getColorTint() {
    return this.getConfig().colorTint || null;
  }

  // 周目标题
  getCycleTitle() {
    return this.getConfig().title || '';
  }

  // 周目引言
  getCycleIntro() {
    return this.getConfig().intro || '';
  }

  // 通关当前周目：递增周目数，解锁下一周目
  advanceCycle() {
    const current = this.getCurrentCycle();
    if (current >= 8) {
      // 8 周目通关 → 游戏完结
      this.meta.cycleCompleted = true;
      this.meta.cycle = 8;
    } else {
      this.meta.cycle = current + 1;
      if (!this.meta.unlockedCycles.includes(current + 1)) {
        this.meta.unlockedCycles.push(current + 1);
      }
    }
    MetaManager.save(this.meta);
    return this.meta.cycle;
  }

  // 游戏是否已完结（8 周目通关）
  isGameCompleted() {
    return !!this.meta.cycleCompleted;
  }

  // 已解锁的周目列表
  getUnlockedCycles() {
    return this.meta.unlockedCycles || [1];
  }

  // 设置周目（完结后自由选择）
  setCycle(cycle) {
    if (this.getUnlockedCycles().includes(cycle) || cycle === 1) {
      this.meta.cycle = cycle;
      MetaManager.save(this.meta);
    }
  }

  // 重置为新游戏（1 周目）
  resetToNewGame() {
    this.meta.cycle = 1;
    this.meta.cycleCompleted = false;
    this.meta.unlockedCycles = [1];
    MetaManager.save(this.meta);
  }
}

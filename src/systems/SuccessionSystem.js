import names from '../data/names.json';
import { MetaManager } from './SettingsManager.js';

export class SuccessionSystem {
  constructor() {
    this.meta = MetaManager.load();
    this.currentGen = 1;
    this.currentName = '';
    this.currentGender = '';
    this._rollNewCharacter();
  }

  _rollNewCharacter() {
    const gender = Math.random() < 0.5 ? '男' : '女';
    const pool = gender === '男' ? names.male : names.female;
    this.currentGender = gender;
    this.currentName = pool[Math.floor(Math.random() * pool.length)];
  }

  getDisplay() {
    return `第 ${this.currentGen} 任起义军：${this.currentName}（${this.currentGender}）`;
  }

  // 死亡：保存当前装备快照，生成下一任
  onDeath(playerState) {
    this.meta.totalDeaths = (this.meta.totalDeaths || 0) + 1;
    this.meta.successionData = {
      items: playerState.items || [],
      gold: playerState.gold || 0,
      skills: playerState.skills || null,
      specialBullet: playerState.specialBullet || 'normal',
      specialAmmo: playerState.specialAmmo || 0,
      hasFaith: playerState.hasFaith || false,
      deathChapter: playerState.chapterIdx || 0,
      deathRoom: playerState.roomIdx || 0,
    };
    MetaManager.save(this.meta);
    this.currentGen++;
    this._rollNewCharacter();
    return this.meta.successionData;
  }

  // 新任到达上一任死亡点，继承装备
  inherit() {
    const data = this.meta.successionData;
    this.meta.successionData = null;
    MetaManager.save(this.meta);
    return data;
  }

  hasSuccessionPending() {
    return !!this.meta.successionData;
  }
}

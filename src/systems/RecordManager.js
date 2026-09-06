import { MetaManager } from './SettingsManager.js';

// 本地记录管理：最佳通关时间、总传承代数、总背诵诗句数、图鉴完成度
export class RecordManager {
  static load() {
    const meta = MetaManager.load();
    return meta.records || {
      bestClearTime: null,
      totalDeaths: 0,
      totalPoemsRecited: 0,
      totalVictories: 0,
      codexCompletion: 0,
      playTime: 0,
    };
  }

  static save(records) {
    const meta = MetaManager.load();
    meta.records = records;
    MetaManager.save(meta);
  }

  static recordDeath() {
    const r = RecordManager.load();
    r.totalDeaths = (r.totalDeaths || 0) + 1;
    RecordManager.save(r);
  }

  static recordVictory(clearTimeMs) {
    const r = RecordManager.load();
    r.totalVictories = (r.totalVictories || 0) + 1;
    if (!r.bestClearTime || clearTimeMs < r.bestClearTime) {
      r.bestClearTime = clearTimeMs;
    }
    RecordManager.save(r);
  }

  static recordPoem() {
    const r = RecordManager.load();
    r.totalPoemsRecited = (r.totalPoemsRecited || 0) + 1;
    RecordManager.save(r);
  }

  static addPlayTime(ms) {
    const r = RecordManager.load();
    r.playTime = (r.playTime || 0) + ms;
    RecordManager.save(r);
  }

  static getStats() {
    return RecordManager.load();
  }

  static formatTime(ms) {
    if (!ms) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  }
}

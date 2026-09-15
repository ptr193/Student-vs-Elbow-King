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

  static recordVictory(clearTimeMs, cycle = 1) {
    const r = RecordManager.load();
    r.totalVictories = (r.totalVictories || 0) + 1;
    if (!r.bestClearTime || clearTimeMs < r.bestClearTime) {
      r.bestClearTime = clearTimeMs;
    }
    // 排行榜：速通 Top 10 + 最低死亡数 Top 10
    r.leaderboard = r.leaderboard || { speedrun: [], leastDeaths: [] };
    const entry = { time: clearTimeMs, cycle, date: Date.now(), deaths: r.totalDeaths || 0 };
    r.leaderboard.speedrun.push(entry);
    r.leaderboard.speedrun.sort((a, b) => a.time - b.time);
    r.leaderboard.speedrun = r.leaderboard.speedrun.slice(0, 10);
    const deathEntry = { deaths: r.totalDeaths || 0, time: clearTimeMs, cycle, date: Date.now() };
    r.leaderboard.leastDeaths.push(deathEntry);
    r.leaderboard.leastDeaths.sort((a, b) => a.deaths - b.deaths);
    r.leaderboard.leastDeaths = r.leaderboard.leastDeaths.slice(0, 10);
    RecordManager.save(r);
  }

  static getLeaderboard() {
    const r = RecordManager.load();
    return r.leaderboard || { speedrun: [], leastDeaths: [] };
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

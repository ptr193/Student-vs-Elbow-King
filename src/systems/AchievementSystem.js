import achievementsDef from '../data/achievements.json';
import { MetaManager } from './SettingsManager.js';

// 成就系统（规格 5.6）：20 个成就，解锁时弹窗提示
export class AchievementSystem {
  // 检查并解锁成就，返回新解锁的成就列表
  static checkAndUnlock() {
    const meta = MetaManager.load();
    const unlocked = meta.achievements || [];
    const newlyUnlocked = [];

    const has = (id) => unlocked.includes(id);
    const grant = (id) => {
      if (!has(id)) {
        unlocked.push(id);
        newlyUnlocked.push(id);
      }
    };

    // 首胜
    if (meta.defeatedBosses?.includes('zjw') || meta.cycleCompleted) grant('first_victory');
    // 击败各 BOSS
    (meta.defeatedBosses || []).forEach(b => {
      if (b === 'reader') grant('kill_reader');
      if (b === 'timer') grant('kill_timer');
      if (b === 'chalkboard') grant('kill_chalkboard');
      if (b === 'ranking') grant('kill_ranking');
      if (b === 'bulletin') grant('kill_bulletin');
      if (b === 'tribunal') grant('kill_tribunal');
    });
    // 诗句
    const pc = meta.poemCount || 0;
    if (pc >= 10) grant('poet_10');
    if (pc >= 50) grant('poet_50');
    if (pc >= 100) grant('poet_100');
    // 死亡
    const deaths = meta.totalDeaths || 0;
    if (deaths >= 10) grant('death_10');
    if (deaths >= 50) grant('death_50');
    // 道具收集
    const items = Object.keys(meta.codex?.items || {});
    if (items.length >= 10) grant('collect_10');
    if (items.length >= 9) grant('collect_all');
    // 周目
    const cycle = meta.cycle || 1;
    if (cycle >= 2) grant('cycle_2');
    if (cycle >= 8) grant('cycle_8');
    if (meta.cycleCompleted) grant('game_complete');
    // NPC
    const npcs = Object.keys(meta.codex?.npcs || {});
    if (npcs.length >= 5) grant('npc_all');

    meta.achievements = unlocked;
    MetaManager.save(meta);
    return newlyUnlocked.map(id => achievementsDef.find(a => a.id === id)).filter(Boolean);
  }

  static getAll() {
    return achievementsDef;
  }

  static getUnlocked() {
    return MetaManager.load().achievements || [];
  }

  // 在场景中显示成就解锁弹窗
  static showToast(scene, achievement) {
    if (!scene || !achievement) return;
    const W = scene.scale.width;
    const toast = scene.add.container(W / 2, 60);
    const bg = scene.add.rectangle(0, 0, 360, 56, 0x141628, 0.95)
      .setStrokeStyle(2, 0xffd43b, 0.8);
    const icon = scene.add.text(-150, 0, achievement.icon || '★', {
      fontFamily: 'sans-serif', fontSize: '24px',
    }).setOrigin(0, 0.5);
    const title = scene.add.text(-110, -12, '成就解锁！' + achievement.name, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const desc = scene.add.text(-110, 12, achievement.desc, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#adb5bd',
    }).setOrigin(0, 0.5);
    toast.add([bg, icon, title, desc]);
    toast.setAlpha(0);
    scene.tweens.add({
      targets: toast, alpha: 1, y: 80, duration: 500,
      onComplete: () => {
        scene.time.delayedCall(2500, () => {
          scene.tweens.add({
            targets: toast, alpha: 0, y: 60, duration: 500,
            onComplete: () => toast.destroy(),
          });
        });
      },
    });
  }
}

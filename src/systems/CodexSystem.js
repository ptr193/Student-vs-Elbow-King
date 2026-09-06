import { MetaManager } from './SettingsManager.js';

// 图鉴系统：记录击败的 BOSS、收集的道具、发现的敌人
export class CodexSystem {
  static KEY = 'codex';

  static load() {
    const meta = MetaManager.load();
    return meta.codex || { bosses: {}, items: {}, enemies: {}, npcs: {} };
  }

  static save(codex) {
    const meta = MetaManager.load();
    meta.codex = codex;
    MetaManager.save(meta);
  }

  static recordBoss(id, name, lore) {
    const codex = CodexSystem.load();
    codex.bosses[id] = { name, lore, defeatedAt: Date.now() };
    CodexSystem.save(codex);
  }

  static recordItem(id, name, desc) {
    const codex = CodexSystem.load();
    codex.items[id] = { name, desc, obtainedAt: Date.now() };
    CodexSystem.save(codex);
  }

  static recordEnemy(id, name, desc) {
    const codex = CodexSystem.load();
    codex.enemies[id] = { name, desc, firstSeen: Date.now() };
    CodexSystem.save(codex);
  }

  static recordNPC(id, name, dialogue) {
    const codex = CodexSystem.load();
    codex.npcs[id] = { name, dialogue, metAt: Date.now() };
    CodexSystem.save(codex);
  }

  static getStats() {
    const codex = CodexSystem.load();
    return {
      bosses: Object.keys(codex.bosses).length,
      items: Object.keys(codex.items).length,
      enemies: Object.keys(codex.enemies).length,
      npcs: Object.keys(codex.npcs).length,
    };
  }
}

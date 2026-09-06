// NPC 站点生成与背刺管理系统
// 规则（规格 4.12）：
//  - 每局路线 1–2 个 NPC 站点（随机选哪几个 NPC 出现）
//  - 部分 NPC 在被从囚禁中救出后，会移动到下一个站点等待玩家
//  - 背刺 NPC（尖子生、旁观者）被救后会在下一站点触发挖苦嘲讽对话
import npcsData from '../data/npcs.json';
import { NPC } from '../entities/NPC.js';
import { CodexSystem } from './CodexSystem.js';

export class NPCSystem {
  constructor(scene) {
    this.scene = scene;
    this.npcDefs = npcsData;
    this.pendingBetrayal = []; // 等待在下一站点背刺的 NPC ID
    this.spawnedIds = new Set(); // 本局已出现过的 NPC
    this.rescuedIds = new Set(); // 本局已救出的 NPC（用于判断是否第二次见面）
  }

  // 决定是否在某间房生成 NPC 站点
  // 规则：每局 1–2 个站点，优先在 item/rest 房触发
  shouldSpawnStation(room) {
    if (!room) return false;
    if (room.type !== 'item' && room.type !== 'rest' && room.type !== 'battle') return false;
    // 控制总数：1–2 个站点
    if (this.spawnedIds.size >= 2) return false;
    // 前几间不出现，避免和首场战斗冲突
    if (this.scene.roguelike.currentRoom < 1) return false;
    // 概率触发
    return Math.random() < 0.35;
  }

  // 在场景中生成一个 NPC（先选背刺待触发的，否则随机新 NPC）
  spawnStation(x, y) {
    let def = null;
    let isBetrayalVisit = false;
    // 先处理待触发的背刺 NPC：在下一站点出现并挖苦
    if (this.pendingBetrayal.length > 0) {
      const id = this.pendingBetrayal.shift();
      def = this.npcDefs.find(n => n.id === id);
      isBetrayalVisit = true; // 该 NPC 已被救出，本次为背刺站点
    }
    if (!def) {
      // 随机选一个尚未出现的 NPC
      const pool = this.npcDefs.filter(n => !this.spawnedIds.has(n.id));
      if (pool.length === 0) return null;
      def = pool[Math.floor(Math.random() * pool.length)];
    }
    this.spawnedIds.add(def.id);
    const npc = new NPC(this.scene, def, x, y);
    npc._isBetrayalVisit = isBetrayalVisit; // 标记本次是否为背刺站点
    this.scene.npcs.push(npc);
    return npc;
  }

  // 玩家与 NPC 接触时调用，返回触发的对话信息
  // 根据是否是背刺站点，给出不同对话
  onInteract(npc) {
    if (npc.interacted) return null;
    npc.interacted = true;
    const def = npc.def;
    this.scene.audio?.pickup();
    CodexSystem.recordNPC(def.id, def.name, def.rescue);

    // 背刺 NPC 救出后第二次见面触发挖苦（npc._isBetrayalVisit 标记）
    const isBetrayal = !!npc._isBetrayalVisit;
    let dialogue;
    if (isBetrayal) {
      dialogue = { name: def.name + '（背刺）', text: def.station, color: '#fa5252' };
    } else {
      dialogue = { name: def.name, text: def.rescue, color: def.color };
      this.rescuedIds.add(def.id);
      // 背刺 NPC 救出后标记：将在下一站点出现挖苦
      if (def.betray && !this.pendingBetrayal.includes(def.id)) {
        this.pendingBetrayal.push(def.id);
      }
    }

    // 奖励处理（背刺站点不给奖励）
    if (!isBetrayal) {
      if (def.reward === 'rare_item') {
        this.scene._spawnItemDrop(npc.x, npc.y - 30);
      } else if (def.reward === 'shop') {
        // 交易员：返回特殊标记，由场景打开交易界面
        return { dialogue: null, shop: def };
      }
    }
    return { dialogue, shop: null };
  }

  // 传承时不保留背刺队列（每局重新生成）
  reset() {
    this.pendingBetrayal = [];
    this.spawnedIds = new Set();
    this.rescuedIds = new Set();
  }
}

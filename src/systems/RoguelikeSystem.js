import gameConfig from '../config/game_config.json';
import enemiesData from '../config/enemies.json';
import skillsData from '../config/skills.json';

export class RoguelikeSystem {
  constructor() {
    this.chapters = gameConfig.chapters;
    this.currentChapterIdx = 0;
    this.currentSubArea = 0;
    this.currentRoom = 0;
    this.roomsPerSubArea = 4;
    this.rooms = [];
    this.passiveSkill = null;
    this.specialBullet = 'normal';
    this.specialAmmo = 0;
    this.unlockedBullets = [];
  }

  generateRun() {
    this.currentChapterIdx = 0;
    this.currentSubArea = 0;
    this.currentRoom = 0;
    this.passiveSkill = this._randomPick(skillsData.passive);
    this.specialBullet = 'normal';
    this.specialAmmo = 0;
    this.unlockedBullets = [];
    this._generateChapterRooms();
  }

  _generateChapterRooms() {
    const chapter = this.chapters[this.currentChapterIdx];
    const subAreas = chapter.subAreas;
    // 构建子区域 -> 小 BOSS 类型 的映射（规格 4.5：C2-A 计时器、C2-B 抄写板）
    // 优先使用 miniBosses 数组；若缺失则回退到旧 miniBoss 字段（作用于第一个子区域）
    const miniBossBySubArea = {};
    if (Array.isArray(chapter.miniBosses) && chapter.miniBosses.length > 0) {
      for (const m of chapter.miniBosses) miniBossBySubArea[m.subArea] = m.type;
    } else if (chapter.miniBoss) {
      miniBossBySubArea[subAreas[0]] = chapter.miniBoss;
    }
    // 小 BOSS 位于子区域的"中间房间"（规格 4.5：守在中间房间）
    const miniBossRoomIdx = Math.floor(this.roomsPerSubArea / 2);
    this.rooms = [];
    for (let sa = 0; sa < subAreas.length; sa++) {
      const subAreaId = subAreas[sa];
      const miniBossType = miniBossBySubArea[subAreaId];
      for (let r = 0; r < this.roomsPerSubArea; r++) {
        const isLastRoomOfSubArea = (r === this.roomsPerSubArea - 1);
        const isLastSubArea = (sa === subAreas.length - 1);
        let type = 'battle';
        let roomMiniBossType = null;
        // 最后一个子区域的最后一间是关卡 BOSS（肘击王由 C3 特例处理，stageBoss=null）
        if (isLastRoomOfSubArea && isLastSubArea && chapter.stageBoss) {
          type = 'stageBoss';
        } else if (miniBossType && r === miniBossRoomIdx) {
          // 该子区域的中间房间是小 BOSS
          type = 'miniBoss';
          roomMiniBossType = miniBossType;
        } else {
          const roll = Math.random();
          if (roll < 0.15) type = 'item';
          else if (roll < 0.25) type = 'trap';
          else if (roll < 0.35) type = 'rest';
          else type = 'battle';
        }
        this.rooms.push({
          chapter: chapter.id,
          subArea: subAreaId,
          room: r,
          type,
          miniBossType: roomMiniBossType,
          cleared: false,
        });
      }
    }
  }

  getCurrentRoom() {
    return this.rooms[this.currentRoom] || null;
  }

  getNextRoom() {
    this.currentRoom++;
    if (this.currentRoom >= this.rooms.length) {
      this.currentChapterIdx++;
      if (this.currentChapterIdx >= this.chapters.length) return null;
      this.currentRoom = 0;
      this._generateChapterRooms();
    }
    return this.getCurrentRoom();
  }

  getCurrentChapter() {
    return this.chapters[this.currentChapterIdx];
  }

  _randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  spawnEnemiesForRoom(room) {
    const enemies = [];
    const chapterMult = 1 + this.currentChapterIdx * 0.3;
    if (room.type === 'battle') {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const def = this._randomPick(enemiesData.trash);
        enemies.push({ ...def, hp: Math.ceil(def.hp * chapterMult), isElite: false });
      }
      // 20% 概率出精英
      if (Math.random() < 0.2 + this.currentChapterIdx * 0.1) {
        const def = this._randomPick(enemiesData.elite);
        enemies.push({ ...def, hp: Math.ceil(def.hp * chapterMult), isElite: true });
      }
    } else if (room.type === 'miniBoss' || room.type === 'stageBoss') {
      // BOSS由场景单独处理
    }
    return enemies;
  }
}

// 三败结局系统 — 肘击王专属（规格 4.11a）
// 肘击王战失败次数独立计数，第 3 次失败触发"放弃/不放弃"选择结局
// 不放弃 → 获得"信念"道具（攻击翻倍，传承保留）
import { MetaManager } from './SettingsManager.js';

const THREE_DEFEAT_KEY = 'threeDefeatCount';
const FAITH_FLAG = 'hasFaith';

export class ThreeDefeatSystem {
  constructor() {
    this.meta = MetaManager.load();
  }

  // 当前肘击王战连续失败次数（持久化跨传承）
  getCount() {
    return this.meta[THREE_DEFEAT_KEY] || 0;
  }

  // 是否已获得信念
  hasFaith() {
    return !!this.meta[FAITH_FLAG];
  }

  // 增加一次失败计数，返回是否触发三败结局
  // 规则：每任起义军只触发一次三败（用 perRunTriggered 标记）
  registerDefeat(perRunTriggered) {
    if (this.hasFaith()) {
      // 获得信念后不触发三败结局（信念让最终战从不可能变为勉强够得着）
      return false;
    }
    this.meta[THREE_DEFEAT_KEY] = (this.meta[THREE_DEFEAT_KEY] || 0) + 1;
    MetaManager.save(this.meta);
    const count = this.meta[THREE_DEFEAT_KEY];
    // 第 3 次且本任未触发过 → 触发三败结局
    return count >= 3 && !perRunTriggered;
  }

  // 根据失败次数返回肘击王战前的嘲讽对白
  // 规则：第 2 次失败"战前"加入嘲讽 → 即第 1 次失败后（count=1）进入下一战时显示
  getMockingLine() {
    const count = this.getCount();
    if (count === 1) return '又来一个送死的？上一个也是这么说的，然后就倒下了。你觉得你会不一样吗？';
    if (count >= 2) return '又来一个送死的？上一个也是这么说的，然后就倒下了。你觉得你会不一样吗？';
    return null; // 第一次（count=0）无嘲讽
  }

  // 获得信念后的肘击王动摇对白
  getFaithLine() {
    if (this.hasFaith()) {
      return '你……怎么还在？'; // 肘击王表现出动摇
    }
    return null;
  }

  // 触发三败结局序列（由 GameScene 调用）
  // 返回需要跳转的场景参数
  trigger() {
    return { win: false, threeDefeat: true };
  }

  // 选择"放弃"：清零三败计数，返回主菜单
  // 返回需要展示的结局数据（无星战字幕）
  chooseGiveUp(successionData) {
    this.meta[THREE_DEFEAT_KEY] = 0;
    this.meta[FAITH_FLAG] = false;
    MetaManager.save(this.meta);
    return {
      type: 'give_up',
      noCrawl: true, // 无星战字幕
      stats: this._buildStats(successionData),
    };
  }

  // 选择"不放弃"：怪物消散 → 同学出现 → 白光 → 回到存档点 + 获得"信念"
  choosePersevere() {
    this.meta[THREE_DEFEAT_KEY] = 0; // 重置三败计数
    this.meta[FAITH_FLAG] = true;   // 标记获得信念
    MetaManager.save(this.meta);
    return {
      type: 'persevere',
      grantFaith: true,
      // 回到 C3 存档点（肘击王战前最后一个房间）
      resumeScene: 'Game',
    };
  }

  // 构建结局统计面板数据
  _buildStats(successionData) {
    return {
      rebelName: successionData?.rebelName || '起义军',
      rebelGender: successionData?.rebelGender || '—',
      generation: (this.meta.totalDeaths || 0) + 1,
      deaths: this.meta.totalDeaths || 0,
      threeDefeats: 3,
      ending: '放弃',
      equipment: successionData?.items || [],
    };
  }

  // 重置（通关或开始新一局时）
  resetForNewRun() {
    // 不清零 hasFaith（信念传承保留），只重置本局标记
  }
}

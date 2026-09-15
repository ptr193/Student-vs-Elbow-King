import Phaser from 'phaser';
import { RecordManager } from '../systems/RecordManager.js';

// 排行榜场景（规格 7.4，v2.0）：速通排行 + 最低死亡数排行
export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a14');

    this.add.text(W / 2, 40, '排行榜', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    const lb = RecordManager.getLeaderboard();
    const fmt = RecordManager.formatTime;

    // 速通榜
    this.add.text(W * 0.25, 90, '速通排行', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#69db7c', fontStyle: 'bold',
    }).setOrigin(0.5);
    this._drawList(lb.speedrun, W * 0.25, 120, (e, i) =>
      `${i + 1}. ${fmt(e.time)}  · W${e.cycle}  · ${e.deaths}死`);

    // 最低死亡榜
    this.add.text(W * 0.75, 90, '最低死亡数', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#74c0fc', fontStyle: 'bold',
    }).setOrigin(0.5);
    this._drawList(lb.leastDeaths, W * 0.75, 120, (e, i) =>
      `${i + 1}. ${e.deaths}死  · ${fmt(e.time)}  · W${e.cycle}`);

    // 返回按钮
    const back = this.add.text(W / 2, H - 40, '返回', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#adb5bd',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#fff'));
    back.on('pointerout', () => back.setColor('#adb5bd'));
    back.on('pointerdown', () => this.scene.start('Menu'));
  }

  _drawList(entries, cx, startY, formatFn) {
    if (!entries || entries.length === 0) {
      this.add.text(cx, startY, '暂无记录', {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#495057',
      }).setOrigin(0.5);
      return;
    }
    entries.forEach((e, i) => {
      const color = i === 0 ? '#ffd43b' : i === 1 ? '#ced4da' : i === 2 ? '#d9480f' : '#868e96';
      this.add.text(cx, startY + i * 28, formatFn(e, i), {
        fontFamily: 'sans-serif', fontSize: '14px', color,
      }).setOrigin(0.5);
    });
  }
}

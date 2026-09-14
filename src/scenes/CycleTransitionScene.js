import Phaser from 'phaser';
import { CycleSystem } from '../systems/CycleSystem.js';

// 周目过渡画面（规格 6.3.1）：渐黑 → 周目数字淡入淡出 → 周目标题/引言 → 进入下一周目
export class CycleTransitionScene extends Phaser.Scene {
  constructor() { super('CycleTransition'); }

  create() {
    this.cycleSys = new CycleSystem();
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.cameras.main.setBackgroundColor('#000000');

    const cfg = this.cycleSys.getConfig();
    const cycleNum = this.cycleSys.getCurrentCycle();

    // 上一周目数字淡出
    const prevNum = this.add.text(W / 2, H * 0.4, String(Math.max(1, cycleNum - 1)), {
      fontFamily: 'sans-serif', fontSize: '120px', fontStyle: 'bold',
      color: '#495057',
    }).setOrigin(0.5).setAlpha(1);

    this.tweens.add({
      targets: prevNum,
      alpha: 0,
      y: H * 0.3,
      duration: 1200,
      onComplete: () => {
        prevNum.destroy();
        this._showCurrentCycle(cycleNum, cfg);
      },
    });
  }

  _showCurrentCycle(cycleNum, cfg) {
    const W = this.W, H = this.H;

    // 当前周目数字淡入
    const num = this.add.text(W / 2, H * 0.35, String(cycleNum), {
      fontFamily: 'sans-serif', fontSize: '140px', fontStyle: 'bold',
      color: '#ffd43b',
    }).setOrigin(0.5).setAlpha(0);

    const cycleLabel = this.add.text(W / 2, H * 0.52, cfg.name, {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#dee2e6',
    }).setOrigin(0.5).setAlpha(0);

    const title = this.add.text(W / 2, H * 0.62, '「' + cfg.title + '」', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#fa5252', fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const intro = this.add.text(W / 2, H * 0.72, cfg.intro, {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#adb5bd', align: 'center',
      wordWrap: { width: W * 0.7 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: num,
      alpha: 1,
      duration: 1500,
      onComplete: () => {
        this.tweens.add({ targets: cycleLabel, alpha: 1, duration: 800 });
        this.tweens.add({ targets: title, alpha: 1, duration: 800, delay: 300 });
        this.tweens.add({
          targets: intro, alpha: 1, duration: 800, delay: 600,
          onComplete: () => {
            // 停留 1.5 秒后进入游戏
            this.time.delayedCall(1500, () => this._goToGame());
          },
        });
      },
    });

    // 点击可跳过
    this.input.once('pointerdown', () => this._goToGame());
  }

  _goToGame() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game');
    });
  }
}

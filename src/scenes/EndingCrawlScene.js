// 星战字幕结局场景（规格 4.11 阶段一）
// 透视消失的俯视角，黄色文字从屏幕底部向远处上方缓缓滚动
// 完成四阶段序列：星战字幕 → 制作组 → 黑屏低语 → 终局统计
import Phaser from 'phaser';
import crawlData from '../data/ending_crawl.json';
import { MetaManager } from '../systems/SettingsManager.js';
import { RecordManager } from '../systems/RecordManager.js';

export class EndingCrawlScene extends Phaser.Scene {
  constructor() { super('EndingCrawl'); }

  init(data) {
    this.succession = data?.succession || {};
    this.startTime = performance.now();
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.cameras.main.setBackgroundColor('#000000');
    this._phase = 'crawl';

    // 传承代数决定使用基础还是扩展文案
    const gen = (this.succession.generation || (MetaManager.load().totalDeaths || 0) + 1);
    const lines = gen > 1 ? crawlData.crawl_extended : crawlData.crawl;
    this._startCrawl(lines);

    // 跳过按钮（不默认跳过，但可点击跳过）
    this.skipBtn = this.add.text(W - 20, 20, '跳过 ▶', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#868e96',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.skipBtn.on('pointerdown', () => this._skip());
  }

  _startCrawl(lines) {
    const W = this.W, H = this.H;
    const fullText = lines.join('\n');
    // 透视感：用 Graphics 制造消失点遮罩
    this._fadeTop = this.add.graphics();
    this._fadeTop.fillGradientStyle(0x000000, 0x000000, 0x00000000, 0x00000000, 1);
    this._fadeTop.fillRect(0, 0, W, 140);
    this._fadeBottom = this.add.graphics();
    this._fadeBottom.fillGradientStyle(0x00000000, 0x00000000, 0x000000, 0x000000, 1);
    this._fadeBottom.fillRect(0, H - 80, W, 80);

    const text = this.add.text(W / 2, H + 60, fullText, {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffd43b',
      align: 'center',
      lineSpacing: 16,
    }).setOrigin(0.5, 0).setAlpha(0.95);

    const distance = H + lines.length * 38 + 200;
    this.crawlText = text;
    this.tweens.add({
      targets: text,
      y: -distance,
      duration: 24000, // 约 24 秒，控制在 30 秒内
      ease: 'Linear',
      onComplete: () => this._phaseCredits(),
    });
  }

  _skip() {
    this.tweens.killAll();
    if (this.crawlText) this.crawlText.destroy();
    // 根据当前阶段跳到对应下一步
    if (this._phase === 'crawl') this._phaseCredits();
    else if (this._phase === 'credits') this._phaseWhisper();
    else if (this._phase === 'whisper') this._phaseStats();
  }

  // 阶段二：制作组
  _phaseCredits() {
    this._phase = 'credits';
    if (this.crawlText) this.crawlText.destroy();
    if (this._fadeTop) this._fadeTop.destroy();
    if (this._fadeBottom) this._fadeBottom.destroy();

    const W = this.W, H = this.H;
    const credits = crawlData.credits;
    const txt = this.add.text(W / 2, H, credits.join('\n'), {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#dee2e6',
      align: 'center', lineSpacing: 14,
    }).setOrigin(0.5, 1);
    this.creditsText = txt;
    this.tweens.add({
      targets: txt,
      y: -txt.height / 2,
      duration: 12000,
      ease: 'Linear',
      onComplete: () => this._phaseWhisper(),
    });
  }

  // 阶段三：黑屏低语
  _phaseWhisper() {
    this._phase = 'whisper';
    if (this.creditsText) this.creditsText.destroy();
    this.cameras.main.setBackgroundColor('#000000');
    const W = this.W, H = this.H;
    // 沉默 3 秒后浮现文字，停留 5 秒，淡去
    this.whisperText = this.add.text(W / 2, H / 2, crawlData.whisper, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#868e96',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.whisperText, alpha: 1, duration: 2000, delay: 3000,
      onComplete: () => {
        this.tweens.add({
          targets: this.whisperText, alpha: 0, duration: 2000, delay: 5000,
          onComplete: () => this._phaseStats(),
        });
      },
    });
  }

  // 阶段四：终局统计
  _phaseStats() {
    this._phase = 'stats';
    if (this.whisperText) this.whisperText.destroy();
    if (this.skipBtn) this.skipBtn.destroy();

    const W = this.W, H = this.H;
    const meta = MetaManager.load();
    const gen = (meta.totalDeaths || 0) + 1;
    const time = performance.now() - this.startTime;
    const storedPlay = (RecordManager.getStats().playTime) || 0;
    const elapsed = (storedPlay + time) / 1000;
    const m = Math.floor(elapsed / 60), s = Math.floor(elapsed % 60);
    const rating = this._calcRating(meta.totalDeaths || 0, time);

    this.add.text(W / 2, H * 0.12, '终局统计', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd43b', fontStyle: 'bold',
    }).setOrigin(0.5);

    const stats = [
      '起义军：' + (this.succession.rebelName || '第 ' + gen + ' 任起义军'),
      '性别：' + (this.succession.rebelGender || '—'),
      '传承代数：' + gen,
      '死亡次数：' + (meta.totalDeaths || 0),
      '通关时间：' + m + ':' + String(s).padStart(2, '0'),
      '评级：' + rating,
    ];
    const y = H * 0.28;
    stats.forEach((line, i) => {
      this.add.text(W / 2, y + i * 36, line, {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#dee2e6',
      }).setOrigin(0.5);
    });

    // 评级颜色提示
    this.add.text(W / 2, H * 0.62, '评级 ' + rating, {
      fontFamily: 'sans-serif', fontSize: '48px',
      color: rating === 'S' ? '#74c0fc' : rating === 'A' ? '#51cf66' : rating === 'B' ? '#ffd43b' : '#fa5252',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this._addButton('再战一局', W / 2 - 90, H * 0.85, () => {
      this.scene.stop('EndingCrawl');
      this.scene.start('Game');
    });
    this._addButton('返回主菜单', W / 2 + 90, H * 0.85, () => {
      this.scene.stop('EndingCrawl');
      this.scene.start('Menu');
    });
  }

  _calcRating(deaths, timeMs) {
    const rules = crawlData.rating_rules;
    if (deaths <= rules.S.maxDeaths && timeMs <= rules.S.maxTimeMs) return 'S';
    if (deaths <= rules.A.maxDeaths && timeMs <= rules.A.maxTimeMs) return 'A';
    if (deaths <= rules.B.maxDeaths && timeMs <= rules.B.maxTimeMs) return 'B';
    return 'C';
  }

  _addButton(text, x, y, onClick) {
    const bg = this.add.rectangle(x, y, 170, 46, 0x2a1a3a, 0.9)
      .setStrokeStyle(2, 0xffd43b, 0.6);
    const txt = this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#f8f9fa',
    }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x3a2a4a, 0.95));
    bg.on('pointerout', () => bg.setFillStyle(0x2a1a3a, 0.9));
    bg.on('pointerdown', () => onClick());
  }
}

import Phaser from 'phaser';
import narrativeData from '../data/opening_narrative.json';
import departureLines from '../data/departure_lines.json';
import { MetaManager } from '../systems/SettingsManager.js';

// 开场叙事场景（规格 4.10）：文字逐字显示 + 剪影画面 + 随机出发台词
export class OpeningNarrativeScene extends Phaser.Scene {
  constructor() {
    super('OpeningNarrative');
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.cameras.main.setBackgroundColor('#000000');

    // 剪影画面：右侧肘击王 + 左侧起义军剪影
    this._drawSilhouettes(W, H);

    // 标题
    this.titleText = this.add.text(W / 2, H * 0.18, narrativeData.title, {
      fontFamily: 'sans-serif', fontSize: '32px', fontStyle: 'bold',
      color: '#ffd43b', align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    // 正文（逐字显示）
    this.bodyText = this.add.text(W / 2, H * 0.5, '', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#e9ecef',
      align: 'center', lineSpacing: 10, wordWrap: { width: W * 0.8 },
    }).setOrigin(0.5).setAlpha(0);

    // 出发台词（最后阶段）
    this.departureText = this.add.text(W / 2, H * 0.78, '', {
      fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'italic',
      color: '#fa5252', align: 'center', wordWrap: { width: W * 0.7 },
    }).setOrigin(0.5).setAlpha(0);

    // 提示
    this.hint = this.add.text(W / 2, H - 30, '点击继续 · 长按略过', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#495057',
    }).setOrigin(0.5);

    this._phase = 'title'; // title -> paragraphs -> departure -> done
    this._paraIdx = 0;
    this._typedChars = 0;
    this._typing = false;

    // 点击推进：单次点击 = 立即完成当前逐字；已是完整态则进入下一阶段
    this.input.on('pointerdown', () => this._advance());

    // 标题淡入后开始逐字正文
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      duration: 1200,
      onComplete: () => this._startParagraph(0),
    });

    this.audio = this.game.registry.get('audio');
    this.audio?.startBgm?.('menu');
  }

  _drawSilhouettes(W, H) {
    const g = this.add.graphics();
    g.fillStyle(0x0a0a14, 1);

    // 右侧：肘击王剪影（巨大、压迫感，带"王座"轮廓）
    const kingX = W * 0.78, kingY = H * 0.55;
    g.fillStyle(0x1a0a14, 1);
    // 王座背
    g.fillRect(kingX - 110, kingY - 160, 220, 320);
    // 头
    g.fillCircle(kingX, kingY - 130, 36);
    // 肩/身
    g.fillRect(kingX - 70, kingY - 100, 140, 200);
    // 肘击手臂（抬起）
    g.fillRect(kingX + 30, kingY - 60, 90, 26);
    g.fillCircle(kingX + 120, kingY - 47, 16);
    // 王座顶角
    g.fillStyle(0x2a0a14, 1);
    g.fillTriangle(kingX - 110, kingY - 160, kingX - 90, kingY - 210, kingX - 70, kingY - 160);
    g.fillTriangle(kingX + 70, kingY - 160, kingX + 90, kingY - 210, kingX + 110, kingY - 160);

    // 左侧：起义军剪影（瘦小、持旗）
    const rebX = W * 0.18, rebY = H * 0.62;
    g.fillStyle(0x0a0f1a, 1);
    g.fillCircle(rebX, rebY - 60, 16);
    g.fillRect(rebX - 12, rebY - 44, 24, 80);
    // 旗杆
    g.fillRect(rebX + 10, rebY - 120, 4, 100);
    // 旗面
    g.fillStyle(0x1a0f2a, 1);
    g.fillTriangle(rebX + 14, rebY - 120, rebX + 54, rebY - 108, rebX + 14, rebY - 96);

    // 整体微动（呼吸式缩放）
    this.tweens.add({
      targets: g,
      scaleX: 1.02, scaleY: 1.02,
      duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _startParagraph(idx) {
    this._phase = 'paragraphs';
    this._paraIdx = idx;
    this._typedChars = 0;
    this._typing = true;
    this.bodyText.setText('');
    this.bodyText.setAlpha(1);
  }

  update() {
    // 正文逐字
    if (this._phase === 'paragraphs' && this._typing) {
      const full = narrativeData.paragraphs[this._paraIdx] || '';
      if (this._typedChars < full.length) {
        this._typedChars++;
        this.bodyText.setText(full.slice(0, this._typedChars));
        if (this._typedChars % 2 === 0) this.audio?.blip?.();
      } else {
        this._typing = false;
      }
    }
    // 出发台词逐字
    if (this._phase === 'departure' && this._typingDep) {
      if (this._depChars < this._depFull.length) {
        this._depChars++;
        this.departureText.setText(this._depFull.slice(0, this._depChars));
        if (this._depChars % 3 === 0) this.audio?.blip?.();
      } else {
        this._typingDep = false;
      }
    }
  }

  _advance() {
    this.audio?.button?.();
    if (this._phase === 'title') return; // 标题淡入未完成，忽略

    if (this._phase === 'paragraphs') {
      const full = narrativeData.paragraphs[this._paraIdx] || '';
      if (this._typedChars < full.length) {
        // 立即显示完整段落
        this._typedChars = full.length;
        this.bodyText.setText(full);
        this._typing = false;
      } else {
        // 进入下一段或转入出发台词
        if (this._paraIdx < narrativeData.paragraphs.length - 1) {
          this._paraIdx++;
          this._startParagraph(this._paraIdx);
        } else {
          this._startDeparture();
        }
      }
    } else if (this._phase === 'departure') {
      this._goToGame();
    }
  }

  _startDeparture() {
    this._phase = 'departure';
    // 逐字隐藏正文
    this.tweens.add({
      targets: this.bodyText,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        // 随机出发台词（每局不同，传达赴死决心）
        const line = departureLines[Math.floor(Math.random() * departureLines.length)];
        this.departureText.setText(line);
        this._depChars = 0;
        this._depFull = line;
        this._typingDep = true;
        this.tweens.add({ targets: this.departureText, alpha: 1, duration: 400 });
        // 记录本代出发台词（供结算/叙事回看）
        const meta = MetaManager.load();
        meta.lastDepartureLine = line;
        MetaManager.save(meta);
      },
    });
  }

  _goToGame() {
    this._phase = 'done';
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game');
    });
  }
}

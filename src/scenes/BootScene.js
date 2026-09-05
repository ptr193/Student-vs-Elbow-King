import Phaser from 'phaser';
import { generateTexture, generatePlayerTexture } from '../utils/asset_generator.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // 全部程序化生成纹理，无外部美术素材
    this._generateTextures();

    const progress = this.add.graphics();
    progress.fillStyle(0x0a0a14, 1);
    progress.fillRect(0, 0, 960, 540);
    progress.fillStyle(0xffd43b, 1);
    progress.fillRect(280, 250, 400, 40);
    // 无异步加载，直接进入主菜单
    this.time.delayedCall(300, () => {
      progress.destroy();
      this.scene.start('Menu');
    });
  }

  _generateTextures() {
    const keys = ['paperling', 'redmarker', 'inkdrop', 'paperplane', 'bellringer',
      'stackpile', 'echo', 'corrector', 'reader', 'bulletin', 'timer',
      'chalkboard', 'ranking', 'tribunal', 'zjw1', 'zjw2'];
    keys.forEach(k => {
      const canvas = generateTexture(k, { size: 64, phase: 1 });
      if (canvas) {
        this.textures.addCanvas(k, canvas);
      }
    });
    // 玩家纹理
    const playerCanvas = generatePlayerTexture(50);
    this.textures.addCanvas('player', playerCanvas);
  }
}

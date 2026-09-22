import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { OpeningNarrativeScene } from './scenes/OpeningNarrativeScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { EndScene } from './scenes/EndScene.js';
import { EndingCrawlScene } from './scenes/EndingCrawlScene.js';
import { SuccessionScene } from './scenes/SuccessionScene.js';
import { CodexScene } from './scenes/CodexScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { AboutScene } from './scenes/AboutScene.js';
import { CycleTransitionScene } from './scenes/CycleTransitionScene.js';
import { AchievementScene } from './scenes/AchievementScene.js';
import { WeaponSelectScene } from './scenes/WeaponSelectScene.js';
import { LeaderboardScene } from './scenes/LeaderboardScene.js';
import { AudioSystem } from './systems/AudioSystem.js';

const audio = new AudioSystem();
audio.init();

window.addEventListener('pointerdown', () => audio.resume(), { once: false });

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  // 固定横屏设计分辨率：16:9 横屏游戏
  // Scale.FIT 会保持宽高比，在任意屏幕上居中显示（竖屏时上下留黑边，不拉伸）
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
  },
  scene: [BootScene, MenuScene, OpeningNarrativeScene, WeaponSelectScene, GameScene, UIScene, EndScene, EndingCrawlScene, SuccessionScene, CodexScene, CollectionScene, AboutScene, CycleTransitionScene, AchievementScene, LeaderboardScene],
  render: {
    pixelArt: false,
    antialias: true,
    powerPreference: 'high-performance',
    roundPixels: false,
  },
};

const game = new Phaser.Game(config);
game.registry.set('audio', audio);
window.game = game; // 暴露到全局便于调试

export { game, audio };

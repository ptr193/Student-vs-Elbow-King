import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { EndScene } from './scenes/EndScene.js';
import { SuccessionScene } from './scenes/SuccessionScene.js';
import { CodexScene } from './scenes/CodexScene.js';
import { AudioSynth } from './utils/audio_synth.js';

const audio = new AudioSynth();
audio.init();

window.addEventListener('pointerdown', () => audio.resume(), { once: false });

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#0a0a14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, EndScene, SuccessionScene, CodexScene],
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(config);
game.registry.set('audio', audio);
window.game = game; // 暴露到全局便于调试

export { game, audio };

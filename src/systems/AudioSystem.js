// 统一音频管理 — 封装 AudioSynth，提供 BGM 交叉淡入淡出、音量控制、音效池防叠加
import { AudioSynth } from '../utils/audio_synth.js';
import { SettingsManager } from './SettingsManager.js';

const BGM_TYPES = ['menu', 'battle', 'miniboss', 'boss', 'bossP2', 'victory', 'defeat'];

export class AudioSystem {
  constructor() {
    this.synth = new AudioSynth();
    this.enabled = true;
    this.currentBgm = null;
    this._fadeTimer = null;
    this._lastSfxAt = {};
    this._sfxThrottleMs = 35; // 同名音效最小间隔，防止叠加爆音
  }

  init() {
    this.synth.init();
    this.applySettings();
  }

  // 用户首次交互后恢复 AudioContext
  resume() { this.synth.resume(); }

  // 应用设置中的音量
  applySettings() {
    const s = SettingsManager.load();
    this.setBgmVolume(s.bgmVolume);
    this.setSfxVolume(s.sfxVolume);
  }

  // 直接启动 BGM（兼容场景调用 this.audio.startBgm）
  startBgm(type) { this.playBgm(type); }

  // 叙事文字逐字音效
  blip() { this._throttled('blip', this.synth.blip); }

  setBgmVolume(v) { this.synth.setBgmVolume(v); }
  setSfxVolume(v) { this.synth.setSfxVolume(v); }
  setEnabled(b) {
    this.enabled = b;
    if (!b) this.stopBgm();
  }

  // BGM 交叉淡入淡出切换
  playBgm(type) {
    if (!BGM_TYPES.includes(type)) type = 'menu';
    if (this.currentBgm === type) return;
    const prev = this.currentBgm;
    this.currentBgm = type;
    // 旧 BGM 淡出
    if (prev) {
      this._fadeOut(400, () => this.synth.startBgm(type));
    } else {
      this.synth.startBgm(type);
    }
  }

  stopBgm() {
    this.currentBgm = null;
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    this.synth.stopBgm();
  }

  // 暂停时降低 BGM 音量到 50%
  duckBgm() {
    const s = SettingsManager.load();
    this.setBgmVolume(s.bgmVolume * 0.5);
  }
  unduckBgm() {
    const s = SettingsManager.load();
    this.setBgmVolume(s.bgmVolume);
  }

  _fadeOut(ms, onDone) {
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    const s = SettingsManager.load();
    const target = s.bgmVolume;
    const start = performance.now();
    this._fadeTimer = setInterval(() => {
      const t = (performance.now() - start) / ms;
      if (t >= 1) {
        clearInterval(this._fadeTimer);
        this._fadeTimer = null;
        this.synth.stopBgm();
        if (onDone) onDone();
        return;
      }
      this.synth.setBgmVolume(target * (1 - t));
    }, 40);
  }

  // 音效封装：带节流，防止同名音效叠加爆音
  _throttled(name, fn) {
    if (!this.enabled) return;
    const now = performance.now();
    const last = this._lastSfxAt[name] || 0;
    if (now - last < this._sfxThrottleMs) return;
    this._lastSfxAt[name] = now;
    fn.call(this.synth);
  }

  shoot() { this._throttled('shoot', this.synth.shoot); }
  shootAlt() { this._throttled('shootAlt', this.synth.shootAlt); }
  hit() { this._throttled('hit', this.synth.hit); }
  hurt() { this._throttled('hurt', this.synth.hurt); }
  jump() { this._throttled('jump', this.synth.jump); }
  doubleJump() { this._throttled('doubleJump', this.synth.doubleJump); }
  bossZJ() { this._throttled('bossZJ', this.synth.bossZJ); }
  phaseChange() { this._throttled('phaseChange', this.synth.phaseChange); }
  chargeWarn() { this._throttled('chargeWarn', this.synth.chargeWarn); }
  readerNoise() { this._throttled('readerNoise', this.synth.readerNoise); }
  grab() { this._throttled('grab', this.synth.grab); }
  quizCorrect() { this._throttled('quizCorrect', this.synth.quizCorrect); }
  quizWrong() { this._throttled('quizWrong', this.synth.quizWrong); }
  victory() { this._throttled('victory', this.synth.victory); }
  defeat() { this._throttled('defeat', this.synth.defeat); }
  button() { this._throttled('button', this.synth.button); }
  pickup() { this._throttled('pickup', this.synth.pickup); }
  skillActivate() { this._throttled('skillActivate', this.synth.skillActivate); }
  gold() { this._throttled('gold', this.synth.gold); }
  enemyDie() { this._throttled('enemyDie', this.synth.enemyDie); }
  bossDie() { this._throttled('bossDie', this.synth.bossDie); }
}

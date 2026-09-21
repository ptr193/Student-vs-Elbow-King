// 程序合成音效生成器 - 基于 Web Audio API
// 所有音效均由 OscillatorNode + 噪声 + 滤波器实时合成，无外部素材依赖

export class AudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmNodes = [];
    this.bgmInterval = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.5;
      this.bgmGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setBgmVolume(v) { if (this.bgmGain) this.bgmGain.gain.value = v; }
  setSfxVolume(v) { if (this.sfxGain) this.sfxGain.gain.value = v; }

  // 白噪声 buffer
  _noiseBuffer(duration = 1) {
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _playTone(freq, duration, type = 'sine', vol = 0.3, attack = 0.01, release = 0.1, freqEnd = null) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration + release);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + release + 0.05);
  }

  _playNoise(duration, vol = 0.3, filterFreq = 1000, attack = 0.01, release = 0.1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration + release);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration + release + 0.05);
  }

  // ---- 音效 ----
  shoot() { this._playTone(880, 0.08, 'square', 0.15, 0.005, 0.05, 440); }
  shootAlt() { this._playTone(300, 0.1, 'sawtooth', 0.18, 0.005, 0.08, 120); }
  hit() { this._playNoise(0.12, 0.25, 2000, 0.005, 0.1); this._playTone(1200, 0.06, 'square', 0.1, 0.005, 0.04); }
  hurt() { this._playTone(180, 0.25, 'sine', 0.3, 0.01, 0.15, 60); }
  jump() { this._playTone(300, 0.18, 'sine', 0.2, 0.01, 0.1, 600); }
  doubleJump() { this._playTone(400, 0.2, 'sine', 0.2, 0.01, 0.1, 800); }
  bossZJ() { this._playTone(500, 0.3, 'sawtooth', 0.2, 0.01, 0.2, 100); this._playNoise(0.2, 0.15, 800); }
  phaseChange() {
    [220, 277, 196].forEach((f, i) => setTimeout(() => this._playTone(f, 0.4, 'sawtooth', 0.25, 0.02, 0.3), i * 80));
  }
  chargeWarn() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    lfo.frequency.value = 8;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(); lfo.start();
    this._chargeOsc = osc; this._chargeLfo = lfo;
    setTimeout(() => { try { osc.stop(); lfo.stop(); } catch(e){} }, 600);
  }
  readerNoise() { this._playNoise(0.5, 0.3, 400, 0.05, 0.2); }
  grab() { this._playTone(150, 0.4, 'square', 0.3, 0.01, 0.3, 80); }
  quizCorrect() { [523, 659, 784].forEach((f, i) => setTimeout(() => this._playTone(f, 0.15, 'square', 0.2, 0.01, 0.1), i * 80)); }
  quizWrong() { this._playTone(200, 0.4, 'sawtooth', 0.3, 0.01, 0.3, 100); }
  victory() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._playTone(f, 0.3, 'square', 0.25, 0.02, 0.2), i * 120)); }
  defeat() { [400, 350, 300, 200].forEach((f, i) => setTimeout(() => this._playTone(f, 0.35, 'sawtooth', 0.25, 0.02, 0.25), i * 150)); }
  button() { this._playTone(600, 0.05, 'square', 0.15, 0.005, 0.03); }
  blip() { this._playTone(1200, 0.02, 'square', 0.05, 0.002, 0.015); }
  pickup() { [659, 988].forEach((f, i) => setTimeout(() => this._playTone(f, 0.1, 'sine', 0.2, 0.01, 0.08), i * 60)); }
  skillActivate() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this._playTone(f, 0.12, 'sine', 0.2, 0.01, 0.1), i * 50)); }
  gold() { this._playTone(1200, 0.06, 'sine', 0.15, 0.005, 0.04); this._playTone(1600, 0.06, 'sine', 0.12, 0.005, 0.04, 800); }
  enemyDie() { this._playNoise(0.2, 0.2, 1500, 0.005, 0.15); }
  bossDie() { this._playNoise(0.8, 0.3, 300, 0.05, 0.5); [100, 80, 60].forEach((f, i) => setTimeout(() => this._playTone(f, 0.4, 'sawtooth', 0.3, 0.05, 0.3), i * 100)); }

  // ---- BGM（简单循环） ----
  startBgm(type = 'menu') {
    this.stopBgm();
    if (!this.ctx || !this.enabled) return;
    const patterns = {
      menu:     { notes: [110, 146, 110, 164], type: 'sawtooth', tempo: 500 },
      battle:   { notes: [146, 174, 196, 174], type: 'square', tempo: 300 },
      miniboss: { notes: [196, 233, 261, 233], type: 'sawtooth', tempo: 200 },
      boss:     { notes: [98, 116, 130, 116], type: 'sawtooth', tempo: 250 },
      bossP2:   { notes: [87, 116, 146, 116], type: 'sawtooth', tempo: 180 },
      victory:  { notes: [261, 329, 392, 523], type: 'sine', tempo: 400 },
      defeat:   { notes: [196, 174, 146, 110], type: 'sine', tempo: 450 },
    };
    const p = patterns[type] || patterns.menu;
    let idx = 0;
    const playNext = () => {
      const f = p.notes[idx % p.notes.length];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = p.type;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + p.tempo / 1000);
      osc.connect(g);
      g.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + p.tempo / 1000 + 0.1);
      idx++;
    };
    playNext();
    this.bgmInterval = setInterval(playNext, p.tempo);
  }

  stopBgm() {
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
  }
}

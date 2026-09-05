const STORAGE_KEY = 'dzzjw_settings';

const DEFAULTS = {
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  screenShake: true,
  particles: 'all',
  joystickSize: 1.0,
  buttonSize: 1.0,
};

export class SettingsManager {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (e) {}
    return { ...DEFAULTS };
  }

  static save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }
}

export const MetaManager = {
  KEY: 'dzzjw_meta',
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      totalDeaths: 0,
      defeatedBosses: [],
      unlockedItems: [],
      unlockedSkills: [],
      poemCount: 0,
      currentChapter: 0,
      successionData: null,
      threeDefeatCount: 0,
      hasFaith: false,
      cycle: 1,
    };
  },
  save(meta) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(meta));
    } catch (e) {}
  },
};

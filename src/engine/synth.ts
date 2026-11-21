// 合成音：声音文件还没放的时候，用它代替，灰盒阶段也有声音可以调手感。
// 键是 manifest 里的声音 ID。assets.play(id) 找不到文件时会来这里找同名配方。
// 想加新音效：在 RECIPES 里加一项，再在 manifest 里登记同名 ID（文件可以晚点再放）。

interface ToneOptions {
  duration?: number;
  volume?: number;
  type?: OscillatorType;
}

// 一个音：频率（Hz）、开始时间、时长、音量、波形（sine / square / triangle / sawtooth）。
function tone(audio: AudioContext, output: AudioNode, frequency: number, at: number, { duration = 0.1, volume = 0.3, type = 'sine' }: ToneOptions = {}) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  oscillator.connect(gain).connect(output);
  oscillator.start(at);
  oscillator.stop(at + duration);
}

// 金属声：几个不成谐波的频率叠在一起。base 越低越沉。
function metal(audio: AudioContext, output: AudioNode, at: number, base: number, duration: number, volume: number) {
  for (const ratio of [1, 2.76, 5.4]) {
    tone(audio, output, base * ratio, at, { duration, volume: volume / ratio });
  }
}

/** 一个配方：(audio, output, 开始时间, 音量) => void */
export type Recipe = (audio: AudioContext, output: AudioNode, at: number, volume: number) => void;

export const RECIPES: Record<string, Recipe> = {
  sfx_click: (a, o, at, v) => tone(a, o, 660, at, { duration: 0.05, volume: 0.15 * v, type: 'triangle' }),
  sfx_tick: (a, o, at, v) => tone(a, o, 880, at, { duration: 0.05, volume: 0.12 * v, type: 'square' }),
  // 小锤：清脆的“叮”
  sfx_hammer_light: (a, o, at, v) => metal(a, o, at, 1400, 0.12, 0.3 * v),
  // 大锤：低沉的“当”，带一点闷响
  sfx_hammer_heavy: (a, o, at, v) => {
    metal(a, o, at, 300, 0.35, 0.3 * v);
    tone(a, o, 90, at, { duration: 0.14, volume: 0.36 * v, type: 'triangle' });
  },
  // 没打中、空敲
  sfx_miss: (a, o, at, v) => tone(a, o, 140, at, { duration: 0.09, volume: 0.25 * v, type: 'triangle' }),
  // 淬火、冒蒸汽：用快速下滑的一串高音近似
  sfx_hiss: (a, o, at, v) => {
    for (let i = 0; i < 8; i += 1) {
      tone(a, o, 3000 - i * 250, at + i * 0.03, { duration: 0.06, volume: 0.05 * v, type: 'sawtooth' });
    }
  },
  sfx_coin: (a, o, at, v) => {
    tone(a, o, 988, at, { duration: 0.08, volume: 0.2 * v, type: 'square' });
    tone(a, o, 1319, at + 0.08, { duration: 0.2, volume: 0.2 * v, type: 'square' });
  },
  // 交付成功：上行三音
  sfx_deliver: (a, o, at, v) => {
    [523, 659, 784].forEach((f, i) => tone(a, o, f, at + i * 0.09, { duration: 0.18, volume: 0.2 * v, type: 'triangle' }));
  },
  // 交付失败、出废品：下行两音
  sfx_scrap: (a, o, at, v) => {
    [392, 311].forEach((f, i) => tone(a, o, f, at + i * 0.12, { duration: 0.22, volume: 0.2 * v, type: 'triangle' }));
  },
};

export interface PlayOptions {
  volume?: number;
  /** AudioContext 时间。不传就是立刻播；节奏类玩法可以提前排好。 */
  at?: number;
}

export function playRecipe(audio: AudioContext | null, output: AudioNode | null, id: string, { volume = 1, at }: PlayOptions = {}) {
  const recipe = RECIPES[id];
  if (!recipe || !audio || !output) return false;
  recipe(audio, output, at ?? audio.currentTime, volume);
  return true;
}

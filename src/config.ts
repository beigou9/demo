// 所有可调的数值都放这里，规则和场景都从这里读。加字段时直接加，类型会自动跟着变。
export const CONFIG = {
  view: { width: 1280, height: 720 },
  saveKey: 'laozhou-workshop-v1',
  game: {
    startScore: 0,
    stopOrdersBeforeClosing: 20000,
    strikeFrom: 0.4,
    strikeTo: 0.6,
    speed: 310,
    reach: 92,
  },
  steps: {
    shape: { label: '整坯', duration: 2000 },
    heat: { label: '加热', duration: 5000 },
    forge: { label: '锻打', duration: 4000 },
    cool: { label: '冷却', duration: 3000 },
    finish: { label: '修整', duration: 3000 },
  },
  blades: {
    small: { name: '日用小刀', recipe: ['heat', 'forge', 'cool'], limit: 32000, points: 20, bonus: 5 },
    kitchen: { name: '菜刀', recipe: ['heat', 'forge', 'cool', 'finish'], limit: 42000, points: 40, bonus: 10 },
    firewood: { name: '柴刀', recipe: ['shape', 'heat', 'forge', 'cool', 'finish'], limit: 52000, points: 60, bonus: 15 },
  },
  days: [
    { duration: 100000, target: 100, interval: 16000, capacity: 2, sequence: ['small', 'kitchen'] },
    { duration: 110000, target: 170, interval: 14000, capacity: 3, sequence: ['kitchen', 'small', 'firewood', 'kitchen'] },
    { duration: 120000, target: 260, interval: 12000, capacity: 3, sequence: ['firewood', 'kitchen', 'firewood', 'small', 'kitchen'] },
  ],
} as const;

export type Config = typeof CONFIG;

import { describe, expect, test } from 'vitest';
import { CONFIG } from '../src/config';
import { addScore, newGame } from '../src/core/game';
import { createSave } from '../src/engine/save';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('规则', () => {
  test('新的一局从配置的初始分开始', () => {
    expect(newGame(CONFIG).score).toBe(CONFIG.game.startScore);
  });

  test('加分不会扣到负数', () => {
    const state = newGame(CONFIG);
    addScore(state, 5);
    addScore(state, -100);
    expect(state.score).toBe(0);
  });
});

describe('存档', () => {
  test('游戏状态经过存档后可以继续玩', () => {
    const save = createSave('test', fakeStorage());
    const state = newGame(CONFIG);
    addScore(state, 3);
    save.writeRun(state);
    const restored = save.run!;
    expect(restored).toEqual(state);
    addScore(restored, 2);
    expect(restored.score).toBe(5);
  });

  test('存档损坏时不崩溃，最高分只升不降', () => {
    const storage = fakeStorage();
    storage.setItem('test', '{坏数据');
    const save = createSave('test', storage);
    expect(save.run).toBeNull();
    save.recordScore(50);
    save.recordScore(20);
    expect(save.best).toBe(50);
  });
});

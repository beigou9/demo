// 存档：写进 localStorage。storage 可替换，方便测试。
import type { GameState } from '../core/game';

const VERSION = 1;

interface SaveData {
  version: number;
  run: GameState | null;
  best: number;
}

export type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createSave(key: string, storage: SaveStorage = globalThis.localStorage) {
  function read(): SaveData {
    try {
      const data = JSON.parse(storage.getItem(key) ?? 'null');
      if (data?.version === VERSION) return data;
    } catch {
      // 存档损坏时当作没有存档。
    }
    return { version: VERSION, run: null, best: 0 };
  }

  function write(data: SaveData) {
    try {
      storage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('存档写入失败', error);
    }
  }

  return {
    get run(): GameState | null {
      return read().run;
    },
    get best(): number {
      return read().best;
    },
    writeRun(run: GameState) {
      write({ ...read(), run });
    },
    clearRun() {
      write({ ...read(), run: null });
    },
    recordScore(score: number) {
      const data = read();
      write({ ...data, best: Math.max(data.best, score) });
    },
  };
}

export type Save = ReturnType<typeof createSave>;

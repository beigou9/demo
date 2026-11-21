// 入口：创建 Phaser 游戏，登记场景，准备游戏上下文。
import Phaser from 'phaser';
import { CONFIG } from './config';
import { newGame } from './core/game';
import { BootScene } from './engine/boot';
import { createSave } from './engine/save';
import { createContext } from './engine/scenes';
import { scenes } from './scenes/index';

const { width, height } = CONFIG.view;
// 截图脚本会在地址后加 ?shot，要读回画面像素，所以保留绘制缓冲。
const shot = new URLSearchParams(location.search).has('shot');

const ctx = createContext(() => phaser, CONFIG, createSave(CONFIG.saveKey), newGame(CONFIG));

const phaser: Phaser.Game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width,
  height,
  backgroundColor: '#23201d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, preserveDrawingBuffer: shot },
  input: { keyboard: { capture: [Phaser.Input.Keyboard.KeyCodes.SPACE] } },
  banner: false,
  scene: [BootScene, ...scenes],
  // 场景启动之前就把上下文放好，场景里用 this.ctx 取。
  callbacks: { preBoot: (game) => game.registry.set('ctx', ctx) },
});
// 方便在浏览器控制台和截图脚本里查看状态：__game.game 是当前这一局，__game.sceneName 是当前场景。
(globalThis as unknown as { __game: typeof ctx; __phaser: Phaser.Game }).__game = ctx;
(globalThis as unknown as { __phaser: Phaser.Game }).__phaser = phaser;

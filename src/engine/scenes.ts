// 场景基类和游戏上下文。
//
// 每个场景是一个继承 BaseScene 的类，用的是 Phaser 原生的写法：
//   create()                进入场景时搭画面（加图片、文字、按钮、tween）
//   update(time, delta)     每帧调用，delta 单位是毫秒（秒数用 delta / 1000）
// 场景的 key 就是它的名字（构造函数里 super('名字')），切场景用 this.ctx.go('名字')。
//
// BaseScene 额外提供几个顺手的东西：
//   this.ctx                游戏上下文：ctx.game 游戏状态，ctx.config 数值，ctx.save 存档
//   this.art(id, x, y, w)   按宽度放一张素材图，高度按原比例
//   this.label(x, y, 文字)   加文字
//   this.button({...})      加按钮（点击或快捷键）
//   this.onKey(e => ...)    监听按键（别用 this.input.keyboard.on，原因见 ui.ts 的 listenKeys）
//   this.sfx(id)            放音效，没有文件时播合成音
//   this.music(id)          循环播放背景音乐
import Phaser from 'phaser';
import type { Config } from '../config';
import type { GameState } from '../core/game';
import { missing, playMusic, playSound, stopMusic } from './assets';
import type { PlayOptions } from './synth';
import type { Save } from './save';
import { addButton, addText, listenKeys, type ButtonOptions, type TextOptions } from './ui';

export interface GameContext {
  config: Config;
  save: Save;
  /** 游戏状态（core/game.ts 的 GameState）。存档：ctx.save.writeRun(ctx.game)。 */
  game: GameState;
  /** 当前场景名，截图脚本和控制台调试用。 */
  readonly sceneName: string;
  /** 还没放进来的素材文件路径。 */
  missing: string[];
  /** 切换到某个场景。 */
  go(name: string, data?: object): void;
  /** 想让截图报告多打印一些信息时，给它赋一个函数，返回值会出现在报告里。 */
  debug?: () => unknown;
}

/** game 用函数传进来，因为上下文要在 Phaser 启动之前建好。 */
export function createContext(getGame: () => Phaser.Game, config: Config, save: Save, game: GameState): GameContext {
  const scenes = () => getGame().scene;
  const activeKeys = () => scenes().getScenes(true).map((s) => s.scene.key).filter((k) => k !== 'boot');
  const ctx: GameContext = {
    config,
    save,
    game,
    missing,
    get sceneName() {
      return activeKeys()[0] ?? '';
    },
    go(name, data) {
      if (!scenes().getScene(name)) throw new Error(`没有场景：${name}，记得在 src/scenes/index.ts 里登记`);
      // 同一时间只留一个场景在跑：先停掉其它所有活动场景，再启动目标（目标正在跑就重启）。
      const active = scenes().getScenes(true);
      if (!active.length) {
        scenes().start(name, data);
        return;
      }
      const plugin = active[0].scene;
      for (const s of active) if (s.scene.key !== name) plugin.stop(s.scene.key);
      if (active.some((s) => s.scene.key === name)) plugin.get(name).scene.restart(data);
      else plugin.launch(name, data);
    },
  };
  return ctx;
}

export class BaseScene extends Phaser.Scene {
  get ctx(): GameContext {
    return this.registry.get('ctx') as GameContext;
  }

  /** 放一张素材图，x, y 是图片中心，宽 w；h 不传时按原比例。想以脚底为基准就 .setOrigin(0.5, 1)。 */
  art(id: string, x: number, y: number, w: number, h?: number) {
    const image = this.add.image(x, y, id);
    image.setDisplaySize(w, h ?? (w * image.height) / image.width);
    return image;
  }

  /** 铺满整个画面的背景图。 */
  background(id: string) {
    const { width, height } = this.ctx.config.view;
    return this.add.image(0, 0, id).setOrigin(0).setDisplaySize(width, height);
  }

  label(x: number, y: number, text: string, options?: TextOptions) {
    return addText(this, x, y, text, options);
  }

  button(options: ButtonOptions) {
    return addButton(this, options);
  }

  /** 监听按键，event.code 是 'Space'、'KeyJ'、'ArrowLeft' 这样的名字。场景关闭时自动解绑。 */
  onKey(handler: (event: KeyboardEvent) => void) {
    return listenKeys(this, handler);
  }

  sfx(id: string, options?: PlayOptions) {
    playSound(this, id, options);
  }

  /** 循环播放背景音乐，切场景不会断。不传 id 就停掉。 */
  music(id?: string, volume?: number) {
    if (id) playMusic(this, id, volume);
    else stopMusic();
  }
}

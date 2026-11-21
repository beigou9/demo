// 常用的界面小件：文字、按钮。都是普通的 Phaser 游戏对象，拿到以后可以继续 setDepth、加 tween。
import Phaser from 'phaser';
import { playSound } from './assets';

export const FONT = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

/** 素材统一的配色：描边深棕、奶油底、暖橙强调。自己画色块时从这里取。 */
export const COLOR = {
  ink: '#5a3220',
  cream: '#fff6dc',
  paper: '#f7f1e1',
  orange: '#e8893a',
  green: '#3d6b54',
  gray: '#9a8a78',
};
export const hex = (css: string) => Phaser.Display.Color.HexStringToColor(css).color;

export interface TextOptions {
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: number;
  mono?: boolean;
  /** 自动换行的宽度 */
  wrap?: number;
  /** 文字描边，在花背景上更清楚 */
  stroke?: string;
}

/** 加一行文字。x, y 是文字的左边中点（align 是 center / right 时是中点 / 右边中点）。 */
export function addText(scene: Phaser.Scene, x: number, y: number, text: string, options: TextOptions = {}) {
  const { size = 24, color = COLOR.ink, align = 'left', weight = 400, mono = false, wrap, stroke } = options;
  const t = scene.add.text(x, y, text, {
    fontFamily: mono ? MONO : FONT,
    fontSize: `${size}px`,
    fontStyle: weight >= 600 ? 'bold' : 'normal',
    color,
    align,
    lineSpacing: Math.round(size * 0.35),
    wordWrap: wrap ? { width: wrap, useAdvancedWrap: true } : undefined,
    stroke,
    strokeThickness: stroke ? Math.max(3, Math.round(size / 6)) : 0,
  });
  t.setResolution(2);
  t.setOrigin(align === 'left' ? 0 : align === 'center' ? 0.5 : 1, wrap ? 0 : 0.5);
  return t;
}

export interface ButtonOptions {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
  /** 键盘快捷键，用 KeyboardEvent.code，比如 'Space'、'KeyC'、'Escape' */
  key?: string;
  w?: number;
  h?: number;
  /** primary 暖橙（默认），secondary 浅色 */
  style?: 'primary' | 'secondary';
  size?: number;
}

/** 加一个按钮，x, y 是按钮中心。点击或按快捷键都会触发，场景关闭时自动解绑。 */
export function addButton(scene: Phaser.Scene, options: ButtonOptions) {
  const { x, y, label, onClick, key, w = 340, h = 84, style = 'primary', size = 26 } = options;
  const skin = scene.add.image(0, 0, style === 'primary' ? 'btn_primary' : 'btn_secondary').setDisplaySize(w, h);
  const text = addText(scene, 0, -2, label, {
    size,
    weight: 700,
    align: 'center',
    color: style === 'primary' ? COLOR.cream : COLOR.ink,
    stroke: style === 'primary' ? '#a4521f' : undefined,
  });
  const button = scene.add.container(x, y, [skin, text]).setSize(w, h);
  button.setInteractive({ useHandCursor: true });

  let done = false;
  const press = () => {
    if (done || !button.active) return;
    playSound(scene, 'sfx_click');
    scene.tweens.add({ targets: button, scale: 0.94, duration: 60, yoyo: true });
    onClick();
  };
  button.on('pointerover', () => scene.tweens.add({ targets: button, scale: 1.05, duration: 120 }));
  button.on('pointerout', () => scene.tweens.add({ targets: button, scale: 1, duration: 120 }));
  button.on('pointerdown', press);

  if (key) {
    const off = listenKeys(scene, (event) => {
      if (event.code === key && button.visible) press();
    });
    button.once(Phaser.GameObjects.Events.DESTROY, () => {
      done = true;
      off();
    });
  }
  return button;
}

/**
 * 监听按键（不含按住不放的自动重复），场景关闭时自动解绑，返回取消监听的函数。
 * 为什么不用 this.input.keyboard.on：Phaser 的键盘事件按帧排队，切场景那一帧的按键会被新场景再收到一次，
 * 结果按一下空格连跳两个场景。直接监听浏览器事件就没有这个问题。
 */
export function listenKeys(scene: Phaser.Scene, handler: (event: KeyboardEvent) => void) {
  const onKey = (event: KeyboardEvent) => {
    if (!event.repeat && scene.sys.isActive()) handler(event);
  };
  window.addEventListener('keydown', onKey);
  const off = () => window.removeEventListener('keydown', onKey);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  return off;
}

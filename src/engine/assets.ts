// 素材：按 assets/manifest.json 交给 Phaser 加载，纹理和声音的 key 就是素材 ID。
// 文件缺失不会报错退出：图片换成带 ID 的灰色占位纹理（尺寸按 ASSETS.md 里写的），
// 声音改用 synth.ts 里的同名合成音，没有配方就静音。
import Phaser from 'phaser';
import manifest from '../../assets/manifest.json';
import assetsDoc from '../../assets/ASSETS.md?raw';
import { playRecipe, RECIPES, type PlayOptions } from './synth';

// 把 assets/ 下所有图片和声音交给 Vite 处理，得到可以加载的地址。
// 开发时是本地地址；npm run pack 时会变成内联数据，整个游戏只剩一个 index.html。
const FILES = import.meta.glob('/assets/**/*.{png,jpg,jpeg,webp,gif,svg,mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** manifest 里写的是 assets/... 相对路径，换成 Vite 给的地址；文件不存在时返回 undefined。 */
export function urlOf(path: string): string | undefined {
  return FILES[`/${path.replace(/^\.?\//, '')}`];
}

export interface AssetInfo {
  id: string;
  /** 分类，就是 images/ 下的文件夹名：bg、char、mob、tool…… */
  group: string;
  path: string;
  /** ASSETS.md 里登记的原图尺寸 */
  width: number;
  height: number;
  /** ASSETS.md 里的“画面”描述 */
  note: string;
}

const IMAGES = (manifest as { images?: Record<string, string> }).images ?? {};
const SOUNDS = (manifest as { sounds?: Record<string, string> }).sounds ?? {};

// 从 ASSETS.md 的表格行 | `id` | 宽×高 | 画面 | 读出尺寸和描述。
const DOC = new Map<string, { width: number; height: number; note: string }>();
for (const [, id, w, h, note] of assetsDoc.matchAll(/^\|\s*`([\w-]+)`\s*\|\s*(\d+)\s*[×x]\s*(\d+)\s*\|\s*(.*?)\s*\|\s*$/gm)) {
  DOC.set(id, { width: Number(w), height: Number(h), note });
}

/** 所有登记过的图片，按 manifest 的顺序。 */
export const IMAGE_LIST: AssetInfo[] = Object.entries(IMAGES).map(([id, path]) => {
  const doc = DOC.get(id);
  return {
    id,
    path,
    group: path.split('/').at(-2) ?? '',
    width: doc?.width ?? 256,
    height: doc?.height ?? 256,
    note: doc?.note ?? '',
  };
});

/** 还没放进来的素材文件路径。 */
export const missing: string[] = [];

/** 在 Boot 场景的 preload() 里调用：把 manifest 里的文件都排进 Phaser 的加载队列。 */
export function queueAssets(scene: Phaser.Scene) {
  for (const info of IMAGE_LIST) {
    const url = urlOf(info.path);
    if (url) scene.load.image(info.id, url);
    else missing.push(info.path);
  }
  for (const [id, path] of Object.entries(SOUNDS)) {
    const url = urlOf(path);
    if (url) scene.load.audio(id, url);
    else missing.push(path);
  }
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    missing.push(String(file.src ?? file.key));
  });
}

/** 在 Boot 场景的 create() 里调用：给加载失败或缺失的图片生成占位纹理。 */
export function makePlaceholders(scene: Phaser.Scene) {
  for (const info of IMAGE_LIST) {
    if (scene.textures.exists(info.id)) continue;
    // 占位图最长边 256，比例和原图一致，换成真图时位置和大小不会跳。
    const k = 256 / Math.max(info.width, info.height);
    const w = Math.round(info.width * k);
    const h = Math.round(info.height * k);
    const texture = scene.textures.createCanvas(info.id, w, h);
    if (!texture) continue;
    const g = texture.getContext();
    g.fillStyle = '#555';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#999';
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.fillStyle = '#ddd';
    g.font = '16px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(info.id, w / 2, h / 2);
    texture.refresh();
  }
  if (missing.length) console.info(`有 ${missing.length} 个素材还没放，正在使用占位或合成音：`, missing);
}

/** 有文件播文件，没有文件就播同名合成音。 */
export function playSound(scene: Phaser.Scene, id: string, { volume = 1, at }: PlayOptions = {}) {
  if (scene.cache.audio.exists(id)) {
    scene.sound.play(id, { volume });
    return;
  }
  const sound = scene.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
  playRecipe(sound.context ?? null, sound.destination ?? null, id, { volume, at });
}

/** 这个 ID 现在能不能出声（文件或合成音）。 */
export function canPlay(scene: Phaser.Scene, id: string) {
  return scene.cache.audio.exists(id) || id in RECIPES;
}

let music: Phaser.Sound.BaseSound | null = null;

/** 循环播放背景音乐，切场景不会断；再调一次就换曲。没有文件时静音。 */
export function playMusic(scene: Phaser.Scene, id: string, volume = 0.4) {
  if (music?.key === id && music.isPlaying) return;
  music?.destroy();
  music = null;
  if (!scene.cache.audio.exists(id)) return;
  music = scene.sound.add(id, { loop: true, volume });
  music.play();
}

export function stopMusic() {
  music?.destroy();
  music = null;
}

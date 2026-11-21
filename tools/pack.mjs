// 打包成一个文件：npm run pack → release/index.html。
// 图片、声音、代码全部内联进这一个文件，双击就能玩，也可以直接上传或发给别人。
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'vite';

process.env.PACK = '1';
await build({ logLevel: 'warn' });

const DIR = 'release';
let html = await readFile(`${DIR}/index.html`, 'utf8');

const scripts = [...html.matchAll(/<script type="module" crossorigin src="\.\/([^"]+\.js)"><\/script>/g)];
for (const [tag, file] of scripts) {
  const js = (await readFile(`${DIR}/${file}`, 'utf8')).replace(/<\/script/gi, '<\\/script');
  html = html.replace(tag, () => `<script type="module">${js}</script>`);
}
const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="\.\/([^"]+\.css)">/g)];
for (const [tag, file] of styles) {
  const css = await readFile(`${DIR}/${file}`, 'utf8');
  html = html.replace(tag, () => `<style>${css}</style>`);
}
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');

if (/(src|href)="\.\/assets\//.test(html)) throw new Error('打包失败：index.html 里还有没内联的文件');
await writeFile(`${DIR}/index.html`, html);
await rm(`${DIR}/assets`, { recursive: true, force: true });

const size = (Buffer.byteLength(html) / 1024 / 1024).toFixed(1);
console.log(`✅ 打包完成：${DIR}/index.html（${size} MB），目录里现在只有：${(await readdir(DIR)).join('、')}`);

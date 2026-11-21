import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

// 通过真实键盘完成练习单。传入 --offline 时在无网络的浏览器中打开单文件包。
const offline = process.argv.includes('--offline');
const server = offline ? null : await createServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 5198 } });
let browser;
const errors = [];

try {
  await server?.listen();
  const url = offline ? pathToFileURL(resolve('release/index.html')).href : server.resolvedUrls.local[0];
  const args = ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'];
  browser = await chromium.launch({ channel: 'chrome', args })
    .catch(() => chromium.launch({ channel: 'msedge', args }));
  const context = await browser.newContext({ offline, viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(url);
  await page.waitForFunction(() => globalThis.__game?.sceneName === 'title');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => globalThis.__game.sceneName === 'play');
  assert.equal(await page.evaluate(() => globalThis.__game.game.phase), 'tutorial', '开始后应进入练习单');

  async function moveTo(axis, target) {
    const position = await page.evaluate((coordinate) => globalThis.__game.debug().player[coordinate], axis);
    if (Math.abs(position - target) <= 12) return;
    const positive = position < target;
    const key = axis === 'x' ? positive ? 'KeyD' : 'KeyA' : positive ? 'KeyS' : 'KeyW';
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(({ axis, positive, target }) => {
        const position = globalThis.__game.debug().player[axis];
        return positive ? position >= target : position <= target;
      }, { axis, positive, target }, { timeout: 4000 });
    } finally {
      await page.keyboard.up(key);
    }
  }

  async function useStation(id) {
    assert.equal(await page.evaluate(() => globalThis.__game.debug().near), id);
    await page.keyboard.press('Space');
  }

  await page.keyboard.press('Digit1');
  await useStation('rack');
  await moveTo('x', 437);
  await useStation('heat');
  await page.waitForFunction(() => globalThis.__game.game.benches.heat?.completesAt === null);
  await useStation('heat');
  await moveTo('x', 583);
  await useStation('forge');
  await page.waitForFunction(() => {
    const { benches, elapsed } = globalThis.__game.game;
    return benches.forge?.completesAt !== null && benches.forge?.completesAt - elapsed <= 2280;
  });
  await page.keyboard.press('KeyF');
  assert.equal(await page.evaluate(() => globalThis.__game.game.benches.forge.piece.quality), 'precise');
  await page.waitForFunction(() => globalThis.__game.game.benches.forge?.completesAt === null);
  await useStation('forge');
  await moveTo('x', 729);
  await useStation('cool');
  await page.waitForFunction(() => globalThis.__game.game.benches.cool?.completesAt === null);
  await useStation('cool');
  await moveTo('x', 615);
  await moveTo('y', 430);
  await useStation('delivery');
  assert.equal(await page.evaluate(() => globalThis.__game.game.score), 25);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => globalThis.__game.sceneName === 'play' && globalThis.__game.game.phase === 'open');
  assert.equal(await page.evaluate(() => globalThis.__game.game.score), 0);
  await page.waitForFunction(() => globalThis.__phaser.sound.get('bgm_main')?.isPlaying);
  await mkdir('shots', { recursive: true });
  await page.screenshot({ path: offline ? 'shots/offline-gameplay.png' : 'shots/browser-gameplay.png' });
  assert.deepEqual(errors, []);
  console.log(`通过：${offline ? '断网单文件' : 'Vite 开发版'}完成实际键盘练习，精准小刀得 25 分，第一天从零分开始。`);
} finally {
  await browser?.close();
  await server?.close();
}

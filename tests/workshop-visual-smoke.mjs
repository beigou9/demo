import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const out = process.env.WORKSHOP_SHOTS;
if (out) await mkdir(out, { recursive: true });
const args = ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'];
const browser = await chromium.launch({ channel: 'chrome', args })
  .catch(() => chromium.launch({ channel: 'msedge', args }));
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) errors.push(String(response.status()) + ' ' + response.url()); });
const shot = file => out ? page.screenshot({ path: join(out, file + '.png') }) : undefined;
const key = code => page.keyboard.press(code);
const read = fn => page.evaluate(fn);
const wait = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 7000 });

async function move(axis, target) {
  const position = await page.evaluate(axis => globalThis.__game.debug().player[axis], axis);
  if (Math.abs(position - target) <= 9) return;
  const positive = position < target;
  const direction = axis === 'x' ? (positive ? 'KeyD' : 'KeyA') : (positive ? 'KeyS' : 'KeyW');
  await page.keyboard.down(direction);
  try {
    await wait(({ axis, target, positive }) => {
      const current = globalThis.__game.debug().player[axis];
      return positive ? current >= target : current <= target;
    }, { axis, target, positive });
  } finally {
    await page.keyboard.up(direction);
  }
}

async function use(id) {
  await wait(id => globalThis.__game.debug().near === id, id);
  await key('Space');
}

const indicator = id => page.evaluate(id => {
  const object = globalThis.__phaser.scene.getScene('play').children.getByName('workshop:station:' + id + ':indicator');
  return object?.visible ? object.fillColor : null;
}, id);
const effectVisible = id => page.evaluate(id =>
  Boolean(globalThis.__phaser.scene.getScene('play').children.getByName('workshop:fx:' + id)?.visible), id);
const ambient = () => read(() => {
  const { children } = globalThis.__phaser.scene.getScene('play');
  const light = children.getByName('workshop:ambient:forge');
  const ripple = children.getByName('workshop:ambient:ripple');
  return light?.visible && ripple?.visible ? { light: light.alpha, ripple: ripple.scaleX } : null;
});

try {
  await page.goto(process.env.WORKSHOP_URL || 'http://127.0.0.1:5173/');
  await wait(() => globalThis.__game?.sceneName === 'title');
  await shot('title');
  await key('Space');
  await wait(() => globalThis.__game?.game.phase === 'tutorial' && globalThis.__game?.sceneName === 'play' && globalThis.__game.debug?.());
  await shot('workshop');
  const initialAmbient = await ambient();
  await key('Digit1');
  await use('rack');
  assert.equal(await read(() => globalThis.__game.game.held?.blade), 'small');
  await move('x', 437);
  const empty = await indicator('heat');
  await use('heat');
  const processing = await indicator('heat');
  const laterAmbient = await ambient();
  await wait(() => {
    const { elapsed, benches } = globalThis.__game.game;
    return benches.heat?.completesAt - elapsed <= 3200;
  });
  const progress = await read(() => {
    const bar = globalThis.__phaser.scene.getScene('play').children.getByName('workshop:station:heat:progress');
    const playerX = globalThis.__game.debug().player.x;
    return bar?.visible ? { fraction: bar.scaleX, y: bar.y, distance: Math.abs(bar.x + bar.width / 2 - playerX) } : null;
  });
  await shot('heating');
  await wait(() => globalThis.__game.game.benches.heat?.completesAt === null);
  const ready = await indicator('heat');
  const readyAnimation = await effectVisible('icon_check');
  await shot('ready');
  await use('heat');

  await move('x', 583);
  await use('forge');
  await wait(() => {
    const { benches, elapsed } = globalThis.__game.game;
    return benches.forge?.completesAt != null && benches.forge.completesAt - elapsed <= 2150;
  });
  await key('KeyF');
  assert.equal(await read(() => globalThis.__game.game.benches.forge.piece.quality), 'precise');
  const sparks = await effectVisible('fx_spark');
  await shot('strike');
  await wait(() => globalThis.__game.game.benches.forge?.completesAt === null);
  await use('forge');
  await move('x', 729);
  await use('cool');
  await wait(() => globalThis.__game.game.benches.cool?.completesAt === null);
  const splash = await effectVisible('fx_splash');
  await shot('quench');
  await use('cool');

  await move('x', 319);
  await move('y', 430);
  await use('bufferA');
  await wait(() => globalThis.__game.game.benches.bufferA?.piece && !globalThis.__game.game.held);
  const stored = await indicator('bufferA');
  await shot('storage');
  await use('bufferA');
  await move('x', 615);
  await use('delivery');
  assert.equal(await read(() => globalThis.__game.game.score), 25);
  const delivered = await effectVisible('fx_star');
  await shot('delivery');
  await key('Enter');
  await wait(() => globalThis.__game.game.phase === 'open');
  assert.equal(await read(() => globalThis.__game.game.score), 0);
  await wait(() => !globalThis.__phaser.scene.getScene('play').children.getByName('workshop:fx:fx_star'));
  await shot('business');
  await key('Digit1');
  await use('rack');
  await move('x', 437);
  await use('heat');
  const originalOrder = await read(() => {
    const game = globalThis.__game.game;
    const order = game.orders[0];
    // Set up an expiring order. The normal frame update still drives expiration and the UI.
    game.elapsed = order.deadline - 1300;
    return order.id;
  });
  await shot('urgent');
  await wait(id => !globalThis.__game.game.orders.some(order => order.id === id)
    && !globalThis.__game.game.benches.heat && globalThis.__game.game.expired === 1, originalOrder);
  const reclaimed = await indicator('heat');
  await shot('expired');
  assert.deepEqual(errors, []);

  assert.equal(empty, null, '空工位没有状态灯');
  assert.ok(Number.isInteger(processing), '加工必须显示状态灯');
  assert.ok(progress && progress.fraction > 0.2 && progress.fraction < 0.9, '加工进度条应随实际加工时间填充');
  assert.ok(progress.y > 307 && progress.distance > 35, '靠近炉台时，进度条应位于状态牌下方并避开学徒');
  assert.ok(Number.isInteger(ready) && processing !== ready && readyAnimation,
    '加工完成使用独立的状态色并播放完成动画');
  assert.ok(Number.isInteger(stored) && stored !== ready && stored !== processing, '暂存用独立状态色');
  assert.equal(reclaimed, null, '订单超时回收时必须清除工位状态灯');
  assert.ok(sparks && splash && delivered, '精准锻打、冷却及交付反馈须实际进入渲染列表');
  assert.ok(initialAmbient && laterAmbient && initialAmbient.light !== laterAmbient.light
    && initialAmbient.ripple !== laterAmbient.ripple, '炉光和水波必须在正常渲染帧中变化');
  console.log('PASS: title, tutorial, movement, heating, finished state, precise strike, quench, storage, delivery, business, expiration, ambient animation, console.');
} finally {
  await browser.close();
}

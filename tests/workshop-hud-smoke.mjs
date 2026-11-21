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
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

const shot = name => out ? page.screenshot({ path: join(out, `${name}.png`) }) : undefined;
const wait = (predicate, value) => page.waitForFunction(predicate, value, { timeout: 9000 });
const sceneText = () => page.evaluate(() => {
  const scene = globalThis.__phaser.scene.getScene(globalThis.__game.sceneName);
  return scene.children.list.flatMap(object => typeof object.text === 'string' ? [object.text] : []);
});
const guideBounds = () => page.evaluate(() => {
  const scene = globalThis.__phaser.scene.getScene('play');
  const guide = scene.children.list.find(object => /^(老周：|领取订单后)/.test(object.text ?? ''));
  const { x, y, width, height } = guide.getBounds();
  const { left, top, width: canvasWidth, height: canvasHeight } = scene.game.canvas.getBoundingClientRect();
  return { x, y, width, height, lines: guide.getWrappedText(), left, top, canvasWidth, canvasHeight };
});

try {
  await page.goto(process.env.WORKSHOP_URL || 'http://127.0.0.1:5173/');
  await wait(() => globalThis.__game?.sceneName === 'title');
  await page.keyboard.press('Space');
  await wait(() => globalThis.__game.game.phase === 'tutorial' && globalThis.__game.debug?.());
  await shot('tutorial');
  const tutorialGuide = { viewportWidth: 1280, viewportHeight: 720, ...await guideBounds() };

  await page.keyboard.press('Enter');
  await wait(() => globalThis.__game.game.phase === 'open');

  const guideSizes = [];
  for (const [width, height] of [[1280, 720], [1024, 768], [820, 461], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    guideSizes.push({ viewportWidth: width, viewportHeight: height, ...await guideBounds() });
    if (width !== 1280) await shot(`viewport-${width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await wait(() => Math.abs(document.querySelector('canvas').getBoundingClientRect().width - 1280) < 1);

  const dayLabels = [];
  const summaries = [];
  for (const number of [1, 2, 3]) {
    await wait(day => globalThis.__game.debug?.() && globalThis.__game.game.phase === 'open'
      && globalThis.__game.game.day === day, number);
    dayLabels.push((await sceneText()).find(text => /^(第\s*)?\d(\s*天)?\s*\/\s*3$/.test(text)));
    await shot(`day-${number}`);
    // Use an end-of-day fixture to reach every real render path without faking a playthrough.
    await page.evaluate(() => {
      const { game, config } = globalThis.__game;
      const day = config.days[game.day - 1];
      game.score = day.target;
      game.elapsed = day.duration - 15;
    });
    await wait(day => globalThis.__game.sceneName === 'summary'
      && globalThis.__game.game.report?.day === day, number);
    summaries.push((await sceneText()).find(text => text.endsWith('天收工')));
    await shot(`summary-${number}`);
    await page.keyboard.press('Space');
  }
  await wait(() => globalThis.__game.sceneName === 'summary' && globalThis.__game.game.phase === 'final'
    && globalThis.__phaser.scene.getScene('summary').children.list.some(item => item.text === '学徒出师'));
  await shot('final');
  assert.equal((await sceneText()).filter(text => /^第 \d 天　/.test(text)).length, 3);

  const defects = [];
  if (dayLabels.join('|') !== '1 / 3|2 / 3|3 / 3') defects.push(`Expected 1 / 3 through 3 / 3, got ${dayLabels.join(' | ')}`);
  assert.deepEqual(summaries, ['第 1 天收工', '第 2 天收工', '第 3 天收工']);
  for (const guide of [tutorialGuide, ...guideSizes]) {
    if (guide.x < 946 || guide.x + guide.width > 1216 || guide.y < 494 || guide.y + guide.height > 576) {
      defects.push(`Guide extends into the inner padding (${guide.x}, ${guide.y}, ${guide.width}, ${guide.height})`);
    }
    const verticalCenter = guide.y + guide.height / 2;
    if (Math.abs(verticalCenter - 535) > 2 || guide.lines.some(line => /^[，。！：）、]/.test(line))) {
      defects.push(`Guide is not centered or has a leading punctuation mark: ${guide.lines.join(' | ')}`);
    }
    if (guide.width && guide.canvasWidth) {
      const clientRight = guide.left + (guide.x + guide.width) * guide.canvasWidth / 1280;
      const clientBottom = guide.top + (guide.y + guide.height) * guide.canvasHeight / 720;
      if (guide.left < -1 || guide.top < -1 || clientRight > guide.viewportWidth + 1
        || clientBottom > guide.viewportHeight + 1 || Math.abs(guide.canvasWidth / guide.canvasHeight - 16 / 9) > 0.02) {
        defects.push('Guide is clipped or the canvas is stretched after resizing');
      }
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(defects, []);
  console.log('PASS: all day counters, daily and final summaries, guide padding and wrapping at four viewport sizes.');
} finally {
  await browser.close();
}

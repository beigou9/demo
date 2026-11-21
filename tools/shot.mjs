// 截图自检：自己开一个开发服务器，用本机 Chrome（没有就用 Edge）在后台打开游戏，
// 一路按空格往前走，每进入一个新场景截一张图到 shots/，最后打印文字报告：
// 场景、游戏状态、画面是不是空的、控制台报错、还缺哪些素材。看不了图片的 AI 也能读报告。
//
// 用法：npm run shot              走完整个流程
//       npm run shot -- play      截到 play 场景就停
//
// 某个场景不是按空格前进的，脚本会停在那里并说明，这是正常的。
import { mkdir, rm } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const stopAt = process.argv[2];
const OUT = 'shots';
const MAX_STEPS = 60;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const server = await createServer({ logLevel: 'error', server: { port: 5199, host: '127.0.0.1', open: false } });
await server.listen();
const url = `${server.resolvedUrls.local[0]}?shot`;

async function launch() {
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'];
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless: true, args });
    } catch {
      // 试下一个浏览器
    }
  }
  throw new Error('没找到 Chrome 或 Edge。请先安装 Google Chrome，再运行 npm run shot');
}

const errors = [];
let browser;
try {
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => {
    // 加载失败另外按地址报告（下面的 response），这里跳过浏览器那条不带地址的提示
    if (m.text().startsWith('Failed to load resource')) return;
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`[加载失败 ${r.status()}] ${r.url()}`);
  });
  page.on('pageerror', (e) => errors.push(`[页面报错] ${e.message}`));

  await page.goto(url);
  await page.waitForFunction(() => globalThis.__game?.sceneName, null, { timeout: 30_000 });

  const seen = new Set();
  let lastScene = '';
  let samePresses = 0;
  let shots = 0;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const ctx = globalThis.__game;
      // 把所有画布叠起来，统计颜色种类和平均亮度，判断画面是不是空的。
      const { width, height } = ctx.config.view;
      const probe = document.createElement('canvas');
      probe.width = width / 4;
      probe.height = height / 4;
      const pg = probe.getContext('2d');
      for (const c of document.querySelectorAll('canvas')) pg.drawImage(c, 0, 0, probe.width, probe.height);
      const data = pg.getImageData(0, 0, probe.width, probe.height).data;
      const colors = new Set();
      let light = 0;
      for (let i = 0; i < data.length; i += 4) {
        colors.add(((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4));
        light += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      return {
        scene: ctx.sceneName,
        state: JSON.stringify(ctx.game).slice(0, 200),
        colors: colors.size,
        brightness: Math.round(light / (data.length / 4)),
        extra: ctx.debug?.() ?? null,
      };
    });

    if (!seen.has(info.scene)) {
      seen.add(info.scene);
      shots += 1;
      const file = `${OUT}/${String(shots).padStart(2, '0')}-${info.scene}.png`;
      await page.screenshot({ path: file });
      const blank = info.colors < 4 ? '　⚠ 画面几乎是纯色，可能什么都没画出来' : '';
      console.log(`📸 ${file}`);
      console.log(`   场景 ${info.scene}　游戏状态 ${info.state}`);
      console.log(`   画面颜色 ${info.colors} 种　平均亮度 ${info.brightness}/255${blank}`);
      if (info.extra) console.log(`   ${JSON.stringify(info.extra)}`);
    }

    if (info.scene === stopAt) break;

    samePresses = info.scene === lastScene ? samePresses + 1 : 0;
    lastScene = info.scene;
    if (samePresses >= 3) {
      console.log(`⏸ 停在 ${info.scene}：连按空格不再切换场景。这个场景本来就不靠空格前进的话，属于正常。`);
      break;
    }
    await page.keyboard.press('Space');
  }

  const missing = await page.evaluate(() => globalThis.__game.missing.length);
  if (missing) console.log(`ℹ 还有 ${missing} 个素材文件没放，用的是占位（不算错误）`);
} finally {
  await browser?.close();
  await server.close();
}

if (errors.length) {
  console.log(`\n❌ 控制台有 ${errors.length} 条报错或警告：`);
  for (const e of errors) console.log(`   ${e}`);
  process.exitCode = 1;
} else {
  console.log('\n✅ 控制台没有报错');
}

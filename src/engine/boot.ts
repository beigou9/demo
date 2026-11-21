// 启动场景：显示加载进度，按 manifest 加载所有素材，缺的补占位，然后进标题。
import { BaseScene } from './scenes';
import { makePlaceholders, queueAssets } from './assets';
import { COLOR, hex } from './ui';

export class BootScene extends BaseScene {
  constructor() {
    super('boot');
  }

  preload() {
    const { width, height } = this.ctx.config.view;
    this.cameras.main.setBackgroundColor(COLOR.paper);
    const barW = 420;
    this.add.rectangle(width / 2, height / 2 + 30, barW, 14, hex('#e6d9bd')).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - barW / 2, height / 2 + 30, 0, 14, hex(COLOR.orange)).setOrigin(0, 0.5);
    this.label(width / 2, height / 2 - 20, '加载中…', { size: 28, align: 'center', weight: 700 });
    this.load.on('progress', (p: number) => bar.setSize(barW * p, 14));
    queueAssets(this);
  }

  create() {
    makePlaceholders(this);
    // 等 create 跑完再切走，否则 Boot 会停不干净
    this.time.delayedCall(0, () => this.ctx.go('title'));
  }
}

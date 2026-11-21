import type Phaser from 'phaser';
import type { StationId } from '../core/game';
import type { BaseScene } from '../engine/scenes';
import { workshopSoftDisc, WORKSHOP_PALETTE } from './workshop-room';

export interface WorkshopStation {
  id: StationId;
  x: number;
  y: number;
  label: string;
}

type BenchState = 'idle' | 'working' | 'ready' | 'stored';
type Prop = readonly [id: string, dx: number, dy: number, width: number, angle?: number];

const dressings: Record<StationId, readonly Prop[]> = {
  rack: [['tile_crate', -22, 13, 52], ['mat_iron_ore', 20, 10, 36, -0.13], ['mat_iron_ingot', 1, 14, 25]],
  shape: [['tool_mold', -5, 8, 72], ['tool_tongs', 34, 13, 30, -0.44]],
  heat: [['tool_bellows', -33, 12, 36], ['tool_furnace_hot', -4, 14, 85], ['mat_charcoal', 39, 15, 23]],
  forge: [['anvil', -7, 12, 76], ['hammer_small', 35, 14, 23, -0.87]],
  cool: [['tool_quench_bucket', -7, 13, 66], ['tool_tongs', 31, 14, 29, -0.46]],
  finish: [['tool_whetstone', -9, 12, 71], ['item_scrap', 36, 12, 24]],
  bufferA: [],
  bufferB: [],
  delivery: [['item_tray_silk', -6, 13, 70], ['item_order_slip', 34, 13, 23, 0.22]],
};

const finishes: Record<StationId, number> = {
  rack: 0x89603f, shape: 0xaa7950, heat: 0x794c42, forge: 0x695958, cool: 0x5d7a75,
  finish: 0x6b7770, bufferA: 0x577462, bufferB: 0x577462, delivery: 0x974b3e,
};

const indicators = { idle: 0, working: 0xffbf62, ready: 0xaee282, stored: 0xa2d7df };
const statusText = { idle: '#fff3d2', working: '#ffd38e', ready: '#def4b7', stored: '#dcf1ef' };

function paintBench(parent: BaseScene, station: WorkshopStation) {
  const { x, y, id } = station;
  const trim = finishes[id];
  workshopSoftDisc(parent, x + 10, y + 28, 148, 42, 'shadow').setAlpha(0.62).setDepth(-78);
  parent.add.ellipse(x + 2, y + 32, 108, 13, 0x452b23, 0.20).setDepth(-77);
  const g = parent.add.graphics().setPosition(x, y).setDepth(y + 24);
  g.fillStyle(0x513128).fillRoundedRect(-52, 5, 104, 29, 6);
  g.fillStyle(0x7a4933).fillRoundedRect(-46, 7, 15, 26, 4);
  g.fillRoundedRect(31, 7, 15, 26, 4);
  g.fillStyle(0x59372b).fillRoundedRect(-47, 28, 17, 5, 2).fillRoundedRect(30, 28, 17, 5, 2);
  g.lineStyle(1, 0xf0b47d, 0.35).lineBetween(-42, 23, -42, 30).lineBetween(34, 23, 34, 30);
  g.fillStyle(0x643b2d).fillRoundedRect(-55, -9, 110, 32, 6);
  g.lineStyle(2, 0x4f3025).strokeRoundedRect(-55, -9, 110, 32, 6);
  g.fillStyle(0x86553b).fillRoundedRect(-49, 12, 98, 8, 2);
  g.fillStyle(0xa16b49).fillRoundedRect(-54, -25, 108, 40, 8);
  g.lineStyle(2, 0x56352a).strokeRoundedRect(-54, -25, 108, 40, 8);
  g.fillStyle(0xc59562).fillRoundedRect(-48, -22, 96, 31, 5);
  g.fillStyle(0x593e31, 0.68).fillRoundedRect(-44, -21, 89, 28, 5);
  g.fillStyle(trim).fillRoundedRect(-41, -18, 83, 23, 3);
  g.fillStyle(0xefca97, 0.13).fillRoundedRect(-40, -17, 79, 12, 3);
  g.lineStyle(1.2, 0xffdb9a, 0.55).lineBetween(-40, -18, 40, -18);
  g.lineStyle(1.2, 0xf2bf83, 0.62).lineBetween(-49, 11, 49, 11);
  g.lineStyle(1, 0xe6b079, 0.44).lineBetween(-46, 16, -27, 16).lineBetween(28, 18, 47, 18);
  g.lineStyle(1, 0x4b2c23, 0.65).lineBetween(-37, 21, 36, 21);
  g.fillStyle(0x604031).fillRoundedRect(-21, 15, 42, 7, 2);
  g.fillStyle(0xe0b575).fillRoundedRect(-9, 16, 18, 3, 1).fillCircle(-46, 16, 2.2).fillCircle(46, 16, 2.2);
  g.fillStyle(0xf9d8a1, 0.8).fillCircle(-46.5, 15.6, 0.85).fillCircle(45.5, 15.6, 0.85);
  if (id === 'bufferA' || id === 'bufferB') {
    g.lineStyle(1.2, 0xffe5ae, 0.57).strokeRoundedRect(-29, -15, 58, 16, 3);
    for (let x = -26; x <= 26; x += 5) g.lineBetween(x, -13, x + 2, -13).lineBetween(x, -1, x + 2, -1);
  }
  for (const [art, dx, dy, width, angle = 0] of dressings[id]) {
    g.fillStyle(0x362925, 0.27).fillEllipse(dx + 4, Math.min(dy - 4, 8), width * 0.87, Math.max(5, width * 0.12));
    parent.art(art, x + dx, y + dy, width).setOrigin(0.5, 0.87).setRotation(angle).setDepth(y + 25);
  }
}

export class WorkshopBench {
  readonly piece: Phaser.GameObjects.Image;
  private readonly highlight: Phaser.GameObjects.Graphics;
  private readonly lamp: Phaser.GameObjects.Arc;
  private readonly status: Phaser.GameObjects.Text;
  private readonly progress: Phaser.GameObjects.Rectangle;
  private readonly progressTrack: Phaser.GameObjects.Rectangle;
  private state: BenchState = 'idle';
  private focus: 'none' | 'near' | 'tutorial' = 'none';

  constructor(private readonly scene: BaseScene, readonly station: WorkshopStation) {
    const { id, x, y, label } = station;
    paintBench(scene, station);
    this.highlight = scene.add.graphics().setPosition(x, y).setDepth(-65);
    const nameplate = scene.add.graphics().setDepth(y + 38);
    nameplate.fillStyle(0x3c2a23, 0.45).fillRoundedRect(x - 44, y + 32, 88, 23, 4);
    nameplate.fillStyle(0x2c473a).fillRoundedRect(x - 44, y + 30, 88, 23, 4);
    nameplate.lineStyle(1.4, 0xd2a672).strokeRoundedRect(x - 44, y + 30, 88, 23, 4);
    nameplate.lineStyle(1, 0x85a487, 0.60).lineBetween(x - 37, y + 32, x + 37, y + 32);
    scene.label(x, y + 42, label, { size: 15, align: 'center', weight: 700, color: WORKSHOP_PALETTE.cream }).setDepth(y + 39);
    this.status = scene.label(x, y + 65, '', { size: 13, align: 'center', weight: 700, color: statusText.idle }).setDepth(640);
    this.status.setBackgroundColor('#58402f');
    this.status.setPadding(4, 0, 4, 1);
    if (id !== 'rack' && id !== 'delivery') {
      scene.add.circle(x + 48, y + 8, 5, 0x493a31).setStrokeStyle(1.3, 0xbfa376).setDepth(y + 30);
    }
    this.lamp = scene.add.circle(x + 48, y + 8, 3.6, 0xffffff).setStrokeStyle(1, 0xffeac1, 0.67)
      .setDepth(y + 31).setVisible(false).setName(`workshop:station:${id}:indicator`);
    this.progressTrack = scene.add.rectangle(x, y + 77, 48, 5, 0x432e25).setDepth(641).setVisible(false);
    this.progress = scene.add.rectangle(x - 23, y + 77, 46, 3, indicators.working)
      .setOrigin(0, 0.5).setDepth(642).setVisible(false).setName(`workshop:station:${id}:progress`);
    this.piece = scene.art('iron_dark', x + (id.startsWith('buffer') ? 0 : 30), y + 1, 35)
      .setDepth(y + 29).setVisible(false);
  }

  update(state: BenchState, status: string, playerX: number | null, tutorial: boolean, progress: number) {
    const focus = playerX !== null ? 'near' : tutorial ? 'tutorial' : 'none';
    if (this.focus !== focus) {
      this.focus = focus;
      this.highlight.clear();
      if (focus !== 'none') {
        const color = focus === 'near' ? 0xffda87 : 0x9ada98;
        this.highlight.fillStyle(color, 0.19).fillRoundedRect(-65, -33, 130, 69, 12);
        this.highlight.lineStyle(3, color, 0.9).strokeRoundedRect(-65, -33, 130, 69, 12);
      }
    }
    if (this.state !== state) {
      if (this.state === 'working' && state === 'ready') {
        playWorkshopEffect(this.scene, 'icon_check', this.station, 25, 590);
      }
      this.state = state;
      this.lamp.setFillStyle(indicators[state]).setVisible(state !== 'idle');
      this.scene.tweens.killTweensOf(this.lamp);
      if (state !== 'idle') {
        this.lamp.setScale(0.75);
        this.scene.tweens.add({ targets: this.lamp, scale: 1, duration: 180, ease: 'Sine.out' });
      }
      this.status.setColor(statusText[state]);
    }
    const statusOffset = playerX === null ? 0 : playerX > this.station.x ? -48 : 48;
    const statusX = this.station.x + statusOffset;
    this.status.setX(statusX).setVisible(status !== '').setText(status);
    this.progressTrack.setX(statusX).setVisible(state === 'working');
    this.progress.setX(statusX - this.progress.width / 2).setVisible(state === 'working')
      .setScale(Math.max(0.02, Math.min(1, progress)), 1);
  }
}

export function lightWorkshopFurnace(scene: BaseScene, { x, y }: WorkshopStation) {
  const warmth = workshopSoftDisc(scene, x + 5, y + 25, 194, 99, 'fire')
    .setAlpha(0.25).setDepth(-75).setName('workshop:ambient:forge');
  const fire = workshopSoftDisc(scene, x - 4, y - 7, 35, 27, 'fire')
    .setAlpha(0.31).setBlendMode('ADD').setDepth(y + 26);
  scene.tweens.add({ targets: warmth, alpha: 0.42, duration: 1230, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: fire, alpha: 0.52, y: y - 10, duration: 467, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  for (const [offset, duration] of [[-9, 1170], [9, 1590], [1, 1850]]) {
    const ember = scene.add.circle(x + offset, y - 18, 2, 0xffd384, 0.85).setDepth(y + 27);
    scene.tweens.add({
      targets: ember, x: x + offset * 2, y: y - 51, alpha: 0, duration,
      repeat: -1, repeatDelay: 170, ease: 'Quad.out',
    });
  }
}

export function rippleWorkshopWater(scene: BaseScene, { x, y }: WorkshopStation) {
  const reflection = scene.add.ellipse(x - 7, y - 29, 20, 5)
    .setStrokeStyle(1.15, 0xe6f5ed).setDepth(y + 26).setName('workshop:ambient:ripple');
  scene.tweens.add({
    targets: reflection, alpha: { from: 0.45, to: 0 }, scaleX: { from: 0.55, to: 1.60 }, scaleY: { from: 0.60, to: 1.35 },
    duration: 1600, repeat: -1, repeatDelay: 660, ease: 'Sine.out',
  });
}

export function playWorkshopEffect(scene: BaseScene, id: string, station: WorkshopStation, width: number, duration = 570) {
  const rise = id === 'fx_splash' ? 17 : 33;
  const offset = id === 'icon_check' ? 39 : id === 'fx_steam' ? 24 : 0;
  const effect = scene.art(id, station.x + offset, station.y - 21, width)
    .setDepth(665).setName(`workshop:fx:${id}`);
  scene.tweens.add({
    targets: effect, y: effect.y - rise, scaleX: effect.scaleX * 1.08, scaleY: effect.scaleY * 1.08,
    alpha: 0, duration, ease: 'Quad.out', onComplete: () => effect.destroy(),
  });
  if (id === 'fx_star' || id === 'fx_spark') {
    for (const [dx, dy] of [[-30, -10], [19, -24], [35, -2]]) {
      const mote = scene.add.circle(station.x + dx / 2, station.y - 20 + dy / 2, 2.5, 0xffd485).setDepth(664);
      scene.tweens.add({
        targets: mote, x: station.x + dx, y: station.y + dy - 35, alpha: 0, duration: duration * 0.75,
        ease: 'Quad.out', onComplete: () => mote.destroy(),
      });
    }
  }
}

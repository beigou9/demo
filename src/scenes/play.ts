import type Phaser from 'phaser';
import {
  forgeProgress, interact, nextStep, startBusiness, strike, tick,
  type GameState, type Interaction, type Order, type Piece, type StationId,
} from '../core/game';
import { BaseScene } from '../engine/scenes';

const INK = '#422e25';
const PAPER = '#fff1d2';
const GREEN = '#294b3d';
const AMBER = '#9a4b22';

const STATIONS = [
  { id: 'rack', x: 145, y: 237, label: '料架', art: 'tile_crate' },
  { id: 'shape', x: 291, y: 237, label: '整坯台', art: 'tool_mold' },
  { id: 'heat', x: 437, y: 237, label: '炉台', art: 'tool_furnace_hot' },
  { id: 'forge', x: 583, y: 237, label: '铁砧', art: 'anvil' },
  { id: 'cool', x: 729, y: 237, label: '冷却槽', art: 'tool_quench_bucket' },
  { id: 'bufferA', x: 319, y: 504, label: '暂存一', art: '' },
  { id: 'bufferB', x: 470, y: 504, label: '暂存二', art: '' },
  { id: 'delivery', x: 615, y: 504, label: '交付台', art: 'item_tray_silk' },
  { id: 'finish', x: 773, y: 504, label: '修整台', art: 'tool_whetstone' },
] as const satisfies ReadonlyArray<{ id: StationId; x: number; y: number; label: string; art: string }>;

type Station = (typeof STATIONS)[number];
type Direction = 'left' | 'right' | 'up' | 'down';
type Text = Phaser.GameObjects.Text;

const CUSTOMER = {
  small: 'char_merchant_neutral',
  kitchen: 'char_auntie_neutral',
  firewood: 'char_guard_neutral',
} as const;

interface StationView {
  outline: Phaser.GameObjects.Rectangle;
  piece: Phaser.GameObjects.Image;
  status: Text;
}

interface OrderView {
  panel: Phaser.GameObjects.Rectangle;
  knife: Phaser.GameObjects.Image;
  customer: Phaser.GameObjects.Image;
  name: Text;
  status: Text;
  time: Text;
}

const seconds = (ms: number) => String(Math.max(0, Math.ceil(ms / 1000))).padStart(2, '0');

export class PlayScene extends BaseScene {
  private stationViews = new Map<StationId, StationView>();
  private orderViews: OrderView[] = [];
  private movement: Partial<Record<Direction, Phaser.Input.Keyboard.Key[]>> = {};
  private selectedId: number | null = null;
  private near: Station | null = null;
  private noticeExpires = 0;
  private player!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private carried!: Phaser.GameObjects.Image;
  private coach!: Phaser.GameObjects.Image;
  private clock!: Text;
  private score!: Text;
  private dayLabel!: Text;
  private notice!: Text;
  private instructions!: Text;
  private handLabel!: Text;
  private forgeMeter!: Phaser.GameObjects.Graphics;
  private startButton!: Phaser.GameObjects.Container;

  constructor() {
    super('play');
  }

  create() {
    this.selectedId = null;
    this.noticeExpires = 0;
    this.stationViews.clear();
    this.drawWorkshop();
    for (const station of STATIONS) this.createStation(station);
    this.createHud();

    this.shadow = this.add.ellipse(145, 315, 39, 13, 0x40291d, 0.22).setDepth(4);
    this.player = this.art(this.texture('char_apprentice_topdown', 'char_apprentice_neutral'), 145, 313, 62)
      .setOrigin(0.5, 1).setDepth(8);
    this.carried = this.art('iron_dark', 0, 0, 37).setDepth(9);
    this.handLabel = this.label(0, 0, '', { size: 15, weight: 700, align: 'center', color: PAPER, stroke: INK }).setDepth(10);
    this.forgeMeter = this.add.graphics().setDepth(12);

    const keyboard = this.input.keyboard;
    const keys = (...names: string[]) => keyboard ? names.map((name) => keyboard.addKey(name)) : [];
    this.movement = { left: keys('A', 'LEFT'), right: keys('D', 'RIGHT'), up: keys('W', 'UP'), down: keys('S', 'DOWN') };
    this.onKey((event) => this.handleKey(event.code));
    this.ctx.debug = () => ({ player: { x: this.player.x, y: this.player.y }, near: this.near?.id ?? null });
    this.events.once('shutdown', () => {
      this.ctx.debug = undefined;
      this.music();
    });
    if (this.ctx.game.phase === 'open') this.music('bgm_main');
    this.refresh();
  }

  update(_time: number, delta: number) {
    const game = this.ctx.game;
    const events = tick(game, this.ctx.config, delta);
    if (game.phase === 'report') {
      this.ctx.go('summary');
      return;
    }
    if (events.expired) this.showNotice(`${events.expired} 张订单超时，刀坯已回收`);
    if (events.cooled) {
      this.sfx('sfx_hiss');
      this.effect('fx_steam', STATIONS[4]);
    }
    this.move(delta);
    this.refresh();
  }

  private drawWorkshop() {
    this.cameras.main.setBackgroundColor('#e8dac0');
    const floor = this.add.graphics();
    floor.fillStyle(0x294b3d).fillRoundedRect(24, 21, 1232, 90, 16);
    floor.fillStyle(0x9b6948).fillRoundedRect(24, 133, 865, 529, 16);
    floor.fillStyle(0xe9c79a).fillRoundedRect(37, 146, 839, 503, 11);
    floor.lineStyle(1, 0xbc8d65, 0.5);
    for (let y = 190; y < 646; y += 40) floor.lineBetween(39, y, 874, y);
    floor.fillStyle(0xf8edcf).fillRoundedRect(906, 133, 350, 529, 16);
    floor.lineStyle(2, 0xd9bb94).strokeRoundedRect(906, 133, 350, 529, 16);
    this.label(50, 53, '老周的铁匠铺', { size: 31, color: PAPER, weight: 700 });
    this.label(50, 87, 'WASD 移动   ·   1–3 选单   ·   空格 操作   ·   F 落锤', { size: 17, color: '#e0e8cf' });
    this.label(54, 167, '加工区', { size: 16, color: INK, weight: 700 });
    this.label(54, 628, '暂存与交付', { size: 16, color: INK, weight: 700 });
    this.label(929, 162, '订单', { size: 25, color: GREEN, weight: 700 });
  }

  private createStation(station: Station) {
    const { x, y, art, label } = station;
    const table = this.add.graphics();
    table.fillStyle(0x7f4f34).fillRoundedRect(x - 56, y - 21, 112, 57, 10);
    table.fillStyle(0xaa7149).fillRoundedRect(x - 56, y - 26, 112, 49, 10);
    table.fillStyle(0xc99563).fillRoundedRect(x - 50, y - 23, 100, 34, 7);
    if (art) this.art(art, x, y + 16, station.id === 'heat' ? 91 : 72).setOrigin(0.5, 0.85);
    const outline = this.add.rectangle(x, y + 4, 121, 73).setStrokeStyle(3, 0xfff2aa);
    this.label(x, y + 54, label, { size: 18, align: 'center', weight: 700 }).setDepth(11);
    const status = this.label(x, y + 76, '', { size: 15, align: 'center', color: GREEN, weight: 700 }).setDepth(11);
    const piece = this.art('iron_dark', x + 32, y + 12, 37).setDepth(2).setVisible(false);
    this.stationViews.set(station.id, { outline, piece, status });
  }

  private createHud() {
    this.dayLabel = this.label(676, 50, '', { size: 22, color: PAPER, weight: 700, align: 'center' });
    this.clock = this.label(859, 64, '', { size: 27, color: PAPER, weight: 700, align: 'center' });
    this.score = this.label(1227, 64, '', { size: 23, color: PAPER, weight: 700, align: 'right' });
    this.notice = this.label(34, 690, '', { size: 19, weight: 700, color: GREEN });
    this.orderViews = Array.from({ length: 3 }, (_, index) => {
      const y = 222 + index * 102;
      const panel = this.add.rectangle(1081, y, 307, 88, 0xfff7e7).setStrokeStyle(2, 0xd9bb94);
      const customer = this.art('char_auntie_neutral', 954, y + 3, 37);
      const knife = this.art('item_knife', 993, y + 2, 42);
      const name = this.label(1022, y - 18, '', { size: 19, weight: 700 });
      const status = this.label(1022, y + 15, '', { size: 15, color: GREEN });
      const time = this.label(1221, y + 15, '', { size: 16, align: 'right', weight: 700 });
      return { panel, customer, knife, name, status, time };
    });
    this.coach = this.art('char_laozhou_neutral', 949, 546, 56);
    this.instructions = this.label(982, 491, '', { size: 17, color: INK, wrap: 247 });
    this.startButton = this.button({
      x: 1081, y: 619, w: 295, h: 51, size: 19, label: '进入第一天（Enter）', key: 'Enter',
      onClick: () => {
        if (this.ctx.game.phase !== 'tutorial') return;
        startBusiness(this.ctx.game, this.ctx.config);
        this.selectedId = null;
        this.player.setPosition(145, 313);
        this.music('bgm_main');
        this.showNotice('开门营业，先选一张订单');
        this.refresh();
      },
    });
  }

  private handleKey(code: string) {
    const game = this.ctx.game;
    if (game.phase !== 'tutorial' && game.phase !== 'open') return;
    if (/^Digit[1-3]$/.test(code)) {
      const slot = Number(code.at(-1));
      const order = game.orders.find((candidate) => candidate.slot === slot);
      if (order) this.selectedId = order.id;
      else this.showNotice(`当前没有 #${slot} 订单`);
      this.refresh();
      return;
    }
    if (code === 'Space') {
      if (this.near) {
        const slot = game.orders.find(({ id }) => id === this.selectedId)?.slot;
        this.feedback(interact(game, this.ctx.config, this.near.id, slot));
      } else this.showNotice('走到工位旁，等它亮起再按空格');
      this.refresh();
    }
    if (code === 'KeyF') {
      if (this.near?.id === 'forge') this.feedback(strike(game, this.ctx.config));
      else this.showNotice('走到铁砧旁才可以落锤');
      this.refresh();
    }
  }

  private move(delta: number) {
    const pressed = (direction: Direction) => Number(this.movement[direction]?.some((key) => key.isDown) ?? false);
    const dx = pressed('right') - pressed('left');
    const dy = pressed('down') - pressed('up');
    if (!dx && !dy) return;

    const step = Math.min(50, delta) * this.ctx.config.game.speed / (1000 * Math.hypot(dx, dy));
    const x = Math.min(852, Math.max(60, this.player.x + dx * step));
    const y = Math.min(612, Math.max(194, this.player.y + dy * step));
    const blocked = (x: number, y: number) => STATIONS.some((station) =>
      Math.abs(station.x - x) < 59 && Math.abs(station.y + 10 - y) < 35);
    if (!blocked(x, this.player.y)) this.player.x = x;
    if (!blocked(this.player.x, y)) this.player.y = y;
    if (dx) this.player.setFlipX(dx < 0);
  }

  private refresh() {
    const game = this.ctx.game;
    const config = this.ctx.config;
    const tutorial = game.phase === 'tutorial';
    const day = config.days[game.day - 1];
    this.near = this.nearestStation();
    this.shadow.setPosition(this.player.x, this.player.y);
    this.dayLabel.setText(tutorial ? '练习单' : `第 ${game.day} 天 / ${config.days.length}`);
    this.clock.setText(tutorial ? '不限时' : `收工 ${seconds(day.duration - game.elapsed)} 秒`);
    this.score.setText(tutorial ? `${game.score} 分` : `${game.score} / ${day.target} 分`);
    this.notice.setText(game.elapsed < this.noticeExpires ? this.notice.text : '');
    this.startButton.setVisible(tutorial);
    this.coach.setVisible(tutorial);
    this.instructions.setX(tutorial ? 982 : 930).setText(tutorial ? this.tutorialHint(game) :
      '领取订单后，按提示搬运刀坯。工位完成加工即可取回，赶不及的半成品可先暂存。');
    this.refreshStations(game);
    this.refreshOrders(game);

    const held = game.held;
    this.carried.setVisible(Boolean(held)).setPosition(this.player.x + 28, this.player.y - 27);
    this.handLabel.setVisible(Boolean(held)).setPosition(this.player.x + 3, this.player.y + 15);
    if (held) {
      this.carried.setTexture(this.pieceArt(held)).setDisplaySize(42, 42);
      const next = nextStep(held, config);
      this.handLabel.setText(`#${game.orders.find(({ id }) => id === held.orderId)?.slot} · ${next ? config.steps[next].label : '交付'}`);
    }

    this.drawForgeMeter(game);
  }

  private nearestStation() {
    let closest: Station | null = null;
    let distance: number = this.ctx.config.game.reach;
    for (const station of STATIONS) {
      const candidate = Math.hypot(station.x - this.player.x, station.y + 10 - this.player.y);
      if (candidate < distance) {
        closest = station;
        distance = candidate;
      }
    }
    return closest;
  }

  private refreshStations(game: GameState) {
    const tutorialTarget = game.phase === 'tutorial' && !game.delivered
      ? game.held ? nextStep(game.held, this.ctx.config) ?? 'delivery' : Object.keys(game.benches)[0] ?? 'rack'
      : null;
    for (const [id, view] of this.stationViews) {
      const bench = id === 'rack' || id === 'delivery' ? null : game.benches[id];
      const selected = this.near?.id === id;
      view.outline.setVisible(selected || tutorialTarget === id).setStrokeStyle(3, selected ? 0xfff2aa : 0x399b66);
      view.piece.setVisible(Boolean(bench));
      view.status.setText(selected ? '空格' : '');
      if (bench) {
        view.piece.setTexture(this.pieceArt(bench.piece)).setDisplaySize(37, 37);
        const slot = game.orders.find(({ id }) => id === bench.piece.orderId)?.slot;
        const status = bench.completesAt !== null ? seconds(bench.completesAt - game.elapsed) + ' 秒'
          : id === 'bufferA' || id === 'bufferB' ? '暂存' : '可取';
        view.status.setText(`#${slot} · ${status}`);
      }
    }
  }

  private refreshOrders(game: GameState) {
    if (!game.orders.some(({ id }) => id === this.selectedId)) this.selectedId = null;
    this.orderViews.forEach((view, index) => {
      const order = game.orders.find(({ slot }) => slot === index + 1);
      for (const element of Object.values(view)) element.setVisible(Boolean(order));
      if (!order) return;
      const blade = this.ctx.config.blades[order.blade];
      const remaining = order.deadline === null ? null : order.deadline - game.elapsed;
      const urgent = remaining !== null && remaining <= 8000;
      const selected = order.id === this.selectedId;
      view.panel.setFillStyle(urgent ? 0xfce1c4 : 0xfff7e7)
        .setStrokeStyle(selected ? 4 : 2, selected ? 0x477253 : urgent ? 0xb65231 : 0xd9bb94);
      view.customer.setTexture(CUSTOMER[order.blade]).setDisplaySize(37, 49);
      view.knife.setTexture(this.knifeArt(order.blade)).setDisplaySize(42, 42);
      view.name.setText(`${order.slot}  ${blade.name}`);
      view.status.setText(`${blade.points} 分 · ${this.orderStatus(game, order)}`);
      view.time.setColor(urgent ? '#a83623' : GREEN).setText(remaining === null ? '练习' : seconds(remaining) + ' 秒');
    });
  }

  private orderStatus(game: GameState, order: Order) {
    if (!order.claimed) return '待领料';
    if (game.held?.orderId === order.id) return '搬运中';
    const bench = Object.values(game.benches).find(({ piece }) => piece.orderId === order.id);
    if (bench && bench.completesAt !== null) return '加工中';
    const next = bench && nextStep(bench.piece, this.ctx.config);
    return next ? `待${this.ctx.config.steps[next].label}` : '可交付';
  }

  private drawForgeMeter(game: GameState) {
    const progress = forgeProgress(game, this.ctx.config);
    const bar = this.forgeMeter.clear();
    if (progress === null) return;
    const { strikeFrom, strikeTo } = this.ctx.config.game;
    const x = 508;
    const y = 177;
    const width = 150;
    bar.fillStyle(0x593725).fillRoundedRect(x, y, width, 16, 5);
    bar.fillStyle(0x93c482).fillRect(x + strikeFrom * width, y + 2, (strikeTo - strikeFrom) * width, 12);
    bar.fillStyle(0xfff2b0).fillRect(x + progress * width - 2, y - 3, 4, 22);
  }

  private tutorialHint(game: GameState) {
    if (game.delivered) return '老周：这单成了。按 Enter 进入第一天。';
    if (game.benches.forge?.completesAt != null) return '老周：指针进入绿区时按 F。落锤后等加工结束，再按空格取回。';
    if (!game.orders[0]?.claimed) return '老周：按 1 选小刀单，在亮起的料架旁按空格领一块刀坯。';
    return '老周：跟着高亮工位走。按空格放下刀坯，等加工结束再按空格取回。';
  }

  private feedback(result: Interaction) {
    this.showNotice(result.message);
    if (result.kind === 'delivered') {
      this.sfx('sfx_deliver');
      if (this.near) this.effect('fx_star', this.near);
    }
    if (result.kind === 'precise' || result.kind === 'ordinary') {
      this.sfx(result.kind === 'precise' ? 'sfx_hammer_heavy' : 'sfx_hammer_light');
      if (result.kind === 'precise' && this.near) this.effect('fx_spark', this.near);
    }
  }

  private showNotice(message: string) {
    this.notice.setText(message).setColor(AMBER);
    this.noticeExpires = this.ctx.game.elapsed + 2400;
  }

  private effect(id: string, station: Station) {
    const image = this.art(id, station.x, station.y - 23, 65).setDepth(13);
    this.tweens.add({ targets: image, y: image.y - 36, scale: 0.16, alpha: 0, duration: 520, onComplete: () => image.destroy() });
  }

  private pieceArt(piece: Piece) {
    const step = nextStep(piece, this.ctx.config);
    if (!step) return this.knifeArt(piece.blade);
    if (step === 'forge' || step === 'cool') return 'iron_orange';
    return step === 'finish' ? 'item_blank_blade' : 'iron_dark';
  }

  private knifeArt(blade: Order['blade']) {
    if (blade === 'small') return 'item_dagger';
    if (blade === 'firewood') return this.texture('item_firewood_knife', 'item_sickle');
    return 'item_knife';
  }

  private texture(id: string, fallback: string) {
    return this.textures.exists(id) ? id : fallback;
  }
}

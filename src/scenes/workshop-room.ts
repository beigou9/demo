import type { BaseScene } from '../engine/scenes';

type Ink = string | CanvasGradient;
type Canvas = CanvasRenderingContext2D;

export const WORKSHOP_PALETTE = {
  cream: '#f9e8be',
  ink: '#402821',
  green: '#234b40',
  gold: '#ecc77d',
};

export const WORKSHOP_GUIDE = { x: 934, y: 486, width: 294, height: 98, padding: 14, portrait: 42, gap: 10 };

function panel(ctx: Canvas, x: number, y: number, width: number, height: number, radius: number, fill: Ink, edge?: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
}

function line(ctx: Canvas, x: number, y: number, endX: number, endY: number, color: string, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function gradient(ctx: Canvas, y: number, height: number, top: string, bottom: string) {
  const fill = ctx.createLinearGradient(0, y, 0, y + height);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  return fill;
}

function light(ctx: Canvas, x: number, y: number, radius: number, center: string, edge: string) {
  const fill = ctx.createRadialGradient(x, y, 0, x, y, radius);
  fill.addColorStop(0, center);
  fill.addColorStop(1, edge);
  ctx.fillStyle = fill;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function diamond(ctx: Canvas, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function frame(ctx: Canvas, x: number, y: number, width: number, height: number, fill: Ink) {
  panel(ctx, x, y + 5, width, height, 17, '#39262170');
  panel(ctx, x, y, width, height, 16, '#4d2e24', '#2d221c');
  panel(ctx, x + 4, y + 4, width - 8, height - 8, 12, fill, '#e2ae669c');
}

function runner(ctx: Canvas) {
  panel(ctx, 103, 358, 708, 91, 13, '#3f2c2369');
  panel(ctx, 99, 351, 710, 91, 12, '#655437', '#503d2e');
  panel(ctx, 103, 354, 702, 84, 10, gradient(ctx, 354, 84, '#b9955e', '#8e6942'), '#d9b677');
  panel(ctx, 112, 361, 684, 70, 7, gradient(ctx, 361, 70, '#647562', '#485a4e'), '#e1bb7f');
  panel(ctx, 118, 367, 672, 58, 5, '#73846a38', '#9c9b6d');
  for (let y = 370; y < 424; y += 3) line(ctx, 122, y, 785, y, '#f5d39a1c');
  for (let x = 127; x < 790; x += 17) {
    diamond(ctx, x, 366, 3, '#f4d89eaa');
    diamond(ctx, x, 427, 3, '#e2bc8892');
  }
  for (const x of [141, 354, 454, 554, 767]) {
    diamond(ctx, x, 396, 23, '#2d493e80');
    diamond(ctx, x, 396, 17, '#be975aab');
    diamond(ctx, x, 396, 12, '#435b4b');
    diamond(ctx, x, 396, 6, '#d3b27a');
    for (const offset of [-20, 20]) diamond(ctx, x + offset, 396, 3, '#c8a87395');
  }
  for (let y = 369; y < 427; y += 5) {
    line(ctx, 96, y + 1, 102, y, '#cfa877b0', 1.4);
    line(ctx, 805, y, 811, y + 1, '#cfa877b0', 1.4);
  }
  line(ctx, 116, 436, 793, 436, '#513b2f8a', 1.3);
}

function stoneHearth(ctx: Canvas) {
  const stones = ['#8b8072', '#827469', '#938573', '#827e75'];
  for (const x of [377, 523, 669]) {
    panel(ctx, x + 2, 204, 122, 89, 8, '#53392c60');
    panel(ctx, x, 201, 122, 88, 8, '#685c53', '#5c493e');
    for (let row = 0; row < 3; row++) {
      const y = 205 + row * 27;
      const widths = row % 2 ? [28, 49, 33] : [43, 40, 27];
      let edge = x + 4;
      for (const [index, width] of widths.entries()) {
        panel(ctx, edge, y, width, 24, 3, stones[(row + index) % stones.length]);
        line(ctx, edge + 4, y + 2, edge + width - 4, y + 2, '#c9b39b6d');
        line(ctx, edge + 4, y + 22, edge + width - 4, y + 22, '#4b413b63');
        edge += width + 2;
      }
    }
  }
}

function windowLight(ctx: Canvas, x: number, y: number, length: number, opacity: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, 0.68, 1, 0, 0);
  const fill = gradient(ctx, 0, length, opacity, '#ffdba500');
  for (const width of [0, 22, 44, 66]) panel(ctx, width, 0, 18, length, 1, fill);
  ctx.restore();
}

function drawFloor(ctx: Canvas) {
  const boardColors = ['#bb8456', '#c18d5d', '#cb9968', '#c28b59', '#b8855b', '#c99465'];
  let seed = 7217;
  const grain = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(40, 198, 833, 449, 5);
  ctx.clip();
  for (let row = 0; row < 14; row++) {
    const y = 196 + row * 34;
    for (let x = -30 - (row % 3) * 57; x < 893;) {
      const width = 125 + Math.round(grain() * 90);
      const color = boardColors[Math.floor(grain() * boardColors.length)];
      panel(ctx, x + 1, y + 1, width - 2, 32, 3, gradient(ctx, y, 34, color, '#926342'));
      panel(ctx, x + 2, y + 3, width - 5, 25, 2, color);
      line(ctx, x + 5, y + 3, x + width - 5, y + 3, '#fbd6a97a');
      line(ctx, x + 3, y + 32, x + width - 3, y + 32, '#5134237a');
      for (let i = 0; i < 3; i++) {
        const start = x + 10 + grain() * (width - 80);
        const height = y + 6 + grain() * 22;
        const end = Math.min(start + 20 + grain() * 62, x + width - 10);
        ctx.beginPath();
        ctx.moveTo(start, height);
        ctx.bezierCurveTo(start + 12, height - 2, end - 15, height + 3, end, height);
        ctx.strokeStyle = i % 2 ? '#fff1c13b' : '#6d42283f';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (grain() > 0.59) {
        const knot = x + 27 + grain() * (width - 60);
        ctx.fillStyle = '#754c323b';
        ctx.beginPath();
        ctx.ellipse(knot, y + 17, 8, 2.7, -0.13, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#f1cb9f7a';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.fillStyle = '#633d2b6d';
      ctx.fillRect(x + 5, y + 8, 2, 2);
      ctx.fillRect(x + width - 8, y + 24, 2, 2);
      x += width;
    }
  }
  stoneHearth(ctx);

  ctx.fillStyle = gradient(ctx, 198, 445, '#41251f38', '#3c271e20');
  ctx.fillRect(39, 198, 835, 450);
  ctx.fillStyle = gradient(ctx, 205, 50, '#32241e58', '#32241e00');
  ctx.fillRect(39, 205, 835, 50);
  light(ctx, 437, 238, 194, '#ffbc5966', '#ffad4200');
  light(ctx, 378, 413, 345, '#ffda893b', '#ffd58400');
  light(ctx, 795, 247, 128, '#ffda8c60', '#ffd68b00');
  windowLight(ctx, 97, 209, 157, '#fff0ba37');
  windowLight(ctx, 739, 209, 121, '#fff0ba2c');
  light(ctx, 50, 595, 141, '#39242062', '#39242000');
  light(ctx, 875, 619, 156, '#39242053', '#39242000');
  runner(ctx);
  ctx.restore();
}

function drawWindow(ctx: Canvas, x: number, y: number) {
  panel(ctx, x - 7, y - 3, 111, 49, 7, '#52372a80');
  panel(ctx, x - 4, y - 3, 105, 48, 7, '#654232', '#483329');
  panel(ctx, x, y, 97, 43, 6, gradient(ctx, y, 43, '#6f9a92', '#f0d7a2'), '#d8a771');
  panel(ctx, x + 10, y + 8, 18, 3, 1, '#f5e4b660');
  panel(ctx, x + 64, y + 14, 19, 3, 1, '#f5e4b669');
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 36);
  ctx.lineTo(x + 22, y + 19);
  ctx.lineTo(x + 39, y + 35);
  ctx.lineTo(x + 56, y + 23);
  ctx.lineTo(x + 91, y + 37);
  ctx.closePath();
  ctx.fillStyle = '#5d8c76a0';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 37);
  ctx.quadraticCurveTo(x + 35, y + 28, x + 52, y + 37);
  ctx.quadraticCurveTo(x + 75, y + 29, x + 93, y + 35);
  ctx.lineTo(x + 93, y + 40);
  ctx.lineTo(x + 4, y + 40);
  ctx.closePath();
  ctx.fillStyle = '#597c64bc';
  ctx.fill();
  for (const offset of [24, 48, 72]) {
    line(ctx, x + offset, y + 2, x + offset, y + 40, '#5d3930', 3.8);
    line(ctx, x + offset - 1, y + 3, x + offset - 1, y + 40, '#bc8c62');
  }
  line(ctx, x + 1, y + 22, x + 95, y + 22, '#5d3930', 3.8);
  line(ctx, x + 2, y + 20.5, x + 94, y + 20.5, '#bc8c62');
  panel(ctx, x - 7, y + 41, 111, 7, 2, '#9d6847', '#4e3528');
  line(ctx, x - 4, y + 42, x + 102, y + 42, '#e4ba7c');
}

function drawWall(ctx: Canvas) {
  panel(ctx, 41, 145, 831, 64, 6, gradient(ctx, 145, 64, '#775844', '#9c7150'), '#5e4232');
  for (let row = 0; row < 3; row++) {
    const y = 149 + row * 17;
    for (let x = 44 - (row % 2) * 24; x < 860; x += 51) {
      const left = Math.max(44, x);
      const right = Math.min(x + 49, 870);
      const tone = ['#c09771', '#bb8e64', '#c49a6f', '#b18360'][Math.floor((x + row * 105) / 51) % 4];
      panel(ctx, left, y, right - left, 16, 2, tone);
      line(ctx, left + 2, y + 2, right - 2, y + 2, '#f4c79757');
      line(ctx, left + 3, y + 14, right - 2, y + 14, '#5f493b47');
    }
  }
  ctx.fillStyle = gradient(ctx, 147, 60, '#492b244c', '#492b2400');
  ctx.fillRect(43, 147, 828, 58);
  for (const x of [46, 219, 348, 488, 680, 852]) {
    panel(ctx, x + 2, 149, 16, 58, 3, '#4b2f2660');
    panel(ctx, x, 145, 14, 59, 3, gradient(ctx, 145, 59, '#976345', '#57362a'), '#3c2c24');
    line(ctx, x + 3, 148, x + 3, 201, '#d99a65a1');
    panel(ctx, x - 2, 195, 18, 6, 2, '#76634e', '#3b2c25');
  }
  drawWindow(ctx, 94, 153);
  drawWindow(ctx, 737, 153);
  panel(ctx, 41, 143, 831, 9, 3, gradient(ctx, 143, 9, '#9b6c49', '#4f3428'), '#3a2b23');
  line(ctx, 44, 145, 868, 145, '#dda976');
  panel(ctx, 41, 200, 831, 11, 3, gradient(ctx, 200, 11, '#925f43', '#4a3127'), '#34261f');
  line(ctx, 46, 202, 867, 202, '#d59b65');
  panel(ctx, 239, 158, 91, 37, 5, '#5c3b2f8c');
  panel(ctx, 238, 155, 90, 37, 5, gradient(ctx, 155, 37, '#9b6f4e', '#654131'), '#4e3428');
  line(ctx, 245, 162, 321, 162, '#d3a36f97', 2);
  for (const pin of [254, 281, 307]) {
    ctx.beginPath();
    ctx.arc(pin, 162, 2.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#e7b97a';
    ctx.fill();
  }
  panel(ctx, 528, 151, 118, 20, 5, '#4b322c89');
  panel(ctx, 529, 149, 116, 19, 4, gradient(ctx, 149, 19, '#527561', '#2a4b3e'), '#e9bb77');
  for (const x of [541, 633]) diamond(ctx, x, 159, 6, '#c49862');
}

function lantern(ctx: Canvas, x: number, y: number) {
  light(ctx, x, y + 3, 59, '#ffb75d92', '#ffbb6200');
  line(ctx, x, y - 23, x, y - 11, '#3b291e', 2);
  panel(ctx, x - 10, y - 10, 23, 24, 8, '#582d246e');
  panel(ctx, x - 11, y - 12, 22, 23, 8, gradient(ctx, y - 12, 23, '#ae472c', '#ed963e'), '#743b26');
  panel(ctx, x - 4, y - 9, 8, 17, 3, gradient(ctx, y - 9, 17, '#f49e46', '#ffd081'));
  for (const offset of [-5, 5]) line(ctx, x + offset, y - 9, x + offset, y + 8, '#8c492850', 1);
  panel(ctx, x - 8, y - 15, 16, 4, 2, '#e9b762', '#6a3d29');
  panel(ctx, x - 7, y + 10, 14, 4, 2, '#e9b762', '#6a3d29');
  line(ctx, x, y + 14, x, y + 21, '#b06c35', 2);
  line(ctx, x - 2, y + 17, x - 2, y + 20, '#db9d59');
}

function drawRoomEdges(ctx: Canvas) {
  panel(ctx, 37, 211, 8, 437, 3, '#50352a', '#402b24');
  panel(ctx, 865, 211, 11, 437, 3, '#53372b', '#402b24');
  line(ctx, 44, 217, 44, 624, '#b48458', 1.5);
  line(ctx, 867, 217, 867, 624, '#885e43', 1.5);
  for (const x of [41, 861]) {
    panel(ctx, x - 1, 585, 13, 52, 2, gradient(ctx, 585, 52, '#8c5c41', '#54382c'), '#4d3227');
    panel(ctx, x - 2, 619, 15, 17, 2, '#6b6553', '#50392b');
  }
  panel(ctx, 40, 631, 834, 16, 4, gradient(ctx, 631, 16, '#8c5c42', '#56382c'), '#462e23');
  line(ctx, 46, 633, 869, 633, '#c28e5c');
  line(ctx, 48, 642, 866, 642, '#97714a77');
  for (const x of [54, 858]) diamond(ctx, x, 638, 5, '#c79a62');
}

function drawHud(ctx: Canvas) {
  frame(ctx, 24, 21, 1232, 90, gradient(ctx, 21, 90, '#345947', '#19382f'));
  panel(ctx, 35, 32, 1210, 68, 8, '#294b3f', '#9e875f');
  line(ctx, 58, 72, 463, 72, '#ead5a354');
  for (const [x, width] of [[612, 130], [763, 193], [1014, 216]]) {
    panel(ctx, x, 42, width, 45, 8, gradient(ctx, 42, 45, '#365d4c', '#253e34'), '#b29868');
    diamond(ctx, x + 9, 64, 4, '#e3bd73');
  }
  frame(ctx, 906, 133, 350, 529, gradient(ctx, 133, 529, '#e2c792', '#ad8559'));
  panel(ctx, 914, 141, 334, 512, 10, gradient(ctx, 141, 512, '#f7e6be', '#e5c993'), '#936b49');
  panel(ctx, 923, 148, 316, 30, 5, '#2b5042', '#896745');
  diamond(ctx, 1225, 163, 9, '#debd7a');
  for (const y of [222, 324, 426]) {
    panel(ctx, 928, y - 41, 306, 86, 8, '#a77c5040', '#93775166');
    for (const x of [944, 1218]) diamond(ctx, x, y, 6, '#bb9a64a7');
  }
  const guide = WORKSHOP_GUIDE;
  panel(ctx, guide.x - 8, guide.y - 8, guide.width + 16, guide.height + 16, 9, '#fcf0cf', '#a88158');
  panel(ctx, guide.x, guide.y, guide.width, guide.height, 6,
    gradient(ctx, guide.y, guide.height, '#f8e8be', '#ebd1a0'), '#cba571');
  line(ctx, guide.x + 7, guide.y + 3, guide.x + guide.width - 7, guide.y + 3, '#fff1cf');
}

export function drawWorkshopRoom(scene: BaseScene) {
  const key = 'workshop-room';
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 1280, 720);
    if (!texture) throw new Error('Unable to create the workshop room texture');
    const ctx = texture.getContext();
    ctx.fillStyle = gradient(ctx, 0, 720, '#e6cda5', '#ab8764');
    ctx.fillRect(0, 0, 1280, 720);
    frame(ctx, 24, 133, 865, 529, gradient(ctx, 133, 529, '#916142', '#684531'));
    drawFloor(ctx);
    drawWall(ctx);
    lantern(ctx, 71, 174);
    lantern(ctx, 842, 174);
    drawRoomEdges(ctx);
    drawHud(ctx);
    panel(ctx, 24, 674, 1232, 32, 8, '#533b2c');
    panel(ctx, 28, 677, 1224, 25, 5, '#f4dfa9', '#b8955f');
    texture.refresh();
  }
  scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);

  const props = [
    { id: 'hammer_small', x: 254, y: 173, width: 19, rotation: -0.29 },
    { id: 'tool_tongs', x: 281, y: 172, width: 23, rotation: -0.54 },
    { id: 'item_knife', x: 307, y: 174, width: 23, rotation: 0.28 },
    { id: 'tile_crate', x: 144, y: 629, width: 48, rotation: 0 },
    { id: 'mat_wood', x: 103, y: 640, width: 50, rotation: -0.10 },
    { id: 'item_basket', x: 175, y: 641, width: 39, rotation: 0.11 },
    { id: 'tile_barrel', x: 822, y: 630, width: 43, rotation: 0 },
    { id: 'mat_iron_ore', x: 843, y: 641, width: 33, rotation: 0.14 },
  ];
  for (const { id, x, y, width, rotation } of props) {
    const onWall = y < 200;
    const shadowY = onWall ? y + 3 : y + 11;
    workshopSoftDisc(scene, x + 3, shadowY, width + 13, onWall ? 16 : 18, 'shadow').setAlpha(0.5).setDepth(-89);
    scene.art(id, x, y, width).setRotation(rotation).setDepth(onWall ? -88 : -88 + (y - 629) / 20);
  }
}

/** Small cached masks for soft lighting and contact shadows across both renderers. */
export function workshopSoftDisc(scene: BaseScene, x: number, y: number, width: number, height: number, tone: 'shadow' | 'fire') {
  const key = `workshop-disc-${tone}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 96, 96);
    if (!texture) throw new Error(`Unable to create ${key}`);
    const colors = tone === 'shadow' ? ['#322019', '#32201900'] : ['#ffcb76', '#ff9a3500'];
    light(texture.getContext(), 48, 48, 48, colors[0], colors[1]);
    texture.refresh();
  }
  return scene.add.image(x, y, key).setDisplaySize(width, height);
}

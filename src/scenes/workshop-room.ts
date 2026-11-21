import type { BaseScene } from '../engine/scenes';

type Ink = string | CanvasGradient;
type Canvas = CanvasRenderingContext2D;

export const WORKSHOP_PALETTE = {
  cream: '#f9e8be',
  ink: '#402821',
  green: '#234b40',
  gold: '#ecc77d',
};

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

function drawFloor(ctx: Canvas) {
  const boardColors = ['#bd895a', '#c39362', '#cea16d', '#c99865', '#c08c60', '#ca9563'];
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
      panel(ctx, x + 1, y + 1, width - 2, 32, 3, color);
      line(ctx, x + 4, y + 2, x + width - 4, y + 2, '#ffe7ac46');
      line(ctx, x + 3, y + 32, x + width - 3, y + 32, '#58372653');
      for (let i = 0; i < 3; i++) {
        const start = x + 10 + grain() * (width - 80);
        const height = y + 6 + grain() * 22;
        const end = Math.min(start + 20 + grain() * 62, x + width - 10);
        ctx.beginPath();
        ctx.moveTo(start, height);
        ctx.bezierCurveTo(start + 12, height - 2, end - 15, height + 3, end, height);
        ctx.strokeStyle = i % 2 ? '#fff1c13a' : '#6d422834';
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
  ctx.fillStyle = gradient(ctx, 198, 449, '#41251f50', '#3c271e30');
  ctx.fillRect(39, 198, 835, 450);
  light(ctx, 440, 225, 220, '#ffc86c66', '#ffb15800');
  light(ctx, 380, 410, 390, '#ffdc943e', '#ffd58400');
  light(ctx, 805, 241, 155, '#ffd68b55', '#ffd68b00');

  // The flat woven runner defines the aisle while keeping character silhouettes clear.
  panel(ctx, 100, 352, 709, 91, 12, '#8463485e', '#654d386d');
  panel(ctx, 104, 355, 701, 83, 10, '#a68e62', '#e6c28aaf');
  panel(ctx, 113, 362, 683, 69, 7, '#90916a', '#6e5c4680');
  for (let y = 370; y < 427; y += 3) line(ctx, 120, y, 789, y, '#f0d8a01b');
  for (let x = 127; x < 790; x += 17) {
    diamond(ctx, x, 366, 4, '#e4c9939e');
    diamond(ctx, x, 427, 4, '#e4c9939e');
  }
  for (const x of [134, 354, 454, 554, 774]) {
    diamond(ctx, x, 397, 17, '#827451a8');
    diamond(ctx, x, 397, 9, '#cfac73b9');
  }

  // Faint stone aprons separate the hot and wet stations from the wooden aisle.
  for (const x of [377, 523, 669]) {
    panel(ctx, x, 202, 120, 88, 8, '#77645c70', '#625147a0');
    line(ctx, x + 4, 268, x + 116, 268, '#7460559b');
    line(ctx, x + 38, 269, x + 38, 286, '#75635c85');
    line(ctx, x + 80, 269, x + 80, 286, '#75635c85');
  }
  ctx.restore();
}

function drawWindow(ctx: Canvas, x: number, y: number) {
  panel(ctx, x - 4, y - 2, 105, 49, 7, '#52372a60');
  panel(ctx, x, y, 97, 43, 6, gradient(ctx, y, 43, '#75a394', '#f6d99a'), '#58392b');
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 36);
  ctx.lineTo(x + 22, y + 19);
  ctx.lineTo(x + 39, y + 35);
  ctx.lineTo(x + 56, y + 23);
  ctx.lineTo(x + 91, y + 37);
  ctx.closePath();
  ctx.fillStyle = '#5d8c76a0';
  ctx.fill();
  for (const offset of [24, 48, 72]) line(ctx, x + offset, y + 2, x + offset, y + 42, '#643c2a', 3);
  line(ctx, x, y + 22, x + 97, y + 22, '#643c2a', 3);
  panel(ctx, x - 5, y + 41, 107, 5, 2, '#946047', '#50342b');
}

function drawWall(ctx: Canvas) {
  panel(ctx, 41, 145, 831, 64, 6, gradient(ctx, 145, 64, '#c59566', '#987054'), '#5e4232');
  for (let row = 0; row < 3; row++) {
    const y = 152 + row * 18;
    line(ctx, 43, y + 16, 870, y + 16, '#754b3970');
    for (let x = 43 + (row % 2) * 27; x < 860; x += 57) {
      line(ctx, x, y, x, y + 15, '#754b396b');
      line(ctx, x + 3, y + 1, Math.min(x + 51, 870), y + 1, '#ffca8443');
    }
  }
  for (const x of [46, 219, 348, 488, 680, 852]) {
    panel(ctx, x, 145, 14, 59, 3, '#5a3929', '#3c2c24');
    line(ctx, x + 4, 148, x + 4, 201, '#aa7555');
  }
  drawWindow(ctx, 94, 153);
  drawWindow(ctx, 737, 153);
  panel(ctx, 41, 143, 831, 8, 3, '#62402d', '#3a2b23');
  line(ctx, 44, 146, 868, 146, '#ac7552');
  panel(ctx, 41, 200, 831, 11, 3, '#52362b', '#3b2a21');
  line(ctx, 46, 202, 867, 202, '#d59b65');
  panel(ctx, 240, 157, 86, 36, 4, '#664331', '#4e3428');
  line(ctx, 246, 163, 320, 163, '#a46c48', 2);
  panel(ctx, 529, 150, 116, 19, 4, '#325344', '#daa769');
  for (const x of [541, 633]) diamond(ctx, x, 159, 6, '#c49862');
}

function lantern(ctx: Canvas, x: number, y: number) {
  light(ctx, x, y, 49, '#ffbb6283', '#ffbb6200');
  line(ctx, x, y - 23, x, y - 11, '#3b291e', 2);
  panel(ctx, x - 11, y - 12, 22, 23, 8, gradient(ctx, y - 12, 23, '#aa452b', '#ed943e'), '#6a3525');
  for (const offset of [-5, 5]) line(ctx, x + offset, y - 9, x + offset, y + 8, '#ffc172', 1);
  panel(ctx, x - 8, y - 15, 16, 4, 2, '#e9b762', '#6a3d29');
  panel(ctx, x - 7, y + 10, 14, 4, 2, '#e9b762', '#6a3d29');
  line(ctx, x, y + 14, x, y + 21, '#9f502e', 2);
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
  panel(ctx, 926, 478, 310, 114, 9, '#fcf0cf', '#a88158');
  panel(ctx, 934, 486, 294, 98, 6, '#f4dfb2', '#dab782');
}

export function drawWorkshopRoom(scene: BaseScene) {
  const key = 'workshop-room';
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 1280, 720);
    if (!texture) throw new Error('Unable to create the workshop room texture');
    const ctx = texture.getContext();
    ctx.fillStyle = gradient(ctx, 0, 720, '#e6cda5', '#ab8764');
    ctx.fillRect(0, 0, 1280, 720);
    frame(ctx, 24, 133, 865, 529, '#825536');
    drawFloor(ctx);
    drawWall(ctx);
    lantern(ctx, 71, 174);
    lantern(ctx, 842, 174);
    panel(ctx, 37, 212, 6, 436, 2, '#72452d', '#4c3127');
    panel(ctx, 870, 212, 6, 436, 2, '#72452d', '#4c3127');
    panel(ctx, 40, 633, 834, 14, 4, '#67432e', '#462e23');
    line(ctx, 46, 636, 869, 636, '#b78052');
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
    { id: 'mat_wood', x: 109, y: 642, width: 47, rotation: 0 },
    { id: 'tile_crate', x: 152, y: 638, width: 41, rotation: 0 },
    { id: 'item_basket', x: 193, y: 639, width: 37, rotation: 0 },
    { id: 'tile_barrel', x: 818, y: 638, width: 40, rotation: 0 },
    { id: 'mat_iron_ore', x: 848, y: 642, width: 30, rotation: 0.14 },
  ];
  for (const { id, x, y, width, rotation } of props) {
    scene.add.ellipse(x, y + 7, width, 12, 0x31241b, 0.25).setDepth(-89);
    scene.art(id, x, y, width).setRotation(rotation).setDepth(-88);
  }
}

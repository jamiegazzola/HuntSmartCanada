'use strict';
// Build a 1200x630 iMessage/Open Graph preview from the site's exact logo.
// No image dependencies; safe for Netlify's standard Node build environment.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function chunk(type, data) {
  const tag = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const bytes = Buffer.concat([tag, data]);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([len, bytes, tail]);
}

function decodeLogo(file) {
  const png = fs.readFileSync(file);
  if (!png.subarray(0, 8).equals(signature)) throw new Error('Expected PNG logo');
  let w = 0, h = 0, depth = 0, color = 0;
  const blocks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const name = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (name === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; color = data[9];
      if (data[12] !== 0) throw new Error('Interlaced logo not supported');
    }
    if (name === 'IDAT') blocks.push(data);
    offset += length + 12;
    if (name === 'IEND') break;
  }
  if (depth !== 8 || color !== 6 || !w || !h) {
    throw new Error('Expected an 8-bit RGBA website logo');
  }
  const stride = w * 4;
  const raw = zlib.inflateSync(Buffer.concat(blocks));
  const pixels = Buffer.alloc(h * stride);
  let offset = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[offset++];
    for (let x = 0; x < stride; x++) {
      const source = raw[offset++];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      else if (filter === 2) prediction = up;
      else if (filter === 3) prediction = (left + up) >>> 1;
      else if (filter === 4) {
        const p = left + up - upperLeft;
        const a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - upperLeft);
        prediction = a <= b && a <= c ? left : b <= c ? up : upperLeft;
      } else if (filter !== 0) throw new Error('Unsupported PNG filter');
      pixels[y * stride + x] = (source + prediction) & 255;
    }
  }
  return { w, h, pixels };
}

// Rebuild smooth, high-contrast letter edges from the exact brand bitmap.
// No alternative typography, logo redesign, third-party fonts, or dependencies.
function cubicWeight(distance) {
  const x = Math.abs(distance);
  const a = -0.75;
  if (x <= 1) return (a + 2) * x * x * x - (a + 3) * x * x + 1;
  if (x < 2) return a * x * x * x - 5 * a * x * x + 8 * a * x - 4 * a;
  return 0;
}
function makePreview(logo) {
  const width = 1200, height = 630;
  const displayWidth = 930;
  const displayHeight = Math.round(displayWidth * logo.h / logo.w);
  const x0 = Math.round((width - displayWidth) / 2);
  const y0 = Math.round((height - displayHeight) / 2);
  const background = [11, 13, 14];
  const colours = [
    [240, 242, 245], // Original HuntSmart wordmark white.
    [42, 191, 100], // Original Canada green.
    [63, 72, 81], // Original Know Your Draw Odds muted grey.
  ];
  const splitX = Math.round(logo.w * 93 / 162);
  const splitY = Math.round(logo.h * 28 / 46);
  const alphaMasks = colours.map((colour, layer) => {
    const a = new Float32Array(logo.w * logo.h);
    const diff = colour.map((channel, i) => channel - background[i]);
    const magnitude = diff.reduce((sum, v) => sum + v * v, 0);
    for (let y = 0; y < logo.h; y++) {
      for (let x = 0; x < logo.w; x++) {
        if (layer === 0 && (x >= splitX || y >= splitY)) continue;
        if (layer === 1 && (x < splitX || y >= splitY)) continue;
        if (layer === 2 && y < splitY) continue;
        const i = (y * logo.w + x) * 4;
        const delta = diff.reduce((sum, v, k) => sum + (logo.pixels[i + k] - background[k]) * v, 0);
        a[y * logo.w + x] = Math.max(0, Math.min(1, delta / magnitude));
      }
    }
    return a;
  });
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < rgb.length; i += 3) {
    rgb[i] = background[0]; rgb[i + 1] = background[1]; rgb[i + 2] = background[2];
  }
  for (let dy = 0; dy < displayHeight; dy++) {
    const fy = (dy + 0.5) * logo.h / displayHeight - 0.5;
    const sy = Math.floor(fy);
    const yw = [-1, 0, 1, 2].map(j => cubicWeight(fy - (sy + j)));
    for (let dx = 0; dx < displayWidth; dx++) {
      const fx = (dx + 0.5) * logo.w / displayWidth - 0.5;
      const sx = Math.floor(fx);
      const xw = [-1, 0, 1, 2].map(j => cubicWeight(fx - (sx + j)));
      const pos = ((dy + y0) * width + dx + x0) * 3;
      for (let layer = 0; layer < colours.length; layer++) {
        let opacity = 0;
        const alpha = alphaMasks[layer];
        for (let j = -1; j <= 2; j++) {
          const iy = Math.max(0, Math.min(logo.h - 1, sy + j));
          for (let i = -1; i <= 2; i++) {
            const ix = Math.max(0, Math.min(logo.w - 1, sx + i));
            opacity += alpha[iy * logo.w + ix] * yw[j + 1] * xw[i + 1];
          }
        }
        // Improve perceived sharpness without changing the letter shapes.
        opacity = Math.max(0, Math.min(1, (opacity - 0.2) * 1.75));
        for (let k = 0; k < 3; k++) {
          rgb[pos + k] = Math.round(rgb[pos + k] * (1 - opacity) + colours[layer][k] * opacity);
        }
      }
    }
  }
  const rowBytes = width * 3;
  const scanlines = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    const start = y * (rowBytes + 1);
    scanlines[start] = 1;
    for (let x = 0; x < rowBytes; x++) {
      const i = y * rowBytes + x;
      scanlines[start + 1 + x] = (rgb[i] - (x >= 3 ? rgb[i - 3] : 0)) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const input = path.join('images', 'logo.png');
const output = path.join('site', 'images', 'huntsmart-share-v2.png');
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = makePreview(decodeLogo(input));
fs.writeFileSync(output, result);
console.log('Generated ' + output + ' (' + result.length + ' bytes, 1200x630) from exact site logo');

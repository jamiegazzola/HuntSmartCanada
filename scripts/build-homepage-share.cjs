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

function makePreview(logo) {
  const width = 1200, height = 630;
  const displayWidth = 930;
  const displayHeight = Math.round(displayWidth * logo.h / logo.w);
  const x0 = Math.round((width - displayWidth) / 2);
  const y0 = Math.round((height - displayHeight) / 2);
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < rgb.length; i += 3) {
    rgb[i] = 11; rgb[i + 1] = 13; rgb[i + 2] = 14;
  }
  const sample = (x, y, c) => logo.pixels[(y * logo.w + x) * 4 + c];
  for (let dy = 0; dy < displayHeight; dy++) {
    const fy = Math.max(0, Math.min(logo.h - 1, (dy + 0.5) * logo.h / displayHeight - 0.5));
    const sy0 = Math.floor(fy), sy1 = Math.min(logo.h - 1, sy0 + 1), ry = fy - sy0;
    for (let dx = 0; dx < displayWidth; dx++) {
      const fx = Math.max(0, Math.min(logo.w - 1, (dx + 0.5) * logo.w / displayWidth - 0.5));
      const sx0 = Math.floor(fx), sx1 = Math.min(logo.w - 1, sx0 + 1), rx = fx - sx0;
      const start = ((dy + y0) * width + dx + x0) * 3;
      const alpha = ((1 - rx) * (1 - ry) * sample(sx0, sy0, 3)
        + rx * (1 - ry) * sample(sx1, sy0, 3)
        + (1 - rx) * ry * sample(sx0, sy1, 3)
        + rx * ry * sample(sx1, sy1, 3)) / 255;
      for (let c = 0; c < 3; c++) {
        const color = ((1 - rx) * (1 - ry) * sample(sx0, sy0, c)
          + rx * (1 - ry) * sample(sx1, sy0, c)
          + (1 - rx) * ry * sample(sx0, sy1, c)
          + rx * ry * sample(sx1, sy1, c));
        rgb[start + c] = Math.round(color * alpha + [11, 13, 14][c] * (1 - alpha));
      }
    }
  }
  const rowBytes = width * 3;
  const scanlines = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    const start = y * (rowBytes + 1);
    scanlines[start] = 1; // PNG Sub filter
    for (let x = 0; x < rowBytes; x++) {
      const i = y * rowBytes + x;
      scanlines[start + 1 + x] = (rgb[i] - (x >= 3 ? rgb[i - 3] : 0)) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const input = path.join('images', 'logo.png');
const output = path.join('site', 'images', 'huntsmart-share.png');
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = makePreview(decodeLogo(input));
fs.writeFileSync(output, result);
console.log('Generated ' + output + ' (' + result.length + ' bytes, 1200x630) from exact site logo');

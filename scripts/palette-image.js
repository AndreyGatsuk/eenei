const { deflateSync, crc32 } = require('node:zlib');

// A tiny deterministic rasterizer keeps palette builds independent of a browser.
function palettePng(colors) {
  const width = colors.length * 36;
  const height = 24;
  const pixels = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const localX = x % 36;
    let covered = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
      const px = localX + (sx + 0.5) / 4;
      const py = y + (sy + 0.5) / 4;
      const dx = Math.max(5 - px, 0, px - 29);
      const dy = Math.max(5 - py, 0, py - 19);
      if (px >= 1 && px <= 33 && py >= 1 && py <= 23 && dx * dx + dy * dy <= 16) covered++;
    }
    const offset = y * (width * 4 + 1) + 1 + x * 4;
    Buffer.from(colors[Math.floor(x / 36)].slice(1), 'hex').copy(pixels, offset);
    pixels[offset + 3] = Math.round(255 * covered / 16);
  }
  const chunk = (type, data) => {
    const name = Buffer.from(type);
    const size = Buffer.alloc(4);
    size.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([size, name, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6; // RGBA, eight bits per channel.
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}
module.exports = { palettePng };

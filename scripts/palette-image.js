const { crc32 } = require('node:zlib');

// Stored DEFLATE blocks avoid compressor-version differences between Node builds.
// The strips are small enough that compression savings do not justify unstable bytes.
function storedZlib(data) {
  const blocks = [Buffer.from([0x78, 0x01])];
  for (let offset = 0; offset < data.length; offset += 65535) {
    const length = Math.min(65535, data.length - offset);
    const header = Buffer.alloc(5);
    header[0] = offset + length === data.length ? 1 : 0;
    header.writeUInt16LE(length, 1);
    header.writeUInt16LE(length ^ 0xffff, 3);
    blocks.push(header, data.subarray(offset, offset + length));
  }
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(((b << 16) | a) >>> 0);
  return Buffer.concat([...blocks, checksum]);
}

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
    chunk('IDAT', storedZlib(pixels)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
module.exports = { palettePng };

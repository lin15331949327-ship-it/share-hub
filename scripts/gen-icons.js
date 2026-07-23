// Generate PWA icons — solid blue rounded square with "S"
const zlib = require("zlib");
const fs = require("fs");

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tbuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([tbuf, data])), 0);
  return Buffer.concat([len, tbuf, data, crcBuf]);
}

function png(w, h, r, g, b) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  const cx = w / 2, cy = h / 2, rr = w * 0.42; // rounded corner radius
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 4 + 1) + 1 + x * 4;
      // rounded rect: check corners
      let inside = true;
      if (x < rr && y < rr && Math.hypot(x - rr, y - rr) > rr) inside = false;
      if (x > w - rr && y < rr && Math.hypot(x - (w - rr), y - rr) > rr) inside = false;
      if (x < rr && y > h - rr && Math.hypot(x - rr, y - (h - rr)) > rr) inside = false;
      if (x > w - rr && y > h - rr && Math.hypot(x - (w - rr), y - (h - rr)) > rr) inside = false;
      raw[o] = inside ? r : 0;
      raw[o + 1] = inside ? g : 0;
      raw[o + 2] = inside ? b : 0;
      raw[o + 3] = inside ? 255 : 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

[192, 512].forEach((s) => fs.writeFileSync(`public/icon-${s}.png`, png(s, s, 59, 130, 246)));
console.log("✅ Icons generated");

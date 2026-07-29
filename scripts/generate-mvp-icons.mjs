import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const palette = {
  background: [255, 248, 237, 255],
  camera: [47, 41, 35, 255],
  lens: [215, 150, 95, 255],
  highlight: [255, 253, 248, 255],
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createCanvas(size) {
  const pixels = new Uint8Array(size * size * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels.set(palette.background, offset);
  }
  return pixels;
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }
  pixels.set(color, (y * size + x) * 4);
}

function fillCircle(pixels, size, centerX, centerY, radius, color) {
  const radiusSquared = radius * radius;
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(size - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(size - 1, Math.ceil(centerY + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - centerX;
      const dy = y + 0.5 - centerY;
      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function fillRoundedRect(
  pixels,
  size,
  left,
  top,
  right,
  bottom,
  radius,
  color,
) {
  const radiusSquared = radius * radius;
  for (let y = Math.floor(top); y < Math.ceil(bottom); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(right); x += 1) {
      const nearestX = Math.max(
        left + radius,
        Math.min(x + 0.5, right - radius),
      );
      const nearestY = Math.max(
        top + radius,
        Math.min(y + 0.5, bottom - radius),
      );
      const dx = x + 0.5 - nearestX;
      const dy = y + 0.5 - nearestY;
      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function drawCameraIcon(size) {
  const pixels = createCanvas(size);
  const cameraLeft = size * 0.2;
  const cameraRight = size * 0.8;
  const cameraTop = size * 0.32;
  const cameraBottom = size * 0.72;
  const cornerRadius = size * 0.075;

  fillRoundedRect(
    pixels,
    size,
    cameraLeft,
    cameraTop,
    cameraRight,
    cameraBottom,
    cornerRadius,
    palette.camera,
  );
  fillRoundedRect(
    pixels,
    size,
    size * 0.34,
    size * 0.245,
    size * 0.66,
    size * 0.4,
    size * 0.04,
    palette.camera,
  );
  fillCircle(pixels, size, size * 0.5, size * 0.52, size * 0.16, palette.lens);
  fillCircle(
    pixels,
    size,
    size * 0.5,
    size * 0.52,
    size * 0.09,
    palette.highlight,
  );
  fillCircle(
    pixels,
    size,
    size * 0.715,
    size * 0.405,
    size * 0.027,
    palette.highlight,
  );

  return pixels;
}

function encodePng(size, pixels) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4;
  const scanlines = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (stride + 1);
    scanlines[rowOffset] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(
      scanlines,
      rowOffset + 1,
    );
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const outputPath = path.join(
    repositoryRoot,
    'public',
    `pwa-${size}x${size}.png`,
  );
  await writeFile(outputPath, encodePng(size, drawCameraIcon(size)));
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)}`);
}

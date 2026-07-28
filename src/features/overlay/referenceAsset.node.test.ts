/// <reference types="node" />
// @vitest-environment node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';

interface DecodedPng {
  width: number;
  height: number;
  pixels: Uint8Array;
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
}

function paethPredictor(
  left: number,
  above: number,
  upperLeft: number,
): number {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }

  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(bytes: Uint8Array): DecodedPng {
  expect(bytes.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  const idatParts: Uint8Array[] = [];

  while (offset < bytes.length) {
    const length = readUint32(bytes, offset);
    const type = new TextDecoder().decode(
      bytes.subarray(offset + 4, offset + 8),
    );
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = readUint32(data, 0);
      height = readUint32(data, 4);
      expect(data[8]).toBe(8);
      expect(data[9]).toBe(6);
      expect(data[12]).toBe(0);
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const compressedLength = idatParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const compressed = new Uint8Array(compressedLength);
  let compressedOffset = 0;
  for (const part of idatParts) {
    compressed.set(part, compressedOffset);
    compressedOffset += part.length;
  }

  const filtered = new Uint8Array(inflateSync(compressed));
  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const pixels = new Uint8Array(width * height * bytesPerPixel);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = filtered[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * rowLength;

    for (let x = 0; x < rowLength; x += 1) {
      const raw = filtered[sourceOffset + x];
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - 4] : 0;
      const above = y > 0 ? pixels[rowOffset + x - rowLength] : 0;
      const upperLeft =
        y > 0 && x >= bytesPerPixel
          ? pixels[rowOffset + x - rowLength - bytesPerPixel]
          : 0;
      let predictor = 0;

      switch (filter) {
        case 0:
          predictor = 0;
          break;
        case 1:
          predictor = left;
          break;
        case 2:
          predictor = above;
          break;
        case 3:
          predictor = Math.floor((left + above) / 2);
          break;
        case 4:
          predictor = paethPredictor(left, above, upperLeft);
          break;
        default:
          throw new Error(`Unsupported PNG filter: ${filter}`);
      }

      pixels[rowOffset + x] = (raw + predictor) & 0xff;
    }

    sourceOffset += rowLength;
  }

  return { width, height, pixels };
}

describe('derived reference Clawd PNG', () => {
  it('has deterministic transparent pixels and tightly cropped content bounds', async () => {
    const assetUrl = new URL(
      '../../../public/assets/reference/clawd-reference-overlay.png',
      import.meta.url,
    );
    const bytes = new Uint8Array(await readFile(assetUrl));
    const digest = createHash('sha256').update(bytes).digest('hex');
    const decoded = decodeRgbaPng(bytes);
    const allowedOpaqueColors = new Set([
      '0,0,0',
      '218,131,105',
      '219,133,106',
      '220,134,108',
      '221,135,108',
      '222,136,108',
      '223,138,108',
    ]);
    let opaqueCount = 0;
    let invalidAlphaCount = 0;
    let nonBlackTransparentCount = 0;
    let preservedBackgroundCount = 0;
    const unexpectedOpaqueColors = new Set<string>();
    let minimumX = decoded.width;
    let minimumY = decoded.height;
    let maximumX = -1;
    let maximumY = -1;

    expect(digest).toBe(
      '0e3072de633ac933f12344f29620caf1f93a9c17d3d70ef4eba5dcb8cec26eb2',
    );
    expect({ width: decoded.width, height: decoded.height }).toEqual({
      width: 500,
      height: 325,
    });

    for (let y = 0; y < decoded.height; y += 1) {
      for (let x = 0; x < decoded.width; x += 1) {
        const index = (y * decoded.width + x) * 4;
        const red = decoded.pixels[index];
        const green = decoded.pixels[index + 1];
        const blue = decoded.pixels[index + 2];
        const alpha = decoded.pixels[index + 3];

        if (alpha !== 0 && alpha !== 255) {
          invalidAlphaCount += 1;
        }

        if (alpha === 0) {
          if (red !== 0 || green !== 0 || blue !== 0) {
            nonBlackTransparentCount += 1;
          }
          continue;
        }

        opaqueCount += 1;
        minimumX = Math.min(minimumX, x);
        minimumY = Math.min(minimumY, y);
        maximumX = Math.max(maximumX, x);
        maximumY = Math.max(maximumY, y);

        const color = `${red},${green},${blue}`;
        if (!allowedOpaqueColors.has(color)) {
          unexpectedOpaqueColors.add(color);
        }
        if (color === '244,242,239' || color === '255,255,255') {
          preservedBackgroundCount += 1;
        }
      }
    }

    expect(invalidAlphaCount).toBe(0);
    expect(nonBlackTransparentCount).toBe(0);
    expect(preservedBackgroundCount).toBe(0);
    expect([...unexpectedOpaqueColors]).toEqual([]);
    expect(opaqueCount).toBe(111_650);
    expect({ minimumX, minimumY, maximumX, maximumY }).toEqual({
      minimumX: 0,
      minimumY: 0,
      maximumX: 499,
      maximumY: 324,
    });
  });
});

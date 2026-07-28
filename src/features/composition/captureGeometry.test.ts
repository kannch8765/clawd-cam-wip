import { REFERENCE_CLAWD_ASSET } from '../overlay/overlayAssets';
import type { OverlayTransform } from '../overlay/overlayTypes';
import {
  CAPTURE_MAX_LONG_EDGE,
  CAPTURE_MIN_LONG_EDGE,
  calculateCoverCrop,
  calculateOutputSize,
  calculateOverlayDrawGeometry,
  clockwiseDegreesToCanvasRadians,
} from './captureGeometry';
import { CaptureError } from './compositionTypes';

function expectCenteredCrop(
  crop: ReturnType<typeof calculateCoverCrop>,
  videoWidth: number,
  videoHeight: number,
) {
  expect(crop.cropX * 2 + crop.visibleSourceWidth).toBeCloseTo(videoWidth);
  expect(crop.cropY * 2 + crop.visibleSourceHeight).toBeCloseTo(videoHeight);
}

describe('calculateCoverCrop', () => {
  it.each([
    {
      name: 'portrait source to portrait preview',
      input: {
        videoWidth: 1080,
        videoHeight: 1920,
        previewWidth: 390,
        previewHeight: 844,
      },
    },
    {
      name: 'landscape source to portrait preview',
      input: {
        videoWidth: 1920,
        videoHeight: 1080,
        previewWidth: 390,
        previewHeight: 844,
      },
    },
    {
      name: 'portrait source to landscape preview',
      input: {
        videoWidth: 1080,
        videoHeight: 1920,
        previewWidth: 844,
        previewHeight: 390,
      },
    },
    {
      name: 'landscape source to landscape preview',
      input: {
        videoWidth: 1920,
        videoHeight: 1080,
        previewWidth: 844,
        previewHeight: 390,
      },
    },
  ])('crops $name with the preview aspect ratio', ({ input }) => {
    const crop = calculateCoverCrop(input);

    expect(crop.visibleSourceWidth / crop.visibleSourceHeight).toBeCloseTo(
      input.previewWidth / input.previewHeight,
    );
    expectCenteredCrop(crop, input.videoWidth, input.videoHeight);
  });

  it('keeps the complete source when ratios match', () => {
    const crop = calculateCoverCrop({
      videoWidth: 1600,
      videoHeight: 900,
      previewWidth: 800,
      previewHeight: 450,
    });

    expect(crop).toEqual({
      coverScale: 0.5,
      cropX: 0,
      cropY: 0,
      visibleSourceWidth: 1600,
      visibleSourceHeight: 900,
    });
  });

  it('preserves non-integer crop coordinates', () => {
    const crop = calculateCoverCrop({
      videoWidth: 4032,
      videoHeight: 3024,
      previewWidth: 393,
      previewHeight: 852,
    });

    expect(Number.isInteger(crop.cropX)).toBe(false);
    expect(crop.cropY).toBeCloseTo(0);
    expectCenteredCrop(crop, 4032, 3024);
  });

  it.each([
    [
      'zero video width',
      { videoWidth: 0, videoHeight: 1, previewWidth: 1, previewHeight: 1 },
    ],
    [
      'zero video height',
      { videoWidth: 1, videoHeight: 0, previewWidth: 1, previewHeight: 1 },
    ],
    [
      'zero preview width',
      { videoWidth: 1, videoHeight: 1, previewWidth: 0, previewHeight: 1 },
    ],
    [
      'zero preview height',
      { videoWidth: 1, videoHeight: 1, previewWidth: 1, previewHeight: 0 },
    ],
    [
      'non-finite input',
      {
        videoWidth: Number.NaN,
        videoHeight: 1,
        previewWidth: 1,
        previewHeight: 1,
      },
    ],
  ])('fails closed for %s', (_, input) => {
    expect(() => calculateCoverCrop(input)).toThrow(CaptureError);
  });
});

describe('calculateOutputSize', () => {
  it('caps the long edge without changing the crop aspect ratio', () => {
    const output = calculateOutputSize({
      visibleSourceWidth: 5000,
      visibleSourceHeight: 2812.5,
    });

    expect(Math.max(output.width, output.height)).toBe(CAPTURE_MAX_LONG_EDGE);
    expect(output.width / output.height).toBeCloseTo(16 / 9, 2);
  });

  it('uses the minimum long edge for a small source crop', () => {
    const output = calculateOutputSize({
      visibleSourceWidth: 640,
      visibleSourceHeight: 480,
    });

    expect(Math.max(output.width, output.height)).toBe(CAPTURE_MIN_LONG_EDGE);
    expect(output.width / output.height).toBeCloseTo(4 / 3, 2);
  });

  it('keeps a portrait output portrait', () => {
    const output = calculateOutputSize({
      visibleSourceWidth: 900,
      visibleSourceHeight: 1600,
    });

    expect(output.height).toBeGreaterThan(output.width);
    expect(output.width / output.height).toBeCloseTo(9 / 16, 2);
  });
});

describe('calculateOverlayDrawGeometry', () => {
  const output = { width: 1200, height: 1600 };

  it('maps normalized anchor coordinates into output pixels', () => {
    const geometry = calculateOverlayDrawGeometry(
      { x: 0.25, y: 0.75, scale: 1, rotation: 0 },
      REFERENCE_CLAWD_ASSET,
      output,
    );

    expect(geometry.anchorX).toBe(300);
    expect(geometry.anchorY).toBe(1200);
  });

  it('applies canonical width, scale, and asset aspect ratio', () => {
    const geometry = calculateOverlayDrawGeometry(
      { x: 0.5, y: 0.5, scale: 2, rotation: 0 },
      REFERENCE_CLAWD_ASSET,
      output,
    );

    expect(geometry.width).toBe(
      REFERENCE_CLAWD_ASSET.canonicalDisplayWidth * output.width * 2,
    );
    expect(geometry.height).toBeCloseTo(
      geometry.width / REFERENCE_CLAWD_ASSET.aspectRatio,
    );
  });

  it('uses a non-centered anchor as the draw offset', () => {
    const asset = {
      ...REFERENCE_CLAWD_ASSET,
      anchor: { x: 0.2, y: 0.8 },
    };
    const geometry = calculateOverlayDrawGeometry(
      { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      asset,
      output,
    );

    expect(geometry.drawX).toBeCloseTo(-geometry.width * 0.2);
    expect(geometry.drawY).toBeCloseTo(-geometry.height * 0.8);
  });

  it('allows an anchor outside the output bounds', () => {
    const transform: OverlayTransform = {
      x: -0.2,
      y: 1.2,
      scale: 0.35,
      rotation: -45,
    };
    const geometry = calculateOverlayDrawGeometry(
      transform,
      REFERENCE_CLAWD_ASSET,
      output,
    );

    expect(geometry.anchorX).toBe(-240);
    expect(geometry.anchorY).toBe(1920);
  });

  it.each([-179.9, -45, 0, 45, 179.9, 180, -180])(
    'maps %s clockwise CSS degrees directly to Canvas radians',
    (rotation) => {
      expect(clockwiseDegreesToCanvasRadians(rotation)).toBeCloseTo(
        (rotation * Math.PI) / 180,
      );
    },
  );
});

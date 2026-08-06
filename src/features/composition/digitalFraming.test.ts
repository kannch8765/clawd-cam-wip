import { FOCAL_PRESETS } from '../camera/focalPresets';
import {
  calculateCoverCrop,
  calculateDigitalFramingCrop,
} from './captureGeometry';
import { CaptureError } from './compositionTypes';

describe('digital framing crop geometry', () => {
  it('preserves the existing cover crop exactly at 24 eq.', () => {
    const input = {
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 390,
      previewHeight: 844,
    };

    expect(calculateDigitalFramingCrop({ ...input, zoomRatio: 1 })).toEqual(
      calculateCoverCrop(input),
    );
  });

  it.each([
    ['35 eq.', 35 / 24],
    ['50 eq.', 50 / 24],
    ['77 eq.', 77 / 24],
    ['120 eq.', 5],
  ])('centers the reduced %s crop', (_label, zoomRatio) => {
    const base = calculateCoverCrop({
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 390,
      previewHeight: 844,
    });
    const crop = calculateDigitalFramingCrop({
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 390,
      previewHeight: 844,
      zoomRatio,
    });

    expect(crop.visibleSourceWidth).toBeCloseTo(
      base.visibleSourceWidth / zoomRatio,
    );
    expect(crop.visibleSourceHeight).toBeCloseTo(
      base.visibleSourceHeight / zoomRatio,
    );
    expect(crop.cropX).toBeCloseTo(
      base.cropX + (base.visibleSourceWidth - crop.visibleSourceWidth) / 2,
    );
    expect(crop.cropY).toBeCloseTo(
      base.cropY + (base.visibleSourceHeight - crop.visibleSourceHeight) / 2,
    );
  });

  it('handles a landscape source in a portrait preview', () => {
    const crop = calculateDigitalFramingCrop({
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 390,
      previewHeight: 844,
      zoomRatio: 50 / 24,
    });

    expect(crop.visibleSourceWidth).toBeCloseTo(239.54502369668248);
    expect(crop.visibleSourceHeight).toBeCloseTo(518.4);
    expect(crop.cropX).toBeCloseTo(840.2274881516588);
    expect(crop.cropY).toBeCloseTo(280.8);
  });

  it('handles a portrait source in a landscape preview', () => {
    const crop = calculateDigitalFramingCrop({
      videoWidth: 1080,
      videoHeight: 1920,
      previewWidth: 844,
      previewHeight: 390,
      zoomRatio: 50 / 24,
    });

    expect(crop.visibleSourceWidth).toBeCloseTo(518.4);
    expect(crop.visibleSourceHeight).toBeCloseTo(239.54502369668248);
    expect(crop.cropX).toBeCloseTo(280.8);
    expect(crop.cropY).toBeCloseTo(840.2274881516588);
  });

  it('uses exact centered values for matching aspect ratios', () => {
    const crop = calculateDigitalFramingCrop({
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 1280,
      previewHeight: 720,
      zoomRatio: 5,
    });

    expect(crop.visibleSourceWidth).toBe(384);
    expect(crop.visibleSourceHeight).toBe(216);
    expect(crop.cropX).toBe(768);
    expect(crop.cropY).toBe(432);
  });

  it.each([
    [1920, 1080, 390, 844],
    [1080, 1920, 844, 390],
    [1920, 1080, 1280, 720],
  ])(
    'keeps every preset finite, positive, and inside %sx%s source bounds',
    (videoWidth, videoHeight, previewWidth, previewHeight) => {
      for (const preset of FOCAL_PRESETS) {
        const crop = calculateDigitalFramingCrop({
          videoWidth,
          videoHeight,
          previewWidth,
          previewHeight,
          zoomRatio: preset.zoomRatio,
        });

        expect(Number.isFinite(crop.cropX)).toBe(true);
        expect(Number.isFinite(crop.cropY)).toBe(true);
        expect(crop.visibleSourceWidth).toBeGreaterThan(0);
        expect(crop.visibleSourceHeight).toBeGreaterThan(0);
        expect(crop.cropX).toBeGreaterThanOrEqual(0);
        expect(crop.cropY).toBeGreaterThanOrEqual(0);
        expect(crop.cropX + crop.visibleSourceWidth).toBeLessThanOrEqual(
          videoWidth,
        );
        expect(crop.cropY + crop.visibleSourceHeight).toBeLessThanOrEqual(
          videoHeight,
        );
      }
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, -1, 0.5])(
    'rejects an invalid digital zoom ratio of %s',
    (zoomRatio) => {
      expect(() =>
        calculateDigitalFramingCrop({
          videoWidth: 1920,
          videoHeight: 1080,
          previewWidth: 390,
          previewHeight: 844,
          zoomRatio,
        }),
      ).toThrow(CaptureError);
    },
  );
});

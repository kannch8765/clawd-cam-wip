import {
  applyDragGesture,
  applyPinchGesture,
  clampOverlayScale,
  constrainOverlayTransform,
  normalizeOverlayRotation,
  pixelDeltaToNormalized,
} from './overlayGeometry';
import { DEFAULT_OVERLAY_TRANSFORM, OVERLAY_LIMITS } from './overlayTypes';

describe('overlay geometry', () => {
  it('defines the default transform in normalized preview coordinates', () => {
    expect(DEFAULT_OVERLAY_TRANSFORM).toEqual({
      x: 0.5,
      y: 0.52,
      scale: 1,
      rotation: 0,
    });
  });

  it('converts CSS pixel movement to normalized movement', () => {
    expect(
      pixelDeltaToNormalized({ x: 50, y: -25 }, { width: 200, height: 100 }),
    ).toEqual({ x: 0.25, y: -0.25 });
  });

  it('rejects unusable preview dimensions', () => {
    expect(() =>
      pixelDeltaToNormalized({ x: 1, y: 1 }, { width: 0, height: 100 }),
    ).toThrow(RangeError);
  });

  it('maps a single-pointer drag from CSS pixels into normalized x and y', () => {
    expect(
      applyDragGesture(
        { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
        { x: 40, y: -20 },
        { width: 200, height: 100 },
      ),
    ).toEqual({ x: 0.7, y: 0.3, scale: 1, rotation: 0 });
  });

  it('keeps relative placement stable across preview CSS sizes', () => {
    const smallPreview = applyDragGesture(
      DEFAULT_OVERLAY_TRANSFORM,
      { x: 40, y: 40 },
      { width: 200, height: 400 },
    );
    const largePreview = applyDragGesture(
      DEFAULT_OVERLAY_TRANSFORM,
      { x: 80, y: 80 },
      { width: 400, height: 800 },
    );

    expect(largePreview).toEqual(smallPreview);
    expect(largePreview.x).toBeCloseTo(0.7);
    expect(largePreview.y).toBeCloseTo(0.62);
  });

  it('clamps scale at the centralized minimum and maximum', () => {
    expect(clampOverlayScale(0.01)).toBe(OVERLAY_LIMITS.minScale);
    expect(clampOverlayScale(99)).toBe(OVERLAY_LIMITS.maxScale);
  });

  it('normalizes clockwise rotation to (-180, 180]', () => {
    expect(normalizeOverlayRotation(181)).toBe(-179);
    expect(normalizeOverlayRotation(-181)).toBe(179);
    expect(normalizeOverlayRotation(540)).toBe(180);
  });

  it('allows a bounded amount of placement outside the visible frame', () => {
    expect(
      constrainOverlayTransform({
        x: -10,
        y: 10,
        scale: 1,
        rotation: 0,
      }),
    ).toEqual({
      x: OVERLAY_LIMITS.minX,
      y: OVERLAY_LIMITS.maxY,
      scale: 1,
      rotation: 0,
    });
  });

  it('maps pinch scale and clockwise rotation into authoritative state', () => {
    expect(
      applyPinchGesture({
        start: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
        startOrigin: { x: 100, y: 100 },
        currentOrigin: { x: 100, y: 100 },
        scale: 1.75,
        rotation: 45,
        previewSize: { width: 200, height: 200 },
      }),
    ).toEqual({ x: 0.5, y: 0.5, scale: 1.75, rotation: 45 });
  });

  it('moves with the pinch center without jumping back to a default position', () => {
    const transformed = applyPinchGesture({
      start: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      startOrigin: { x: 100, y: 100 },
      currentOrigin: { x: 130, y: 120 },
      scale: 2,
      rotation: 90,
      previewSize: { width: 200, height: 200 },
    });

    expect(transformed).toEqual({ x: 0.65, y: 0.6, scale: 2, rotation: 90 });
  });

  it('rotates and scales the existing anchor around the gesture origin', () => {
    const transformed = applyPinchGesture({
      start: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      startOrigin: { x: 80, y: 100 },
      currentOrigin: { x: 80, y: 100 },
      scale: 1.5,
      rotation: 90,
      previewSize: { width: 200, height: 200 },
    });

    expect(transformed.x).toBeCloseTo(0.4);
    expect(transformed.y).toBeCloseTo(0.65);
    expect(transformed.scale).toBe(1.5);
    expect(transformed.rotation).toBe(90);
  });
});

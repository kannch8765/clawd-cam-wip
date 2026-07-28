import { OVERLAY_LIMITS, type OverlayTransform } from './overlayTypes';

export interface PreviewSize {
  width: number;
  height: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

function assertPreviewSize(size: PreviewSize): void {
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) {
    throw new RangeError('Preview dimensions must be finite.');
  }

  if (size.width <= 0 || size.height <= 0) {
    throw new RangeError('Preview dimensions must be greater than zero.');
  }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function clampOverlayScale(scale: number): number {
  return clamp(scale, OVERLAY_LIMITS.minScale, OVERLAY_LIMITS.maxScale);
}

export function normalizeOverlayRotation(rotation: number): number {
  const normalized = ((((rotation + 180) % 360) + 360) % 360) - 180;
  return normalized === -180 ? 180 : normalized;
}

export function pixelDeltaToNormalized(
  delta: PixelPoint,
  previewSize: PreviewSize,
): PixelPoint {
  assertPreviewSize(previewSize);

  return {
    x: delta.x / previewSize.width,
    y: delta.y / previewSize.height,
  };
}

export function constrainOverlayTransform(
  transform: OverlayTransform,
): OverlayTransform {
  return {
    x: clamp(transform.x, OVERLAY_LIMITS.minX, OVERLAY_LIMITS.maxX),
    y: clamp(transform.y, OVERLAY_LIMITS.minY, OVERLAY_LIMITS.maxY),
    scale: clampOverlayScale(transform.scale),
    rotation: normalizeOverlayRotation(transform.rotation),
  };
}

export function applyDragGesture(
  start: OverlayTransform,
  movement: PixelPoint,
  previewSize: PreviewSize,
): OverlayTransform {
  const normalizedMovement = pixelDeltaToNormalized(movement, previewSize);

  return constrainOverlayTransform({
    ...start,
    x: start.x + normalizedMovement.x,
    y: start.y + normalizedMovement.y,
  });
}

export interface PinchGestureInput {
  start: OverlayTransform;
  startOrigin: PixelPoint;
  currentOrigin: PixelPoint;
  scale: number;
  rotation: number;
  previewSize: PreviewSize;
}

export function applyPinchGesture({
  start,
  startOrigin,
  currentOrigin,
  scale,
  rotation,
  previewSize,
}: PinchGestureInput): OverlayTransform {
  assertPreviewSize(previewSize);

  const nextScale = clampOverlayScale(scale);
  const nextRotation = normalizeOverlayRotation(rotation);
  const scaleRatio = nextScale / Math.max(start.scale, Number.EPSILON);
  const rotationDeltaRadians =
    (normalizeOverlayRotation(nextRotation - start.rotation) * Math.PI) / 180;
  const cosine = Math.cos(rotationDeltaRadians);
  const sine = Math.sin(rotationDeltaRadians);
  const startAnchor = {
    x: start.x * previewSize.width,
    y: start.y * previewSize.height,
  };
  const relativeAnchor = {
    x: startAnchor.x - startOrigin.x,
    y: startAnchor.y - startOrigin.y,
  };
  const rotatedAnchor = {
    x: relativeAnchor.x * cosine - relativeAnchor.y * sine,
    y: relativeAnchor.x * sine + relativeAnchor.y * cosine,
  };

  return constrainOverlayTransform({
    x: (currentOrigin.x + rotatedAnchor.x * scaleRatio) / previewSize.width,
    y: (currentOrigin.y + rotatedAnchor.y * scaleRatio) / previewSize.height,
    scale: nextScale,
    rotation: nextRotation,
  });
}

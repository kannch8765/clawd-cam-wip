import type {
  OverlayAssetDescriptor,
  OverlayTransform,
} from '../overlay/overlayTypes';
import {
  CaptureError,
  type CaptureCropGeometry,
  type CaptureOutputSize,
  type OverlayDrawGeometry,
} from './compositionTypes';

export const CAPTURE_MIN_LONG_EDGE = 960;
export const CAPTURE_MAX_LONG_EDGE = 2048;

interface CoverCropInput {
  videoWidth: number;
  videoHeight: number;
  previewWidth: number;
  previewHeight: number;
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new CaptureError(
      'invalid-geometry',
      `${label} must be a finite number greater than zero.`,
    );
  }
}

export function calculateCoverCrop({
  videoWidth,
  videoHeight,
  previewWidth,
  previewHeight,
}: CoverCropInput): CaptureCropGeometry {
  assertPositiveFinite(videoWidth, 'Video width');
  assertPositiveFinite(videoHeight, 'Video height');
  assertPositiveFinite(previewWidth, 'Preview width');
  assertPositiveFinite(previewHeight, 'Preview height');

  const coverScale = Math.max(
    previewWidth / videoWidth,
    previewHeight / videoHeight,
  );
  const visibleSourceWidth = previewWidth / coverScale;
  const visibleSourceHeight = previewHeight / coverScale;
  const cropX = (videoWidth - visibleSourceWidth) / 2;
  const cropY = (videoHeight - visibleSourceHeight) / 2;

  return {
    coverScale,
    cropX,
    cropY,
    visibleSourceWidth,
    visibleSourceHeight,
  };
}

export function calculateOutputSize(
  crop: Pick<CaptureCropGeometry, 'visibleSourceWidth' | 'visibleSourceHeight'>,
): CaptureOutputSize {
  assertPositiveFinite(crop.visibleSourceWidth, 'Visible source width');
  assertPositiveFinite(crop.visibleSourceHeight, 'Visible source height');

  const aspectRatio = crop.visibleSourceWidth / crop.visibleSourceHeight;
  const sourceLongEdge = Math.max(
    crop.visibleSourceWidth,
    crop.visibleSourceHeight,
  );
  const targetLongEdge = Math.min(
    CAPTURE_MAX_LONG_EDGE,
    Math.max(CAPTURE_MIN_LONG_EDGE, sourceLongEdge),
  );

  if (aspectRatio >= 1) {
    return {
      width: Math.round(targetLongEdge),
      height: Math.max(1, Math.round(targetLongEdge / aspectRatio)),
    };
  }

  return {
    width: Math.max(1, Math.round(targetLongEdge * aspectRatio)),
    height: Math.round(targetLongEdge),
  };
}

export function clockwiseDegreesToCanvasRadians(rotation: number): number {
  if (!Number.isFinite(rotation)) {
    throw new CaptureError(
      'invalid-geometry',
      'Overlay rotation must be finite.',
    );
  }

  return (rotation * Math.PI) / 180;
}

export function calculateOverlayDrawGeometry(
  transform: Readonly<OverlayTransform>,
  asset: Readonly<OverlayAssetDescriptor>,
  output: Readonly<CaptureOutputSize>,
): OverlayDrawGeometry {
  assertPositiveFinite(output.width, 'Output width');
  assertPositiveFinite(output.height, 'Output height');
  assertPositiveFinite(asset.aspectRatio, 'Overlay aspect ratio');
  assertPositiveFinite(
    asset.canonicalDisplayWidth,
    'Overlay canonical display width',
  );
  assertPositiveFinite(transform.scale, 'Overlay scale');

  const normalizedValues = [
    transform.x,
    transform.y,
    asset.anchor.x,
    asset.anchor.y,
  ];
  if (normalizedValues.some((value) => !Number.isFinite(value))) {
    throw new CaptureError(
      'invalid-geometry',
      'Overlay position and anchor values must be finite.',
    );
  }

  const width = asset.canonicalDisplayWidth * output.width * transform.scale;
  const height = width / asset.aspectRatio;
  const anchorX = transform.x * output.width;
  const anchorY = transform.y * output.height;

  return {
    anchorX,
    anchorY,
    width,
    height,
    drawX: -asset.anchor.x * width,
    drawY: -asset.anchor.y * height,
    rotationRadians: clockwiseDegreesToCanvasRadians(transform.rotation),
  };
}

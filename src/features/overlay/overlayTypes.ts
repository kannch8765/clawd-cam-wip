export interface OverlayTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface OverlayAnchor {
  x: number;
  y: number;
}

export interface OverlayAssetDescriptor {
  id: string;
  label: string;
  previewAssetUrl: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  aspectRatio: number;
  anchor: OverlayAnchor;
  canonicalDisplayWidth: number;
}

export const OVERLAY_LIMITS = Object.freeze({
  minScale: 0.35,
  maxScale: 2.5,
  minX: -0.25,
  maxX: 1.25,
  minY: -0.25,
  maxY: 1.25,
});

export const DEFAULT_OVERLAY_TRANSFORM: Readonly<OverlayTransform> =
  Object.freeze({
    x: 0.5,
    y: 0.52,
    scale: 1,
    rotation: 0,
  });

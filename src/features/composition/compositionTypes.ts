import type {
  CameraCaptureSource,
  CameraFacingMode,
} from '../camera/cameraTypes';
import type { CameraFraming, FocalPresetId } from '../camera/focalPresets';
import type {
  OverlayAssetDescriptor,
  OverlayTransform,
} from '../overlay/overlayTypes';

export type CaptureErrorCode =
  | 'camera-not-ready'
  | 'stream-changed'
  | 'invalid-geometry'
  | 'asset-decode-failed'
  | 'asset-decode-timeout'
  | 'canvas-unavailable'
  | 'context-unavailable'
  | 'blob-unsupported'
  | 'blob-failed'
  | 'blob-timeout'
  | 'unexpected';

export class CaptureError extends Error {
  readonly code: CaptureErrorCode;
  readonly cause?: unknown;

  constructor(code: CaptureErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'CaptureError';
    this.code = code;
    this.cause = cause;
  }
}

export interface CaptureCropGeometry {
  coverScale: number;
  cropX: number;
  cropY: number;
  visibleSourceWidth: number;
  visibleSourceHeight: number;
}

export interface CaptureOutputSize {
  width: number;
  height: number;
}

export interface OverlayDrawGeometry {
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
  drawX: number;
  drawY: number;
  rotationRadians: number;
}

export interface CaptureSnapshot {
  camera: CameraCaptureSource;
  videoWidth: number;
  videoHeight: number;
  previewWidth: number;
  previewHeight: number;
  focalPresetId: FocalPresetId;
  digitalZoomRatio: number;
  framingCenter: { x: number; y: number };
  crop: CaptureCropGeometry;
  output: CaptureOutputSize;
  facingMode: CameraFacingMode;
  mirrored: boolean;
  overlayAsset: OverlayAssetDescriptor;
  overlayTransform: OverlayTransform;
  capturedAt: string;
}

export interface PhotoCaptureResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  capturedAt: string;
  facingMode: CameraFacingMode;
  mirrored: boolean;
  overlayAssetId: string;
  overlayTransform: OverlayTransform;
}

export interface CanvasSurface {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

export interface CompositionAdapter {
  loadImage(asset: OverlayAssetDescriptor): Promise<CanvasImageSource>;
  createCanvas(width: number, height: number): CanvasSurface;
  canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number,
  ): Promise<Blob>;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  now(): Date;
}

export interface CaptureSnapshotInput {
  camera: CameraCaptureSource;
  previewWidth: number;
  previewHeight: number;
  overlayAsset: OverlayAssetDescriptor;
  overlayTransform: OverlayTransform;
  cameraFraming?: Readonly<CameraFraming>;
  capturedAt: Date;
}

import type { CameraCaptureSource } from '../camera/cameraTypes';
import {
  createCameraFraming,
  DEFAULT_CAMERA_FRAMING,
} from '../camera/focalPresets';
import type {
  OverlayAssetDescriptor,
  OverlayTransform,
} from '../overlay/overlayTypes';
import { CAPTURE_MIME_TYPE, CAPTURE_QUALITY } from './captureAdapter';
import {
  calculateDigitalFramingCrop,
  calculateOutputSize,
  calculateOverlayDrawGeometry,
} from './captureGeometry';
import {
  CaptureError,
  type CaptureSnapshot,
  type CaptureSnapshotInput,
  type CompositionAdapter,
  type PhotoCaptureResult,
} from './compositionTypes';

function copyAsset(
  asset: Readonly<OverlayAssetDescriptor>,
): OverlayAssetDescriptor {
  return {
    ...asset,
    anchor: { ...asset.anchor },
  };
}

function copyTransform(
  transform: Readonly<OverlayTransform>,
): OverlayTransform {
  return { ...transform };
}

function hasUsableTracks(stream: MediaStream): boolean {
  const tracks = stream.getTracks();
  return (
    tracks.length > 0 &&
    tracks.every(
      (track) => track.readyState === undefined || track.readyState !== 'ended',
    )
  );
}

export function isCaptureSourceUsable(source: CameraCaptureSource): boolean {
  return (
    source.video.srcObject === source.stream &&
    source.video.videoWidth > 0 &&
    source.video.videoHeight > 0 &&
    hasUsableTracks(source.stream)
  );
}

export function freezeCaptureSnapshot({
  camera,
  previewWidth,
  previewHeight,
  overlayAsset,
  overlayTransform,
  cameraFraming = DEFAULT_CAMERA_FRAMING,
  capturedAt,
}: CaptureSnapshotInput): CaptureSnapshot {
  if (!isCaptureSourceUsable(camera)) {
    throw new CaptureError(
      'camera-not-ready',
      'The current camera frame is not ready to capture.',
    );
  }

  const videoWidth = camera.video.videoWidth;
  const videoHeight = camera.video.videoHeight;
  const framing = createCameraFraming(cameraFraming.presetId);
  const crop = calculateDigitalFramingCrop({
    videoWidth,
    videoHeight,
    previewWidth,
    previewHeight,
    zoomRatio: framing.zoomRatio,
    centerX: framing.centerX,
    centerY: framing.centerY,
  });
  const output = calculateOutputSize(crop);

  return {
    camera,
    videoWidth,
    videoHeight,
    previewWidth,
    previewHeight,
    focalPresetId: framing.presetId,
    digitalZoomRatio: framing.zoomRatio,
    framingCenter: { x: framing.centerX, y: framing.centerY },
    crop,
    output,
    facingMode: camera.facingMode,
    mirrored: camera.facingMode === 'user',
    overlayAsset: copyAsset(overlayAsset),
    overlayTransform: copyTransform(overlayTransform),
    capturedAt: capturedAt.toISOString(),
  };
}

export function drawCameraFrame(
  context: CanvasRenderingContext2D,
  snapshot: CaptureSnapshot,
): void {
  const { crop, output } = snapshot;
  const drawFrame = () => {
    context.drawImage(
      snapshot.camera.video,
      crop.cropX,
      crop.cropY,
      crop.visibleSourceWidth,
      crop.visibleSourceHeight,
      0,
      0,
      output.width,
      output.height,
    );
  };

  if (!snapshot.mirrored) {
    drawFrame();
    return;
  }

  context.save();
  try {
    context.translate(output.width, 0);
    context.scale(-1, 1);
    drawFrame();
  } finally {
    context.restore();
  }
}

export function drawOverlay(
  context: CanvasRenderingContext2D,
  snapshot: CaptureSnapshot,
  image: CanvasImageSource,
): void {
  const geometry = calculateOverlayDrawGeometry(
    snapshot.overlayTransform,
    snapshot.overlayAsset,
    snapshot.output,
  );

  context.save();
  try {
    context.translate(geometry.anchorX, geometry.anchorY);
    context.rotate(geometry.rotationRadians);
    context.drawImage(
      image,
      geometry.drawX,
      geometry.drawY,
      geometry.width,
      geometry.height,
    );
  } finally {
    context.restore();
  }
}

export function drawComposition(
  context: CanvasRenderingContext2D,
  snapshot: CaptureSnapshot,
  image: CanvasImageSource,
): void {
  drawCameraFrame(context, snapshot);
  drawOverlay(context, snapshot, image);
}

interface ComposePhotoInput {
  snapshot: CaptureSnapshot;
  image: CanvasImageSource;
  adapter: CompositionAdapter;
  isSourceCurrent(source: CameraCaptureSource): boolean;
}

function assertSourceCurrent(
  snapshot: CaptureSnapshot,
  isSourceCurrent: (source: CameraCaptureSource) => boolean,
): void {
  if (
    !isSourceCurrent(snapshot.camera) ||
    snapshot.camera.video.videoWidth !== snapshot.videoWidth ||
    snapshot.camera.video.videoHeight !== snapshot.videoHeight
  ) {
    throw new CaptureError(
      'stream-changed',
      'The camera changed while the photo was being captured.',
    );
  }
}

export async function composePhoto({
  snapshot,
  image,
  adapter,
  isSourceCurrent,
}: ComposePhotoInput): Promise<PhotoCaptureResult> {
  assertSourceCurrent(snapshot, isSourceCurrent);

  const { canvas, context } = adapter.createCanvas(
    snapshot.output.width,
    snapshot.output.height,
  );
  drawComposition(context, snapshot, image);

  const blob = await adapter.canvasToBlob(
    canvas,
    CAPTURE_MIME_TYPE,
    CAPTURE_QUALITY,
  );

  assertSourceCurrent(snapshot, isSourceCurrent);

  return {
    blob,
    mimeType: blob.type || CAPTURE_MIME_TYPE,
    width: snapshot.output.width,
    height: snapshot.output.height,
    capturedAt: snapshot.capturedAt,
    facingMode: snapshot.facingMode,
    mirrored: snapshot.mirrored,
    overlayAssetId: snapshot.overlayAsset.id,
    overlayTransform: copyTransform(snapshot.overlayTransform),
  };
}

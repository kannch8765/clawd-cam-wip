import { vi } from 'vitest';
import type { CameraCaptureSource } from '../camera/cameraTypes';
import {
  createCameraFraming,
  type CameraFraming,
  type FocalPresetId,
} from '../camera/focalPresets';
import { REFERENCE_CLAWD_ASSET } from '../overlay/overlayAssets';
import { DEFAULT_OVERLAY_TRANSFORM } from '../overlay/overlayTypes';
import {
  composePhoto,
  drawComposition,
  freezeCaptureSnapshot,
} from './composePhoto';
import {
  calculateCoverCrop,
  calculateDigitalFramingCrop,
} from './captureGeometry';
import type { CompositionAdapter } from './compositionTypes';

class ActiveTrack extends EventTarget {
  readonly readyState = 'live';
  stop() {}
}

function createCameraSource(
  videoWidth = 1920,
  videoHeight = 1080,
): CameraCaptureSource {
  const track = new ActiveTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
  const video = {
    srcObject: stream,
    videoWidth,
    videoHeight,
  } as unknown as HTMLVideoElement;

  return {
    requestId: 7,
    stream,
    video,
    facingMode: 'environment',
    dimensions: { width: videoWidth, height: videoHeight },
  };
}

function createSnapshot(
  presetId: FocalPresetId,
  camera = createCameraSource(),
) {
  return freezeCaptureSnapshot({
    camera,
    previewWidth: 390,
    previewHeight: 844,
    overlayAsset: REFERENCE_CLAWD_ASSET,
    overlayTransform: { ...DEFAULT_OVERLAY_TRANSFORM },
    cameraFraming: createCameraFraming(presetId),
    capturedAt: new Date('2026-08-06T09:00:00.000Z'),
  });
}

function createContextRecorder() {
  const overlayImage = { overlay: true } as unknown as CanvasImageSource;
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  return { context, overlayImage };
}

function createAdapter(context: CanvasRenderingContext2D): CompositionAdapter {
  return {
    loadImage: vi.fn(),
    createCanvas: vi.fn((width, height) => ({
      canvas: { width, height } as HTMLCanvasElement,
      context,
    })),
    canvasToBlob: vi.fn(
      async () => new Blob(['photo'], { type: 'image/jpeg' }),
    ),
    createObjectURL: vi.fn(() => 'blob:photo'),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date('2026-08-06T09:00:00.000Z')),
  };
}

describe('digital framing composition', () => {
  it('keeps 24 eq. on the existing cover-crop path', () => {
    const snapshot = createSnapshot('24');
    const expectedCrop = calculateCoverCrop({
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 390,
      previewHeight: 844,
    });
    const { context, overlayImage } = createContextRecorder();

    drawComposition(context, snapshot, overlayImage);

    expect(snapshot.crop).toEqual(expectedCrop);
    expect(context.drawImage).toHaveBeenNthCalledWith(
      1,
      snapshot.camera.video,
      expectedCrop.cropX,
      expectedCrop.cropY,
      expectedCrop.visibleSourceWidth,
      expectedCrop.visibleSourceHeight,
      0,
      0,
      snapshot.output.width,
      snapshot.output.height,
    );
  });

  it.each([
    ['50', 50 / 24],
    ['120', 5],
  ] as const)(
    'draws the centered %s eq. crop without changing overlay geometry',
    (presetId, zoomRatio) => {
      const snapshot = createSnapshot(presetId);
      const expectedCrop = calculateDigitalFramingCrop({
        videoWidth: 1920,
        videoHeight: 1080,
        previewWidth: 390,
        previewHeight: 844,
        zoomRatio,
      });
      const { context, overlayImage } = createContextRecorder();

      drawComposition(context, snapshot, overlayImage);

      expect(snapshot.crop).toEqual(expectedCrop);
      expect(context.drawImage).toHaveBeenNthCalledWith(
        1,
        snapshot.camera.video,
        expectedCrop.cropX,
        expectedCrop.cropY,
        expectedCrop.visibleSourceWidth,
        expectedCrop.visibleSourceHeight,
        0,
        0,
        snapshot.output.width,
        snapshot.output.height,
      );
      expect(context.drawImage).toHaveBeenNthCalledWith(
        2,
        overlayImage,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
      expect(snapshot.output.width / snapshot.output.height).toBeCloseTo(
        390 / 844,
        2,
      );
    },
  );

  it('freezes 50 eq. when live framing changes to 120 eq. in flight', async () => {
    const framing: CameraFraming = createCameraFraming('50');
    const snapshot = freezeCaptureSnapshot({
      camera: createCameraSource(),
      previewWidth: 390,
      previewHeight: 844,
      overlayAsset: REFERENCE_CLAWD_ASSET,
      overlayTransform: { ...DEFAULT_OVERLAY_TRANSFORM },
      cameraFraming: framing,
      capturedAt: new Date('2026-08-06T09:00:00.000Z'),
    });
    const frozenCrop = { ...snapshot.crop };
    framing.presetId = '120';
    framing.zoomRatio = 5;
    const { context, overlayImage } = createContextRecorder();

    await composePhoto({
      snapshot,
      image: overlayImage,
      adapter: createAdapter(context),
      isSourceCurrent: () => true,
    });

    expect(snapshot.focalPresetId).toBe('50');
    expect(snapshot.digitalZoomRatio).toBe(50 / 24);
    expect(snapshot.crop).toEqual(frozenCrop);
    expect(context.drawImage).toHaveBeenNthCalledWith(
      1,
      snapshot.camera.video,
      frozenCrop.cropX,
      frozenCrop.cropY,
      frozenCrop.visibleSourceWidth,
      frozenCrop.visibleSourceHeight,
      0,
      0,
      snapshot.output.width,
      snapshot.output.height,
    );
  });

  it('preserves preset ID but recomputes pixels for a new camera source', () => {
    const landscape = createSnapshot('77', createCameraSource(1920, 1080));
    const portrait = createSnapshot('77', createCameraSource(1080, 1920));

    expect(landscape.focalPresetId).toBe('77');
    expect(portrait.focalPresetId).toBe('77');
    expect(landscape.crop).not.toEqual(portrait.crop);
    expect(landscape.crop.cropX).not.toBe(portrait.crop.cropX);
  });
});

import { vi } from 'vitest';
import type { CameraCaptureSource } from '../camera/cameraTypes';
import { REFERENCE_CLAWD_ASSET } from '../overlay/overlayAssets';
import type { OverlayTransform } from '../overlay/overlayTypes';
import {
  composePhoto,
  drawComposition,
  freezeCaptureSnapshot,
} from './composePhoto';
import { CaptureError, type CompositionAdapter } from './compositionTypes';

class ActiveTrack extends EventTarget {
  readonly readyState = 'live';
  stop() {}
}

function createCameraSource(
  facingMode: 'user' | 'environment' = 'environment',
): CameraCaptureSource {
  const track = new ActiveTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
  const video = {
    srcObject: stream,
    videoWidth: 1920,
    videoHeight: 1080,
  } as unknown as HTMLVideoElement;

  return {
    requestId: 7,
    stream,
    video,
    facingMode,
    dimensions: { width: 1920, height: 1080 },
  };
}

function createSnapshot(
  facingMode: 'user' | 'environment' = 'environment',
  transform: OverlayTransform = {
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 30,
  },
) {
  return freezeCaptureSnapshot({
    camera: createCameraSource(facingMode),
    previewWidth: 390,
    previewHeight: 844,
    overlayAsset: REFERENCE_CLAWD_ASSET,
    overlayTransform: transform,
    capturedAt: new Date('2026-07-28T12:34:56.000Z'),
  });
}

function createContextRecorder() {
  const commands: string[] = [];
  const context = {
    save: vi.fn(() => commands.push('save')),
    restore: vi.fn(() => commands.push('restore')),
    translate: vi.fn(() => commands.push('translate')),
    scale: vi.fn(() => commands.push('scale')),
    rotate: vi.fn(() => commands.push('rotate')),
    drawImage: vi.fn((source: CanvasImageSource) => {
      commands.push(source === imageSource ? 'draw-overlay' : 'draw-camera');
    }),
    fillRect: vi.fn(() => commands.push('fill')),
  } as unknown as CanvasRenderingContext2D;
  const imageSource = { kind: 'decoded-clawd' } as unknown as CanvasImageSource;

  return { context, commands, imageSource };
}

function createCompositionAdapter(
  context: CanvasRenderingContext2D,
  blob = new Blob(['photo'], { type: 'image/jpeg' }),
): CompositionAdapter {
  return {
    loadImage: vi.fn(),
    createCanvas: vi.fn((width, height) => ({
      canvas: { width, height } as HTMLCanvasElement,
      context,
    })),
    canvasToBlob: vi.fn(async () => blob),
    createObjectURL: vi.fn(() => 'blob:photo'),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date('2026-07-28T12:34:56.000Z')),
  };
}

describe('drawComposition', () => {
  it('draws an unmirrored rear frame before the overlay', () => {
    const { context, commands, imageSource } = createContextRecorder();

    drawComposition(context, createSnapshot('environment'), imageSource);

    expect(commands).toEqual([
      'draw-camera',
      'save',
      'translate',
      'rotate',
      'draw-overlay',
      'restore',
    ]);
    expect(context.scale).not.toHaveBeenCalled();
  });

  it('mirrors only the front camera frame and restores before overlay drawing', () => {
    const { context, commands, imageSource } = createContextRecorder();
    const snapshot = createSnapshot('user');

    drawComposition(context, snapshot, imageSource);

    expect(commands).toEqual([
      'save',
      'translate',
      'scale',
      'draw-camera',
      'restore',
      'save',
      'translate',
      'rotate',
      'draw-overlay',
      'restore',
    ]);
    expect(context.scale).toHaveBeenCalledTimes(1);
    expect(context.scale).toHaveBeenCalledWith(-1, 1);
    expect(context.translate).toHaveBeenNthCalledWith(
      1,
      snapshot.output.width,
      0,
    );
  });

  it('uses source-crop drawImage arguments for the camera frame', () => {
    const { context, imageSource } = createContextRecorder();
    const snapshot = createSnapshot();

    drawComposition(context, snapshot, imageSource);

    expect(context.drawImage).toHaveBeenNthCalledWith(
      1,
      snapshot.camera.video,
      snapshot.crop.cropX,
      snapshot.crop.cropY,
      snapshot.crop.visibleSourceWidth,
      snapshot.crop.visibleSourceHeight,
      0,
      0,
      snapshot.output.width,
      snapshot.output.height,
    );
  });

  it('draws partially off-canvas overlays instead of clipping geometry', () => {
    const { context, imageSource } = createContextRecorder();
    const snapshot = createSnapshot('environment', {
      x: -0.2,
      y: 1.2,
      scale: 2.5,
      rotation: -179,
    });

    drawComposition(context, snapshot, imageSource);

    expect(context.translate).toHaveBeenLastCalledWith(
      -0.2 * snapshot.output.width,
      1.2 * snapshot.output.height,
    );
    expect(context.drawImage).toHaveBeenCalledTimes(2);
  });

  it('does not paint a white card behind transparent overlay pixels', () => {
    const { context, imageSource } = createContextRecorder();

    drawComposition(context, createSnapshot(), imageSource);

    expect(context.fillRect).not.toHaveBeenCalled();
  });
});

describe('composePhoto', () => {
  it('returns Blob metadata from the frozen snapshot', async () => {
    const { context, imageSource } = createContextRecorder();
    const adapter = createCompositionAdapter(context);
    const snapshot = createSnapshot('user');

    const result = await composePhoto({
      snapshot,
      image: imageSource,
      adapter,
      isSourceCurrent: () => true,
    });

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.width).toBe(snapshot.output.width);
    expect(result.height).toBe(snapshot.output.height);
    expect(result.capturedAt).toBe('2026-07-28T12:34:56.000Z');
    expect(result.facingMode).toBe('user');
    expect(result.mirrored).toBe(true);
    expect(result.overlayAssetId).toBe(REFERENCE_CLAWD_ASSET.id);
    expect(result.overlayTransform).toEqual(snapshot.overlayTransform);
  });

  it('keeps the shutter-time transform after the caller mutates its source object', async () => {
    const transform: OverlayTransform = {
      x: 0.2,
      y: 0.3,
      scale: 1.4,
      rotation: -25,
    };
    const snapshot = createSnapshot('environment', transform);
    transform.x = 0.9;
    transform.rotation = 140;
    const { context, imageSource } = createContextRecorder();

    const result = await composePhoto({
      snapshot,
      image: imageSource,
      adapter: createCompositionAdapter(context),
      isSourceCurrent: () => true,
    });

    expect(result.overlayTransform).toEqual({
      x: 0.2,
      y: 0.3,
      scale: 1.4,
      rotation: -25,
    });
  });

  it('fails before Canvas creation when the stream identity is stale', async () => {
    const { context, imageSource } = createContextRecorder();
    const adapter = createCompositionAdapter(context);

    await expect(
      composePhoto({
        snapshot: createSnapshot(),
        image: imageSource,
        adapter,
        isSourceCurrent: () => false,
      }),
    ).rejects.toMatchObject({ code: 'stream-changed' });
    expect(adapter.createCanvas).not.toHaveBeenCalled();
  });

  it('fails closed when the stream changes while Blob encoding is pending', async () => {
    const { context, imageSource } = createContextRecorder();
    let resolveBlob!: (blob: Blob) => void;
    const adapter = createCompositionAdapter(context);
    adapter.canvasToBlob = vi.fn(
      () =>
        new Promise<Blob>((resolve) => {
          resolveBlob = resolve;
        }),
    );
    let current = true;
    const promise = composePhoto({
      snapshot: createSnapshot(),
      image: imageSource,
      adapter,
      isSourceCurrent: () => current,
    });

    current = false;
    resolveBlob(new Blob(['late'], { type: 'image/jpeg' }));

    await expect(promise).rejects.toMatchObject({ code: 'stream-changed' });
  });

  it('propagates a missing Canvas context as a recoverable capture error', async () => {
    const { imageSource } = createContextRecorder();
    const adapter = createCompositionAdapter({} as CanvasRenderingContext2D);
    adapter.createCanvas = vi.fn(() => {
      throw new CaptureError(
        'context-unavailable',
        'A Canvas 2D context could not be created.',
      );
    });

    await expect(
      composePhoto({
        snapshot: createSnapshot(),
        image: imageSource,
        adapter,
        isSourceCurrent: () => true,
      }),
    ).rejects.toMatchObject({ code: 'context-unavailable' });
  });
});

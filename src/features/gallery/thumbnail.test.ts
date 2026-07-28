import { describe, expect, it, vi } from 'vitest';
import {
  THUMBNAIL_MAX_EDGE,
  THUMBNAIL_MIME_TYPE,
  THUMBNAIL_QUALITY,
  calculateThumbnailSize,
  generateThumbnail,
  type ThumbnailAdapter,
} from './thumbnail';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createAdapter(
  dimensions = { width: 1600, height: 900 },
  overrides: Partial<ThumbnailAdapter> = {},
): ThumbnailAdapter {
  const context = {
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  return {
    createObjectURL: vi.fn(() => 'blob:thumbnail-source'),
    revokeObjectURL: vi.fn(),
    decodeImage: vi.fn(async () => ({
      source: {} as CanvasImageSource,
      ...dimensions,
    })),
    createCanvas: vi.fn((width, height) => ({
      canvas: { width, height } as HTMLCanvasElement,
      context,
    })),
    canvasToBlob: vi.fn(
      async () => new Blob(['thumbnail'], { type: THUMBNAIL_MIME_TYPE }),
    ),
    ...overrides,
  };
}

describe('thumbnail sizing', () => {
  it('preserves a landscape ratio at the maximum edge', () => {
    expect(calculateThumbnailSize(1600, 900)).toEqual({
      width: THUMBNAIL_MAX_EDGE,
      height: 180,
    });
  });

  it('preserves a portrait ratio at the maximum edge', () => {
    expect(calculateThumbnailSize(900, 1600)).toEqual({
      width: 180,
      height: THUMBNAIL_MAX_EDGE,
    });
  });

  it('does not enlarge an image already below the target size', () => {
    expect(calculateThumbnailSize(240, 120)).toEqual({
      width: 240,
      height: 120,
    });
  });
});

describe('thumbnail generation', () => {
  it('draws the decoded image and encodes deterministic JPEG settings', async () => {
    const adapter = createAdapter();
    const source = new Blob(['full-size'], { type: 'image/jpeg' });

    const thumbnail = await generateThumbnail(source, adapter);

    expect(thumbnail.type).toBe(THUMBNAIL_MIME_TYPE);
    expect(adapter.createCanvas).toHaveBeenCalledWith(320, 180);
    expect(adapter.canvasToBlob).toHaveBeenCalledWith(
      expect.anything(),
      THUMBNAIL_MIME_TYPE,
      THUMBNAIL_QUALITY,
    );
    expect(adapter.revokeObjectURL).toHaveBeenCalledWith(
      'blob:thumbnail-source',
    );
  });

  it('reports decode failure and still revokes the temporary object URL', async () => {
    const adapter = createAdapter(undefined, {
      decodeImage: vi.fn(async () => {
        throw new Error('decode failed');
      }),
    });

    await expect(
      generateThumbnail(new Blob(['photo']), adapter),
    ).rejects.toMatchObject({ code: 'thumbnail-failed' });
    expect(adapter.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('reports a missing Canvas 2D context', async () => {
    const adapter = createAdapter(undefined, {
      createCanvas: vi.fn(() => ({
        canvas: {} as HTMLCanvasElement,
        context: null,
      })),
    });

    await expect(
      generateThumbnail(new Blob(['photo']), adapter),
    ).rejects.toMatchObject({
      code: 'thumbnail-failed',
      message: expect.stringContaining('canvas context'),
    });
  });

  it('reports a null toBlob result', async () => {
    const adapter = createAdapter(undefined, {
      canvasToBlob: vi.fn(async () => null),
    });

    await expect(
      generateThumbnail(new Blob(['photo']), adapter),
    ).rejects.toMatchObject({
      code: 'thumbnail-failed',
      message: expect.stringContaining('empty photo thumbnail'),
    });
  });

  it('bounds a permanently pending decode and revokes its URL', async () => {
    vi.useFakeTimers();
    const decode = deferred<never>();
    const adapter = createAdapter(undefined, {
      decodeImage: vi.fn(() => decode.promise),
    });
    const operation = generateThumbnail(new Blob(['photo']), adapter, 50);
    const rejection = expect(operation).rejects.toMatchObject({
      code: 'thumbnail-failed',
      message: expect.stringContaining('timed out'),
    });

    try {
      await vi.advanceTimersByTimeAsync(50);
      await rejection;
      expect(adapter.revokeObjectURL).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not modify the original full-size Blob', async () => {
    const adapter = createAdapter();
    const source = new Blob(['original'], { type: 'image/png' });
    const originalSize = source.size;

    await generateThumbnail(source, adapter);

    expect(source.size).toBe(originalSize);
    expect(source.type).toBe('image/png');
  });
});

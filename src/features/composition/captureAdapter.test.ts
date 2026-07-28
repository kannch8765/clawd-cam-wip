import { afterEach, vi } from 'vitest';
import {
  CAPTURE_BLOB_TIMEOUT_MS,
  canvasToBlob,
  createCanvasSurface,
} from './captureAdapter';
import { CaptureError } from './compositionTypes';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('canvasToBlob', () => {
  it('resolves a generated Blob', async () => {
    const expected = new Blob(['photo'], { type: 'image/jpeg' });
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(expected)),
    } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(canvas, 'image/jpeg', 0.92)).resolves.toBe(
      expected,
    );
  });

  it('rejects when Canvas returns a null Blob', async () => {
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(null)),
    } as unknown as HTMLCanvasElement;

    await expect(
      canvasToBlob(canvas, 'image/jpeg', 0.92),
    ).rejects.toMatchObject({ code: 'blob-failed' });
  });

  it('falls back to PNG when the requested encoder throws synchronously', async () => {
    const fallback = new Blob(['photo'], { type: 'image/png' });
    const toBlob = vi
      .fn<(callback: BlobCallback, type?: string, quality?: number) => void>()
      .mockImplementationOnce(() => {
        throw new TypeError('unsupported type');
      })
      .mockImplementationOnce((callback) => callback(fallback));
    const canvas = { toBlob } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(canvas, 'image/unknown', 0.92)).resolves.toBe(
      fallback,
    );
    expect(toBlob).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      'image/png',
      0.92,
    );
  });

  it('rejects instead of remaining pending forever', async () => {
    vi.useFakeTimers();
    const canvas = {
      toBlob: vi.fn(() => undefined),
    } as unknown as HTMLCanvasElement;
    const promise = canvasToBlob(canvas, 'image/jpeg', 0.92);
    const rejection = expect(promise).rejects.toMatchObject({
      code: 'blob-timeout',
    });

    await vi.advanceTimersByTimeAsync(CAPTURE_BLOB_TIMEOUT_MS);

    await rejection;
  });
});

describe('createCanvasSurface', () => {
  it('fails when a Canvas 2D context cannot be created', () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    expect(() => createCanvasSurface(1200, 1600)).toThrow(CaptureError);

    try {
      createCanvasSurface(1200, 1600);
    } catch (error) {
      expect(error).toMatchObject({ code: 'context-unavailable' });
    }
  });
});

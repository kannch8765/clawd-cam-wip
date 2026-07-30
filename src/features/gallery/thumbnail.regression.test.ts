import { describe, expect, it, vi } from 'vitest';
import {
  generateThumbnail,
  THUMBNAIL_MIME_TYPE,
  type ThumbnailAdapter,
} from './thumbnail';

const source = new Blob(['jpeg'], { type: 'image/jpeg' });

function adapter(overrides: Partial<ThumbnailAdapter> = {}): ThumbnailAdapter {
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    globalCompositeOperation: 'source-over',
  } as unknown as CanvasRenderingContext2D;
  return {
    decodeImage: vi.fn(async () => ({
      source: {} as CanvasImageSource,
      width: 1600,
      height: 1200,
      release: vi.fn(),
    })),
    createCanvas: vi.fn(() => ({
      canvas: document.createElement('canvas'),
      context,
    })),
    canvasToBlob: vi.fn(
      async () => new Blob(['png-thumbnail'], { type: THUMBNAIL_MIME_TYPE }),
    ),
    ...overrides,
  };
}

describe('iOS-compatible persisted thumbnails', () => {
  it('decodes the source Blob directly and stores a non-empty PNG summary', async () => {
    const thumbnailAdapter = adapter();

    const thumbnail = await generateThumbnail(source, thumbnailAdapter);

    expect(thumbnailAdapter.decodeImage).toHaveBeenCalledWith(source);
    expect(thumbnail.type).toBe(THUMBNAIL_MIME_TYPE);
    expect(thumbnail.size).toBeGreaterThan(0);
  });

  it('reports decode failure instead of silently persisting a black block', async () => {
    const thumbnailAdapter = adapter({
      decodeImage: vi.fn(async () =>
        Promise.reject(new Error('decode failed')),
      ),
    });

    await expect(generateThumbnail(source, thumbnailAdapter)).rejects.toThrow(
      /decode/i,
    );
  });
});

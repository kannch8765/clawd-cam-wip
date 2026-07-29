import { describe, expect, it, vi } from 'vitest';
import type { PhotoCaptureResult } from '../composition/compositionTypes';
import type { StoredPhotoRecord } from '../gallery/galleryTypes';
import {
  buildPhotoFilename,
  preparePhoto,
  shareablePhotoFromCaptureResult,
  shareablePhotoFromStoredRecord,
  type PhotoFileFactory,
} from './photoFile';
import { PhotoActionError, type ShareablePhoto } from './sharingTypes';

function makePhoto(
  overrides: Partial<ShareablePhoto> = {},
): ShareablePhoto {
  return {
    blob: new Blob(['full-size'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    width: 1440,
    height: 1080,
    capturedAt: new Date(2026, 0, 2, 3, 4, 5).getTime(),
    facingMode: 'environment',
    overlayAssetId: 'reference-clawd',
    ...overrides,
  };
}

const browserLikeFactory: PhotoFileFactory = {
  supportsFile: () => true,
  createFile: (blob, filename, options) =>
    new File([blob], filename, options),
};

describe('photo filename construction', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/avif', 'bin'],
  ])('maps %s to a safe %s extension', (mimeType, extension) => {
    const timestamp = new Date(2026, 0, 2, 3, 4, 5).getTime();
    expect(buildPhotoFilename(timestamp, mimeType)).toBe(
      `clawdcam-20260102-030405.${extension}`,
    );
  });

  it('pads local month, day, hour, minute, and second values', () => {
    const timestamp = new Date(2026, 8, 7, 6, 5, 4).getTime();
    expect(buildPhotoFilename(timestamp, 'image/png')).toBe(
      'clawdcam-20260907-060504.png',
    );
  });

  it('uses the frozen local date across a year boundary', () => {
    const timestamp = new Date(2027, 0, 1, 0, 0, 0).getTime();
    expect(buildPhotoFilename(timestamp, 'image/webp')).toBe(
      'clawdcam-20270101-000000.webp',
    );
  });

  it('rejects invalid timestamps', () => {
    expect(() => buildPhotoFilename(Number.NaN, 'image/jpeg')).toThrow(
      PhotoActionError,
    );
  });

  it('never includes path separators, colons, or control characters', () => {
    const filename = buildPhotoFilename(
      new Date(2026, 6, 29, 16, 5, 9).getTime(),
      'image/jpeg',
    );
    expect(filename).not.toMatch(/[\\/:]/);
    expect(
      [...filename].every((character) => {
        const code = character.charCodeAt(0);
        return code > 0x1f && code !== 0x7f;
      }),
    ).toBe(true);
  });
});

describe('photo File preparation', () => {
  it('builds one File with the original Blob bytes and frozen metadata', async () => {
    const blob = new Blob(['full-size-photo'], { type: 'image/jpeg' });
    const photo = makePhoto({ blob });
    const createFile = vi.fn(browserLikeFactory.createFile);
    const prepared = preparePhoto(photo, {
      supportsFile: () => true,
      createFile,
    });

    expect(prepared.file).not.toBeNull();
    expect(prepared.file?.name).toBe('clawdcam-20260102-030405.jpg');
    expect(prepared.file?.type).toBe('image/jpeg');
    expect(prepared.file?.lastModified).toBe(photo.capturedAt);
    expect(createFile).toHaveBeenCalledTimes(1);
    expect(createFile).toHaveBeenCalledWith(blob, prepared.filename, {
      type: 'image/jpeg',
      lastModified: photo.capturedAt,
    });
    expect(new TextDecoder().decode(await prepared.file?.arrayBuffer())).toBe(
      'full-size-photo',
    );
  });

  it('uses trusted metadata when Blob.type is empty', () => {
    const prepared = preparePhoto(
      makePhoto({
        blob: new Blob(['png-photo']),
        mimeType: 'image/png',
      }),
      browserLikeFactory,
    );
    expect(prepared.mimeType).toBe('image/png');
    expect(prepared.filename).toMatch(/\.png$/);
    expect(prepared.file?.type).toBe('image/png');
  });

  it('fails closed when Blob.type conflicts with metadata', () => {
    expect(() =>
      preparePhoto(
        makePhoto({
          blob: new Blob(['photo'], { type: 'image/png' }),
          mimeType: 'image/jpeg',
        }),
        browserLikeFactory,
      ),
    ).toThrowError(
      expect.objectContaining({
        code: 'mime-mismatch',
      }),
    );
  });

  it('keeps download metadata while degrading when File is unsupported', () => {
    const prepared = preparePhoto(makePhoto(), {
      supportsFile: () => false,
      createFile: vi.fn(),
    });
    expect(prepared.file).toBeNull();
    expect(prepared.fileError?.code).toBe('file-unavailable');
    expect(prepared.filename).toBe('clawdcam-20260102-030405.jpg');
  });

  it('degrades to download when the File constructor throws', () => {
    const prepared = preparePhoto(makePhoto(), {
      supportsFile: () => true,
      createFile: () => {
        throw new Error('File unavailable');
      },
    });
    expect(prepared.file).toBeNull();
    expect(prepared.fileError?.code).toBe('file-unavailable');
  });

  it('uses the capture result original Blob without recomposition', () => {
    const blob = new Blob(['capture'], { type: 'image/jpeg' });
    const result: PhotoCaptureResult = {
      blob,
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
      capturedAt: '2026-07-29T08:00:00.000Z',
      facingMode: 'user',
      mirrored: true,
      overlayAssetId: 'reference-clawd',
      overlayTransform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };
    expect(shareablePhotoFromCaptureResult(result).blob).toBe(blob);
  });

  it('uses a stored record full-size Blob rather than its thumbnail', () => {
    const fullSize = new Blob(['full'], { type: 'image/jpeg' });
    const thumbnail = new Blob(['thumb'], { type: 'image/jpeg' });
    const record: StoredPhotoRecord = {
      id: 'photo-1',
      schemaVersion: 1,
      photoBlob: fullSize,
      thumbnailBlob: thumbnail,
      capturedAt: new Date(2026, 0, 2, 3, 4, 5).getTime(),
      width: 1440,
      height: 1080,
      mimeType: 'image/jpeg',
      facingMode: 'environment',
      mirrored: false,
      overlayAssetId: 'reference-clawd',
      overlayTransform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };
    const shareable = shareablePhotoFromStoredRecord(record);
    expect(shareable.blob).toBe(fullSize);
    expect(shareable.blob).not.toBe(thumbnail);
  });
});

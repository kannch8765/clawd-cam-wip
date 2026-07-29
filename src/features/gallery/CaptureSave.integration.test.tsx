import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptureResult } from '../composition/CaptureResult';
import type { PhotoCaptureResult } from '../composition/compositionTypes';
import { GalleryServicesProvider } from './GalleryRepositoryContext';
import {
  GalleryStorageError,
  type GalleryRepository,
  type StoredPhotoRecord,
} from './galleryTypes';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makeResult(): PhotoCaptureResult {
  return {
    blob: new Blob(['full-size-photo'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    width: 1440,
    height: 1080,
    capturedAt: '2026-07-29T08:00:00.000Z',
    facingMode: 'user',
    mirrored: true,
    overlayAssetId: 'reference-clawd',
    overlayTransform: { x: 0.4, y: 0.6, scale: 1.2, rotation: 15 },
  };
}

function createRepository(
  savePhoto: GalleryRepository['savePhoto'] = vi.fn(async () => undefined),
): GalleryRepository {
  return {
    savePhoto,
    listPhotos: vi.fn(async () => []),
    getPhoto: vi.fn(async () => undefined),
    deletePhoto: vi.fn(async () => undefined),
  };
}

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('capture result gallery save', () => {
  it('shows an explicit Save to gallery action without auto-saving', () => {
    const repository = createRepository();
    render(
      <GalleryServicesProvider services={{ repository }}>
        <CaptureResult result={makeResult()} onRetake={vi.fn()} />
      </GalleryServicesProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Save to gallery' }),
    ).toBeEnabled();
    expect(repository.savePhoto).not.toHaveBeenCalled();
  });

  it('uses the original full-size Blob and frozen metadata exactly once', async () => {
    const result = makeResult();
    const saveRequest = deferred<void>();
    const savePhoto = vi.fn<GalleryRepository['savePhoto']>(
      () => saveRequest.promise,
    );
    const repository = createRepository(savePhoto);
    const thumbnail = new Blob(['thumbnail'], { type: 'image/jpeg' });
    const createThumbnail = vi.fn(async () => thumbnail);

    render(
      <GalleryServicesProvider
        services={{
          repository,
          createThumbnail,
          idFactory: { createId: () => 'photo-stable-id' },
        }}
      >
        <CaptureResult result={result} onRetake={vi.fn()} />
      </GalleryServicesProvider>,
    );

    const saveButton = screen.getByRole('button', { name: 'Save to gallery' });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(savePhoto).toHaveBeenCalledTimes(1);
    });
    expect(createThumbnail).toHaveBeenCalledTimes(1);
    expect(createThumbnail).toHaveBeenCalledWith(result.blob);
    const record = savePhoto.mock.calls[0][0] as StoredPhotoRecord;
    expect(record).toMatchObject({
      id: 'photo-stable-id',
      photoBlob: result.blob,
      thumbnailBlob: thumbnail,
      capturedAt: Date.parse(result.capturedAt),
      width: result.width,
      height: result.height,
      facingMode: 'user',
      mirrored: true,
      overlayAssetId: result.overlayAssetId,
    });
    expect(record.overlayTransform).toEqual(result.overlayTransform);
    expect(record.overlayTransform).not.toBe(result.overlayTransform);

    await act(async () => {
      saveRequest.resolve();
      await saveRequest.promise;
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved to');
    expect(
      screen.getByRole('button', { name: 'Saved to gallery' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Saved to gallery' }));
    expect(savePhoto).toHaveBeenCalledTimes(1);
  });

  it('keeps the capture visible and retries after a write failure', async () => {
    const repository = createRepository(
      vi
        .fn<GalleryRepository['savePhoto']>()
        .mockRejectedValueOnce(
          new GalleryStorageError('write-failed', 'Temporary write failure.'),
        )
        .mockResolvedValueOnce(undefined),
    );
    const createThumbnail = vi.fn(async () => new Blob(['thumbnail']));

    render(
      <GalleryServicesProvider services={{ repository, createThumbnail }}>
        <CaptureResult result={makeResult()} onRetake={vi.fn()} />
      </GalleryServicesProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Temporary write failure.',
    );
    expect(screen.getByText('Clawd composition')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Saved to');
    expect(repository.savePhoto).toHaveBeenCalledTimes(2);
    expect(createThumbnail).toHaveBeenCalledTimes(2);
  });

  it('shows a clear quota message and does not claim success', async () => {
    const repository = createRepository(
      vi.fn(async () => {
        throw new GalleryStorageError('quota-exceeded', 'Quota exceeded.');
      }),
    );

    render(
      <GalleryServicesProvider
        services={{
          repository,
          createThumbnail: vi.fn(async () => new Blob(['thumbnail'])),
        }}
      >
        <CaptureResult result={makeResult()} onRetake={vi.fn()} />
      </GalleryServicesProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'does not have enough browser storage',
    );
    expect(screen.queryByText('Saved to the local gallery.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry save' })).toBeEnabled();
  });

  it('does not write a partial record when thumbnail creation fails', async () => {
    const repository = createRepository();
    const createThumbnail = vi.fn(async () => {
      throw new GalleryStorageError(
        'thumbnail-failed',
        'Thumbnail generation failed.',
      );
    });

    render(
      <GalleryServicesProvider services={{ repository, createThumbnail }}>
        <CaptureResult result={makeResult()} onRetake={vi.fn()} />
      </GalleryServicesProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Thumbnail generation failed.',
    );
    expect(repository.savePhoto).not.toHaveBeenCalled();
  });

  it('retakes without deleting a successfully stored record', async () => {
    const records: StoredPhotoRecord[] = [];
    const repository = createRepository(
      vi.fn(async (record) => {
        records.push(record);
      }),
    );
    const onRetake = vi.fn();

    render(
      <GalleryServicesProvider
        services={{
          repository,
          createThumbnail: vi.fn(async () => new Blob(['thumbnail'])),
        }}
      >
        <CaptureResult result={makeResult()} onRetake={onRetake} />
      </GalleryServicesProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));
    await waitFor(() => expect(records).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));

    expect(onRetake).toHaveBeenCalledTimes(1);
    expect(repository.deletePhoto).not.toHaveBeenCalled();
    expect(records).toHaveLength(1);
  });

  it('does not update UI after unmount while persistence is pending', async () => {
    const request = deferred<void>();
    const repository = createRepository(vi.fn(() => request.promise));
    const view = render(
      <GalleryServicesProvider
        services={{
          repository,
          createThumbnail: vi.fn(async () => new Blob(['thumbnail'])),
        }}
      >
        <CaptureResult result={makeResult()} onRetake={vi.fn()} />
      </GalleryServicesProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));
    view.unmount();

    await act(async () => {
      request.resolve();
      await request.promise;
    });
    expect(repository.savePhoto).toHaveBeenCalledTimes(1);
  });
});

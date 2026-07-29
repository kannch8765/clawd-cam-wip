import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { GalleryView } from './GalleryView';
import {
  GalleryStorageError,
  STORED_PHOTO_SCHEMA_VERSION,
  toStoredPhotoSummary,
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

function makeRecord(id: string, capturedAt: number): StoredPhotoRecord {
  return {
    id,
    schemaVersion: STORED_PHOTO_SCHEMA_VERSION,
    photoBlob: new Blob([`photo-${id}`], { type: 'image/jpeg' }),
    thumbnailBlob: new Blob([`thumbnail-${id}`], { type: 'image/jpeg' }),
    capturedAt,
    width: 1200,
    height: 900,
    mimeType: 'image/jpeg',
    facingMode: id === 'front' ? 'user' : 'environment',
    mirrored: id === 'front',
    overlayAssetId: 'reference-clawd',
    overlayTransform: { x: 0.5, y: 0.52, scale: 1, rotation: 0 },
  };
}

function createRepository(
  overrides: Partial<GalleryRepository> = {},
): GalleryRepository {
  return {
    savePhoto: vi.fn(async () => undefined),
    listPhotos: vi.fn(async () => []),
    getPhoto: vi.fn(async () => undefined),
    deletePhoto: vi.fn(async () => undefined),
    ...overrides,
  };
}

const createObjectURL = vi.fn<(blob: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

beforeEach(() => {
  let nextUrl = 0;
  createObjectURL
    .mockReset()
    .mockImplementation(() => `blob:gallery-${++nextUrl}`);
  revokeObjectURL.mockReset().mockImplementation(() => undefined);
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURL,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GalleryView list states', () => {
  it('shows loading and then the empty gallery action', async () => {
    const request = deferred<ReturnType<typeof toStoredPhotoSummary>[]>();
    const repository = createRepository({
      listPhotos: vi.fn(() => request.promise),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');

    await act(async () => {
      request.resolve([]);
      await request.promise;
    });

    expect(screen.getByText('No Clawd photos yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open camera' })).toBeEnabled();
  });

  it('shows a storage error and uses a new generation for retry', async () => {
    const repository = createRepository({
      listPhotos: vi
        .fn<GalleryRepository['listPhotos']>()
        .mockRejectedValueOnce(
          new GalleryStorageError('read-failed', 'The gallery is unavailable.'),
        )
        .mockResolvedValueOnce([]),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The gallery is unavailable.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry gallery' }));

    expect(await screen.findByText('No Clawd photos yet')).toBeInTheDocument();
    expect(repository.listPhotos).toHaveBeenCalledTimes(2);
  });

  it('prevents an older overlapping list request from replacing the newer one', async () => {
    const first = deferred<ReturnType<typeof toStoredPhotoSummary>[]>();
    const second = deferred<ReturnType<typeof toStoredPhotoSummary>[]>();
    const newest = makeRecord('newest', 300);
    const repository = createRepository({
      listPhotos: vi
        .fn<GalleryRepository['listPhotos']>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));

    await act(async () => {
      second.resolve([toStoredPhotoSummary(newest)]);
      await second.promise;
    });
    expect(
      screen.getByAltText('Saved Clawd photo thumbnail'),
    ).toBeInTheDocument();

    await act(async () => {
      first.resolve([]);
      await first.promise;
    });
    expect(
      screen.getByAltText('Saved Clawd photo thumbnail'),
    ).toBeInTheDocument();
  });

  it('renders a defensive label for an injected invalid summary timestamp', async () => {
    const summary = toStoredPhotoSummary(makeRecord('invalid-summary', 100));
    summary.capturedAt = Number.MAX_VALUE;
    const repository = createRepository({
      listPhotos: vi.fn(async () => [summary]),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    const label = await screen.findByText('Unknown capture time');

    expect(label.closest('time')).not.toHaveAttribute('datetime');
  });

  it('renders repository order and creates URLs only for thumbnail Blobs', async () => {
    const newer = makeRecord('newer', 300);
    const older = makeRecord('older', 100);
    const repository = createRepository({
      listPhotos: vi.fn(async () => [
        toStoredPhotoSummary(newer),
        toStoredPhotoSummary(older),
      ]),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    const images = await screen.findAllByAltText('Saved Clawd photo thumbnail');

    expect(images).toHaveLength(2);
    expect(createObjectURL).toHaveBeenNthCalledWith(1, newer.thumbnailBlob);
    expect(createObjectURL).toHaveBeenNthCalledWith(2, older.thumbnailBlob);
    expect(
      createObjectURL.mock.calls.some(([blob]) => blob === newer.photoBlob),
    ).toBe(false);
  });
});

describe('GalleryView detail and deletion', () => {
  it('loads the full-size Blob only after opening detail', async () => {
    const photo = makeRecord('front', 300);
    const repository = createRepository({
      listPhotos: vi.fn(async () => [toStoredPhotoSummary(photo)]),
      getPhoto: vi.fn(async () => photo),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));

    expect(
      await screen.findByAltText('Saved Clawd composition'),
    ).toHaveAttribute('src', 'blob:gallery-2');
    expect(repository.getPhoto).toHaveBeenCalledWith('front');
    expect(screen.getByText('Front', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('1200 × 900')).toBeInTheDocument();
  });

  it('renders a defensive label for an injected invalid detail timestamp', async () => {
    const photo = makeRecord('invalid-detail', Number.MAX_VALUE);
    const repository = createRepository({
      listPhotos: vi.fn(async () => [toStoredPhotoSummary(photo)]),
      getPhoto: vi.fn(async () => photo),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));

    const label = await screen.findByText('Unknown capture time');
    expect(label.closest('time')).not.toHaveAttribute('datetime');
    expect(screen.getByAltText('Saved Clawd composition')).toBeInTheDocument();
  });

  it('requires confirmation, coalesces repeated delete clicks, and refreshes list', async () => {
    const photo = makeRecord('delete-me', 300);
    const deletion = deferred<void>();
    const repository = createRepository({
      listPhotos: vi
        .fn<GalleryRepository['listPhotos']>()
        .mockResolvedValueOnce([toStoredPhotoSummary(photo)])
        .mockResolvedValueOnce([]),
      getPhoto: vi.fn(async () => photo),
      deletePhoto: vi.fn(() => deletion.promise),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));
    await screen.findByAltText('Saved Clawd composition');
    const deleteButton = screen.getByRole('button', { name: 'Delete photo' });
    fireEvent.click(deleteButton);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(repository.deletePhoto).toHaveBeenCalledTimes(1);

    await act(async () => {
      deletion.resolve();
      await deletion.promise;
    });
    expect(await screen.findByText('No Clawd photos yet')).toBeInTheDocument();
    expect(repository.listPhotos).toHaveBeenCalledTimes(2);
  });

  it('does not let a late deletion close a different selected photo', async () => {
    const deletingPhoto = makeRecord('delete-a', 300);
    const nextPhoto = makeRecord('front', 200);
    const deletion = deferred<void>();
    const repository = createRepository({
      listPhotos: vi
        .fn<GalleryRepository['listPhotos']>()
        .mockResolvedValueOnce([
          toStoredPhotoSummary(deletingPhoto),
          toStoredPhotoSummary(nextPhoto),
        ])
        .mockResolvedValueOnce([toStoredPhotoSummary(nextPhoto)]),
      getPhoto: vi.fn(async (id) =>
        id === deletingPhoto.id ? deletingPhoto : nextPhoto,
      ),
      deletePhoto: vi.fn(() => deletion.promise),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    const initialTiles = await screen.findAllByRole('button', {
      name: /Saved Clawd/,
    });
    fireEvent.click(initialTiles[0]);
    await screen.findByAltText('Saved Clawd composition');
    fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to gallery' }));

    const currentTiles = await screen.findAllByRole('button', {
      name: /Saved Clawd/,
    });
    fireEvent.click(currentTiles[1]);
    expect(
      await screen.findByText('Front', { selector: 'dd' }),
    ).toBeInTheDocument();

    await act(async () => {
      deletion.resolve();
      await deletion.promise;
    });
    await waitFor(() => expect(repository.listPhotos).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Front', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByAltText('Saved Clawd composition')).toBeInTheDocument();
  });

  it('keeps detail visible and allows retry after delete failure', async () => {
    const photo = makeRecord('keep-me', 300);
    const repository = createRepository({
      listPhotos: vi.fn(async () => [toStoredPhotoSummary(photo)]),
      getPhoto: vi.fn(async () => photo),
      deletePhoto: vi
        .fn<GalleryRepository['deletePhoto']>()
        .mockRejectedValueOnce(
          new GalleryStorageError('delete-failed', 'Delete failed.'),
        )
        .mockResolvedValueOnce(undefined),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));
    await screen.findByAltText('Saved Clawd composition');
    fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Delete failed.',
    );
    expect(screen.getByAltText('Saved Clawd composition')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }));
    await waitFor(() =>
      expect(repository.deletePhoto).toHaveBeenCalledTimes(2),
    );
  });

  it('ignores a late detail result after returning to the gallery', async () => {
    const photo = makeRecord('late', 300);
    const detail = deferred<StoredPhotoRecord | undefined>();
    const repository = createRepository({
      listPhotos: vi.fn(async () => [toStoredPhotoSummary(photo)]),
      getPhoto: vi.fn(() => detail.promise),
    });

    render(<GalleryView repository={repository} onBackToCamera={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to gallery' }));

    await act(async () => {
      detail.resolve(photo);
      await detail.promise;
    });
    expect(
      screen.queryByAltText('Saved Clawd composition'),
    ).not.toBeInTheDocument();
  });

  it('revokes thumbnail and detail object URLs on view exit', async () => {
    const photo = makeRecord('urls', 300);
    const repository = createRepository({
      listPhotos: vi.fn(async () => [toStoredPhotoSummary(photo)]),
      getPhoto: vi.fn(async () => photo),
    });

    const view = render(
      <GalleryView repository={repository} onBackToCamera={vi.fn()} />,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));
    await screen.findByAltText('Saved Clawd composition');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:gallery-1');

    fireEvent.click(screen.getByRole('button', { name: 'Back to gallery' }));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:gallery-2');
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:gallery-3');
  });
});

describe('gallery availability isolation', () => {
  it('keeps Camera available when IndexedDB gallery loading fails', async () => {
    const repository = createRepository({
      listPhotos: vi.fn(async () => {
        throw new GalleryStorageError(
          'unsupported',
          'This browser does not support the local ClawdCam gallery.',
        );
      }),
    });

    render(<App galleryServices={{ repository }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'does not support',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(screen.getByText('Camera workspace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start camera' })).toBeEnabled();
  });
});

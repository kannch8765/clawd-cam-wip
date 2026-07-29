import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GalleryView } from './GalleryView';
import type {
  GalleryRepository,
  StoredPhotoRecord,
  StoredPhotoSummary,
} from './galleryTypes';

const capturedAt = Date.UTC(2026, 6, 29, 12, 0, 0);
const thumbnailBlob = new Blob(['thumbnail'], { type: 'image/jpeg' });
const photoBlob = new Blob(['photo'], { type: 'image/jpeg' });

const summary: StoredPhotoSummary = {
  id: 'photo-a',
  schemaVersion: 1,
  thumbnailBlob,
  capturedAt,
  width: 1200,
  height: 900,
  mimeType: 'image/jpeg',
  facingMode: 'environment',
  mirrored: false,
  overlayAssetId: 'reference-clawd-base-v1',
};

const record: StoredPhotoRecord = {
  ...summary,
  photoBlob,
  overlayTransform: {
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
  },
};

describe('Gallery accessibility flow', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    let nextUrl = 0;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:gallery-a11y-${++nextUrl}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
    vi.restoreAllMocks();
  });

  it('focuses detail, returns focus to the tile, and focuses the gallery after delete', async () => {
    const repository: GalleryRepository = {
      savePhoto: vi.fn(async () => undefined),
      listPhotos: vi
        .fn<GalleryRepository['listPhotos']>()
        .mockResolvedValueOnce([summary])
        .mockResolvedValue([]),
      getPhoto: vi.fn(async () => record),
      deletePhoto: vi.fn(async () => undefined),
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <GalleryView repository={repository} onBackToCamera={() => undefined} />,
    );

    const tile = await screen.findByRole('button', {
      name: /Saved Clawd photo thumbnail/i,
    });
    fireEvent.click(tile);

    const detailHeading = await screen.findByRole('heading', {
      name: 'Saved Clawd photo',
    });
    await waitFor(() => expect(detailHeading).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Back to gallery' }));

    const returnedTile = await screen.findByRole('button', {
      name: /Saved Clawd photo thumbnail/i,
    });
    await waitFor(() => expect(returnedTile).toHaveFocus());

    fireEvent.click(returnedTile);
    await screen.findByRole('heading', { name: 'Saved Clawd photo' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete this Clawd photo from this device?',
    );
    await waitFor(() =>
      expect(repository.deletePhoto).toHaveBeenCalledWith('photo-a'),
    );

    const galleryHeading = await screen.findByRole('heading', {
      name: 'Local gallery',
    });
    await waitFor(() => expect(galleryHeading).toHaveFocus());
    expect(
      screen.queryByRole('button', {
        name: /Saved Clawd photo thumbnail/i,
      }),
    ).not.toBeInTheDocument();
  });
});

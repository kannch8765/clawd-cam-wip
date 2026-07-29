import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CameraView } from '../camera/CameraView';
import type { CameraAdapter } from '../camera/cameraTypes';
import type { CompositionAdapter } from '../composition/compositionTypes';
import { GalleryServicesProvider } from '../gallery/GalleryRepositoryContext';
import { GalleryView } from '../gallery/GalleryView';
import type {
  GalleryRepository,
  StoredPhotoRecord,
} from '../gallery/galleryTypes';
import { toStoredPhotoSummary } from '../gallery/galleryTypes';
import type { SharingAdapter } from './sharingAdapter';
import { SharingServicesProvider } from './SharingServicesContext';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

class TestTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

function createCameraAdapter(): CameraAdapter {
  const track = new TestTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as unknown as MediaStream;
  return {
    requestStream: vi.fn(async () => stream),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'group', label: 'Rear camera' },
    ]),
    stopStream: vi.fn(() => track.stop()),
    waitForVideoReady: vi.fn(async (video) => {
      Object.defineProperties(video, {
        videoWidth: { configurable: true, value: 1280 },
        videoHeight: { configurable: true, value: 720 },
      });
      return { width: 1280, height: 720 };
    }),
  };
}

function createCompositionAdapter(photoBlob: Blob): CompositionAdapter {
  const context = {
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  return {
    loadImage: vi.fn(async () => ({}) as CanvasImageSource),
    createCanvas: vi.fn(() => ({
      canvas: document.createElement('canvas'),
      context,
    })),
    canvasToBlob: vi.fn(async () => photoBlob),
    createObjectURL: vi.fn(() => 'blob:capture-display'),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date(2026, 6, 29, 8, 9, 10)),
  };
}

function createSharingAdapter(
  overrides: Partial<SharingAdapter> = {},
): SharingAdapter {
  return {
    supportsFile: () => true,
    createFile: (blob, filename, options) =>
      new File([blob], filename, options),
    hasShare: () => true,
    hasCanShare: () => true,
    canShareFile: () => true,
    shareFile: vi.fn(async () => undefined),
    downloadBlob: vi.fn(),
    ...overrides,
  };
}

function createRepository(record?: StoredPhotoRecord): GalleryRepository {
  const records = new Map<string, StoredPhotoRecord>();
  if (record) {
    records.set(record.id, record);
  }
  return {
    savePhoto: vi.fn(async (nextRecord) => {
      records.set(nextRecord.id, nextRecord);
    }),
    listPhotos: vi.fn(async () =>
      [...records.values()].map(toStoredPhotoSummary),
    ),
    getPhoto: vi.fn(async (id) => records.get(id)),
    deletePhoto: vi.fn(async (id) => {
      records.delete(id);
    }),
  };
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) =>
      blob.size < 10 ? 'blob:thumbnail-display' : 'blob:full-display',
    ),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('capture result sharing integration', () => {
  it('captures once, then shares, downloads, and independently saves the original Blob', async () => {
    const photoBlob = new Blob(['full-size-capture'], { type: 'image/jpeg' });
    const cameraAdapter = createCameraAdapter();
    const compositionAdapter = createCompositionAdapter(photoBlob);
    const repository = createRepository();
    const createFile = vi.fn(
      (blob: Blob, filename: string, options: FilePropertyBag) =>
        new File([blob], filename, options),
    );
    const shareFile = vi.fn(async (file: File) => {
      void file;
    });
    const downloadBlob = vi.fn();
    const sharingAdapter = createSharingAdapter({
      createFile,
      shareFile,
      downloadBlob,
    });

    render(
      <GalleryServicesProvider
        services={{
          repository,
          createThumbnail: vi.fn(
            async () => new Blob(['thumb'], { type: 'image/jpeg' }),
          ),
          idFactory: { createId: () => 'shared-capture' },
        }}
      >
        <SharingServicesProvider adapter={sharingAdapter}>
          <CameraView
            adapter={cameraAdapter}
            compositionAdapter={compositionAdapter}
          />
        </SharingServicesProvider>
      </GalleryServicesProvider>,
    );

    const stage = screen.getByTestId('camera-stage');
    Object.defineProperties(stage, {
      clientWidth: { configurable: true, value: 360 },
      clientHeight: { configurable: true, value: 480 },
    });
    fireEvent(window, new Event('resize'));
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await screen.findByAltText('Captured Clawd composition');

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await screen.findByText('Share sheet closed.');
    const sharedFile = shareFile.mock.calls[0][0];
    expect(createFile).toHaveBeenCalledWith(
      photoBlob,
      'clawdcam-20260729-080910.jpg',
      {
        type: 'image/jpeg',
        lastModified: new Date(2026, 6, 29, 8, 9, 10).getTime(),
      },
    );
    expect(sharedFile.name).toBe('clawdcam-20260729-080910.jpg');
    expect(sharedFile.size).toBe(photoBlob.size);

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloadBlob).toHaveBeenCalledWith(
      photoBlob,
      'clawdcam-20260729-080910.jpg',
    );
    expect(repository.savePhoto).not.toHaveBeenCalled();
    expect(compositionAdapter.canvasToBlob).toHaveBeenCalledTimes(1);
    expect(compositionAdapter.revokeObjectURL).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));
    await screen.findByText('Saved to the local gallery.');
    expect(repository.savePhoto).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });
});

describe('gallery detail sharing integration', () => {
  it('shares and downloads the full record Blob while protecting Delete', async () => {
    const request = deferred<void>();
    const fullSize = new Blob(['full-size-gallery'], { type: 'image/jpeg' });
    const thumbnail = new Blob(['tiny'], { type: 'image/jpeg' });
    const capturedAt = new Date(2026, 6, 29, 8, 9, 10).getTime();
    const record: StoredPhotoRecord = {
      id: 'gallery-photo',
      schemaVersion: 1,
      photoBlob: fullSize,
      thumbnailBlob: thumbnail,
      capturedAt,
      width: 1440,
      height: 1080,
      mimeType: 'image/jpeg',
      facingMode: 'environment',
      mirrored: false,
      overlayAssetId: 'reference-clawd',
      overlayTransform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };
    const repository = createRepository(record);
    const createFile = vi.fn(
      (blob: Blob, filename: string, options: FilePropertyBag) =>
        new File([blob], filename, options),
    );
    const shareFile = vi.fn((file: File) => {
      void file;
      return request.promise;
    });
    const downloadBlob = vi.fn();
    const sharingAdapter = createSharingAdapter({
      createFile,
      shareFile,
      downloadBlob,
    });

    render(
      <SharingServicesProvider adapter={sharingAdapter}>
        <GalleryView repository={repository} onBackToCamera={vi.fn()} />
      </SharingServicesProvider>,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Saved Clawd photo thumbnail/,
      }),
    );
    await screen.findByAltText('Saved Clawd composition');
    const revokesBeforeActions = vi.mocked(URL.revokeObjectURL).mock.calls
      .length;

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByRole('button', { name: 'Delete photo' })).toBeDisabled();
    expect(createFile).toHaveBeenCalledWith(
      fullSize,
      'clawdcam-20260729-080910.jpg',
      { type: 'image/jpeg', lastModified: capturedAt },
    );
    expect(createFile.mock.calls[0][0]).toBe(fullSize);
    expect(createFile.mock.calls[0][0]).not.toBe(thumbnail);

    await act(async () => {
      request.resolve();
      await request.promise;
    });
    expect(screen.getByRole('button', { name: 'Delete photo' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloadBlob).toHaveBeenCalledWith(
      fullSize,
      'clawdcam-20260729-080910.jpg',
    );
    expect(downloadBlob.mock.calls[0][0]).toBe(fullSize);
    expect(downloadBlob.mock.calls[0][0]).not.toBe(thumbnail);
    expect(repository.getPhoto).toHaveBeenCalledWith('gallery-photo');
    expect(repository.savePhoto).not.toHaveBeenCalled();
    expect(repository.deletePhoto).not.toHaveBeenCalled();
    expect(vi.mocked(URL.revokeObjectURL).mock.calls.length).toBe(
      revokesBeforeActions,
    );
  });
});

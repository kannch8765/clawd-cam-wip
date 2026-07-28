import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CameraView } from '../camera/CameraView';
import type { CameraAdapter } from '../camera/cameraTypes';
import type { CompositionAdapter } from '../composition/compositionTypes';
import { GalleryServicesProvider } from './GalleryRepositoryContext';
import { GalleryView } from './GalleryView';
import type {
  GalleryRepository,
  StoredPhotoRecord,
  StoredPhotoSummary,
} from './galleryTypes';
import { toStoredPhotoSummary } from './galleryTypes';

class TestTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

function createCameraAdapter() {
  const track = new TestTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as unknown as MediaStream;
  const adapter: CameraAdapter = {
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
  return { adapter, track };
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
    createObjectURL: vi.fn(() => 'blob:capture-result'),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date('2026-07-29T08:00:00.000Z')),
  };
}

function createMemoryRepository() {
  const records = new Map<string, StoredPhotoRecord>();
  const repository: GalleryRepository = {
    savePhoto: vi.fn(async (record) => {
      records.set(record.id, record);
    }),
    listPhotos: vi.fn(async (): Promise<StoredPhotoSummary[]> =>
      [...records.values()]
        .map(toStoredPhotoSummary)
        .sort((left, right) => right.capturedAt - left.capturedAt),
    ),
    getPhoto: vi.fn(async (id) => records.get(id)),
    deletePhoto: vi.fn(async (id) => {
      records.delete(id);
    }),
  };
  return { repository, records };
}

function FlowHarness({
  cameraAdapter,
  compositionAdapter,
  repository,
}: {
  cameraAdapter: CameraAdapter;
  compositionAdapter: CompositionAdapter;
  repository: GalleryRepository;
}) {
  const [view, setView] = useState<'camera' | 'gallery'>('camera');
  return (
    <GalleryServicesProvider
      services={{
        repository,
        createThumbnail: vi.fn(
          async () => new Blob(['thumbnail'], { type: 'image/jpeg' }),
        ),
        idFactory: { createId: () => 'flow-photo' },
      }}
    >
      <button type="button" onClick={() => setView('camera')}>
        Flow camera
      </button>
      <button type="button" onClick={() => setView('gallery')}>
        Flow gallery
      </button>
      <div hidden={view !== 'camera'}>
        <CameraView
          adapter={cameraAdapter}
          compositionAdapter={compositionAdapter}
        />
      </div>
      {view === 'gallery' && (
        <GalleryView
          repository={repository}
          onBackToCamera={() => setView('camera')}
        />
      )}
    </GalleryServicesProvider>
  );
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  let nextUrl = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => `blob:gallery-flow-${++nextUrl}`),
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

describe('CameraView to local gallery integration', () => {
  it('captures, saves, reloads, opens detail, and deletes one photo', async () => {
    const { adapter: cameraAdapter } = createCameraAdapter();
    const photoBlob = new Blob(['composed-photo'], { type: 'image/jpeg' });
    const compositionAdapter = createCompositionAdapter(photoBlob);
    const { repository, records } = createMemoryRepository();

    render(
      <FlowHarness
        cameraAdapter={cameraAdapter}
        compositionAdapter={compositionAdapter}
        repository={repository}
      />,
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
    fireEvent.click(screen.getByRole('button', { name: 'Save to gallery' }));
    await screen.findByText('Saved to the local gallery.');

    expect(records.size).toBe(1);
    expect(records.get('flow-photo')?.photoBlob).toBe(photoBlob);
    expect(cameraAdapter.requestStream).toHaveBeenCalledTimes(1);
    expect(compositionAdapter.canvasToBlob).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Flow gallery' }));
    fireEvent.click(await screen.findByRole('button', { name: /Saved Clawd/ }));
    expect(
      await screen.findByAltText('Saved Clawd composition'),
    ).toBeInTheDocument();
    expect(repository.getPhoto).toHaveBeenCalledWith('flow-photo');

    fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }));
    expect(await screen.findByText('No Clawd photos yet')).toBeInTheDocument();
    expect(records.size).toBe(0);
    expect(repository.deletePhoto).toHaveBeenCalledWith('flow-photo');
    expect(cameraAdapter.requestStream).toHaveBeenCalledTimes(1);
    expect(compositionAdapter.canvasToBlob).toHaveBeenCalledTimes(1);
  });
});

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { App } from './App';
import type { CameraAdapter } from '../features/camera/cameraTypes';
import type { GalleryRepository } from '../features/gallery/galleryTypes';

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  enabled = true;
  muted = false;
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

function createStream() {
  const track = new FakeTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
  return { stream, track };
}

function createRepository(): GalleryRepository {
  return {
    savePhoto: vi.fn(async () => undefined),
    listPhotos: vi.fn(async () => []),
    getPhoto: vi.fn(async () => undefined),
    deletePhoto: vi.fn(async () => undefined),
  };
}

function createAdapter(
  requestStream: CameraAdapter['requestStream'],
): CameraAdapter {
  return {
    requestStream,
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
    ]),
    stopStream: vi.fn((stream) => {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }),
    waitForVideoReady: vi.fn(async (video) => {
      Object.defineProperty(video, 'videoWidth', {
        configurable: true,
        value: 1920,
      });
      Object.defineProperty(video, 'videoHeight', {
        configurable: true,
        value: 1080,
      });
      return { width: 1920, height: 1080 };
    }),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('0.1.0 camera view lifecycle', () => {
  it('stops a ready stream when Camera is replaced by Gallery and returns camera-off', async () => {
    const first = createStream();
    const second = createStream();
    const requestStream = vi
      .fn<CameraAdapter['requestStream']>()
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream);
    const adapter = createAdapter(requestStream);

    render(
      <App
        cameraAdapter={adapter}
        galleryServices={{ repository: createRepository() }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    const oldPreview = screen.getByLabelText(
      'Live camera preview',
    ) as HTMLVideoElement;

    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
    await screen.findByRole('heading', { name: 'Local gallery' });

    expect(first.track.stop).toHaveBeenCalledTimes(1);
    expect(adapter.stopStream).toHaveBeenCalledTimes(1);
    expect(oldPreview.srcObject).toBeNull();
    expect(screen.queryByTestId('camera-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(
      screen.getByText('Camera off', { selector: '.status-pill' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start camera' })).toBeEnabled();
    expect(requestStream).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    expect(requestStream).toHaveBeenCalledTimes(2);
    expect(second.track.stop).not.toHaveBeenCalled();
  });

  it('releases a stream that resolves after Camera was replaced by Gallery', async () => {
    const pending = deferred<MediaStream>();
    const late = createStream();
    const adapter = createAdapter(vi.fn(() => pending.promise));

    render(
      <App
        cameraAdapter={adapter}
        galleryServices={{ repository: createRepository() }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    expect(screen.getByText('Opening camera…')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
    await screen.findByRole('heading', { name: 'Local gallery' });

    await act(async () => {
      pending.resolve(late.stream);
      await pending.promise;
    });

    await waitFor(() => expect(late.track.stop).toHaveBeenCalledTimes(1));
    expect(adapter.stopStream).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('camera-view')).not.toBeInTheDocument();
  });
});

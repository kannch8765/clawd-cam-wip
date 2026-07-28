import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, afterEach, vi } from 'vitest';
import { CameraView } from './CameraView';
import {
  CameraError,
  type CameraAdapter,
  type CameraFacingMode,
} from './cameraTypes';
import { useCamera } from './useCamera';

class FakeTrack extends EventTarget {
  stop = vi.fn();
}

function createStream(track = new FakeTrack()): {
  stream: MediaStream;
  track: FakeTrack;
} {
  return {
    track,
    stream: {
      getTracks: () => [track as unknown as MediaStreamTrack],
    } as MediaStream,
  };
}

function createAdapter(
  stream: MediaStream,
  overrides: Partial<CameraAdapter> = {},
): CameraAdapter {
  return {
    requestStream: vi.fn(async () => stream),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
      { deviceId: 'front', groupId: 'phone', label: 'Front camera' },
    ]),
    stopStream: vi.fn((activeStream) => {
      for (const track of activeStream.getTracks()) {
        track.stop();
      }
    }),
    waitForVideoReady: vi.fn(async () => ({ width: 1280, height: 720 })),
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function CameraHarness({ adapter }: { adapter: CameraAdapter }) {
  const { state, videoRef, startCamera } = useCamera(adapter);

  return (
    <>
      <video ref={videoRef} data-testid="harness-preview" />
      <button type="button" onClick={() => void startCamera('environment')}>
        Request rear
      </button>
      <button type="button" onClick={() => void startCamera('user')}>
        Request front
      </button>
      <output>{state.status}</output>
      <output>{state.facingMode}</output>
    </>
  );
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CameraView', () => {
  it('requests the rear camera and enters ready after video readiness', async () => {
    const { stream } = createStream();
    const adapter = createAdapter(stream);

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));

    expect(await screen.findByText('Rear camera ready')).toBeInTheDocument();
    expect(adapter.requestStream).toHaveBeenCalledWith('environment');
    expect(adapter.waitForVideoReady).toHaveBeenCalledTimes(1);
    const preview = screen.getByLabelText(
      'Live camera preview',
    ) as HTMLVideoElement;
    expect(preview.srcObject).toBe(stream);
  });

  it('shows a permission-denied state', async () => {
    const { stream } = createStream();
    const adapter = createAdapter(stream, {
      requestStream: vi.fn(async () => {
        throw new CameraError(
          'permission-denied',
          'Camera permission was denied.',
        );
      }),
    });

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));

    expect(
      await screen.findByText('Permission denied', {
        selector: '.status-pill',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });

  it('shows an unsupported-browser state', async () => {
    const { stream } = createStream();
    const adapter = createAdapter(stream, {
      requestStream: vi.fn(async () => {
        throw new CameraError(
          'unsupported',
          'This browser does not support camera access.',
        );
      }),
    });

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));

    expect(
      await screen.findByText('Camera unsupported', {
        selector: '.status-pill',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
  });

  it('reports unavailable when enumeration returns no video input', async () => {
    const { stream, track } = createStream();
    const adapter = createAdapter(stream, {
      enumerateVideoInputs: vi.fn(async () => []),
    });

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));

    expect(
      await screen.findByText('Camera unavailable', {
        selector: '.status-pill',
      }),
    ).toBeInTheDocument();
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it('stops the old stream before switching cameras', async () => {
    const first = createStream();
    const second = createStream();
    const adapter = createAdapter(first.stream, {
      requestStream: vi
        .fn<(facingMode: CameraFacingMode) => Promise<MediaStream>>()
        .mockResolvedValueOnce(first.stream)
        .mockResolvedValueOnce(second.stream),
    });

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to front camera' }),
    );

    expect(await screen.findByText('Front camera ready')).toBeInTheDocument();
    expect(first.track.stop).toHaveBeenCalledTimes(1);
    expect(adapter.requestStream).toHaveBeenLastCalledWith('user');
  });

  it('stops every active track when unmounted', async () => {
    const firstTrack = new FakeTrack();
    const secondTrack = new FakeTrack();
    const stream = {
      getTracks: () => [
        firstTrack as unknown as MediaStreamTrack,
        secondTrack as unknown as MediaStreamTrack,
      ],
    } as MediaStream;
    const adapter = createAdapter(stream);
    const view = render(<CameraView adapter={adapter} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    view.unmount();

    expect(firstTrack.stop).toHaveBeenCalledTimes(1);
    expect(secondTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('keeps the newest request when an older request resolves later', async () => {
    const oldRequest = deferred<MediaStream>();
    const newRequest = deferred<MediaStream>();
    const oldStream = createStream();
    const newStream = createStream();
    const adapter = createAdapter(newStream.stream, {
      requestStream: vi
        .fn<(facingMode: CameraFacingMode) => Promise<MediaStream>>()
        .mockReturnValueOnce(oldRequest.promise)
        .mockReturnValueOnce(newRequest.promise),
    });

    render(<CameraHarness adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Request rear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Request front' }));

    await act(async () => {
      newRequest.resolve(newStream.stream);
      await newRequest.promise;
    });
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument());

    await act(async () => {
      oldRequest.resolve(oldStream.stream);
      await oldRequest.promise;
    });

    expect(screen.getByText('user')).toBeInTheDocument();
    const preview = screen.getByTestId('harness-preview') as HTMLVideoElement;
    expect(preview.srcObject).toBe(newStream.stream);
    expect(oldStream.track.stop).toHaveBeenCalledTimes(1);
    expect(newStream.track.stop).not.toHaveBeenCalled();
  });

  it('moves to an interrupted state when a track ends', async () => {
    const { stream, track } = createStream();
    const adapter = createAdapter(stream);

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');

    act(() => {
      track.dispatchEvent(new Event('ended'));
    });

    expect(
      await screen.findByText('Camera interrupted', {
        selector: '.status-pill',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Restart camera' }),
    ).toBeInTheDocument();
  });

  it('mirrors a ready front-camera preview', async () => {
    const first = createStream();
    const second = createStream();
    const adapter = createAdapter(first.stream, {
      requestStream: vi
        .fn<(facingMode: CameraFacingMode) => Promise<MediaStream>>()
        .mockResolvedValueOnce(first.stream)
        .mockResolvedValueOnce(second.stream),
    });

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to front camera' }),
    );
    await screen.findByText('Front camera ready');

    const preview = screen.getByLabelText('Live camera preview');
    expect(preview).toHaveClass('camera-preview--mirrored');
    expect(preview).toHaveAttribute('data-mirrored', 'true');
  });

  it('does not mirror a ready rear-camera preview', async () => {
    const { stream } = createStream();
    const adapter = createAdapter(stream);

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');

    const preview = screen.getByLabelText('Live camera preview');
    expect(preview).not.toHaveClass('camera-preview--mirrored');
    expect(preview).toHaveAttribute('data-mirrored', 'false');
  });

  it('retries the same camera after a recoverable error', async () => {
    const { stream } = createStream();
    const requestStream = vi
      .fn<(facingMode: CameraFacingMode) => Promise<MediaStream>>()
      .mockRejectedValueOnce(
        new CameraError('permission-denied', 'Permission denied.'),
      )
      .mockResolvedValueOnce(stream);
    const adapter = createAdapter(stream, { requestStream });

    render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Permission denied', { selector: '.status-pill' });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Rear camera ready')).toBeInTheDocument();
    expect(requestStream).toHaveBeenCalledTimes(2);
    expect(requestStream).toHaveBeenLastCalledWith('environment');
  });
});

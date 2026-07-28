import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { CameraView } from '../camera/CameraView';
import type {
  CameraAdapter,
  CameraCaptureSource,
  CameraFacingMode,
} from '../camera/cameraTypes';
import type { OverlayAssetDescriptor } from '../overlay/overlayTypes';
import { CaptureError, type CompositionAdapter } from './compositionTypes';
import { usePhotoCapture } from './usePhotoCapture';

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
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

function createCameraAdapter(
  streams: MediaStream[],
): CameraAdapter & { requestStream: ReturnType<typeof vi.fn> } {
  let requestIndex = 0;
  return {
    requestStream: vi.fn(async () => {
      const stream = streams[Math.min(requestIndex, streams.length - 1)];
      requestIndex += 1;
      return stream;
    }),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
      { deviceId: 'front', groupId: 'phone', label: 'Front camera' },
    ]),
    stopStream: vi.fn((stream: MediaStream) => {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }),
    waitForVideoReady: vi.fn(async (video: HTMLVideoElement) => {
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

function createCanvasContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function createCompositionAdapter(
  overrides: Partial<CompositionAdapter> = {},
): CompositionAdapter {
  const context = createCanvasContext();
  let objectUrlId = 0;
  return {
    loadImage: vi.fn(
      async () => ({ decoded: true }) as unknown as CanvasImageSource,
    ),
    createCanvas: vi.fn((width, height) => ({
      canvas: { width, height } as HTMLCanvasElement,
      context,
    })),
    canvasToBlob: vi.fn(
      async () => new Blob(['photo'], { type: 'image/jpeg' }),
    ),
    createObjectURL: vi.fn(() => {
      objectUrlId += 1;
      return `blob:photo-${objectUrlId}`;
    }),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date('2026-07-28T13:00:00.000Z')),
    ...overrides,
  };
}

function setStageSize() {
  const stage = screen.getByTestId('camera-stage');
  Object.defineProperty(stage, 'clientWidth', {
    configurable: true,
    value: 390,
  });
  Object.defineProperty(stage, 'clientHeight', {
    configurable: true,
    value: 844,
  });
}

async function startReadyCamera() {
  fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
  await screen.findByText('Rear camera ready');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CameraView capture integration', () => {
  it('shows the shutter only after camera and decoded asset are ready', async () => {
    const camera = createStream();
    const assetDecode = deferred<CanvasImageSource>();
    const compositionAdapter = createCompositionAdapter({
      loadImage: vi.fn(() => assetDecode.promise),
    });

    render(
      <CameraView
        adapter={createCameraAdapter([camera.stream])}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();

    expect(screen.queryByRole('button', { name: 'Take photo' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeDisabled();

    await act(async () => {
      assetDecode.resolve({ decoded: true } as unknown as CanvasImageSource);
      await assetDecode.promise;
    });

    expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled();
  });

  it('captures through CameraView, the hook, and the composition adapter', async () => {
    const camera = createStream();
    const cameraAdapter = createCameraAdapter([camera.stream]);
    const compositionAdapter = createCompositionAdapter();

    render(
      <CameraView
        adapter={cameraAdapter}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));

    const result = await screen.findByAltText('Captured Clawd composition');
    expect(result).toHaveAttribute('src', 'blob:photo-1');
    expect(compositionAdapter.createCanvas).toHaveBeenCalledTimes(1);
    expect(compositionAdapter.canvasToBlob).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Rear', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('reference-clawd-base-v1')).toBeInTheDocument();
  });

  it('starts only one composition for a rapid double click', async () => {
    const camera = createStream();
    const blob = deferred<Blob>();
    const compositionAdapter = createCompositionAdapter({
      canvasToBlob: vi.fn(() => blob.promise),
    });

    render(
      <CameraView
        adapter={createCameraAdapter([camera.stream])}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();
    await startReadyCamera();
    const shutter = screen.getByRole('button', { name: 'Take photo' });

    fireEvent.click(shutter);
    fireEvent.click(shutter);

    expect(compositionAdapter.createCanvas).toHaveBeenCalledTimes(1);
    expect(compositionAdapter.canvasToBlob).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeDisabled();

    await act(async () => {
      blob.resolve(new Blob(['photo'], { type: 'image/jpeg' }));
      await blob.promise;
    });
    await screen.findByAltText('Captured Clawd composition');
  });

  it('Retake returns to the same stream without another permission request', async () => {
    const camera = createStream();
    const cameraAdapter = createCameraAdapter([camera.stream]);
    const compositionAdapter = createCompositionAdapter();

    render(
      <CameraView
        adapter={cameraAdapter}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await screen.findByAltText('Captured Clawd composition');

    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));

    expect(screen.queryByAltText('Captured Clawd composition')).toBeNull();
    expect(screen.getByLabelText('Live camera preview')).toHaveProperty(
      'srcObject',
      camera.stream,
    );
    expect(cameraAdapter.requestStream).toHaveBeenCalledTimes(1);
    expect(compositionAdapter.revokeObjectURL).toHaveBeenCalledWith(
      'blob:photo-1',
    );
  });

  it('revokes each result URL on Retake and unmount', async () => {
    const camera = createStream();
    const compositionAdapter = createCompositionAdapter();
    const view = render(
      <CameraView
        adapter={createCameraAdapter([camera.stream])}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await screen.findByAltText('Captured Clawd composition');
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await screen.findByAltText('Captured Clawd composition');

    view.unmount();

    expect(compositionAdapter.revokeObjectURL).toHaveBeenNthCalledWith(
      1,
      'blob:photo-1',
    );
    expect(compositionAdapter.revokeObjectURL).toHaveBeenNthCalledWith(
      2,
      'blob:photo-2',
    );
  });

  it('keeps a captured result visible after the camera stream is interrupted', async () => {
    const camera = createStream();

    render(
      <CameraView
        adapter={createCameraAdapter([camera.stream])}
        compositionAdapter={createCompositionAdapter()}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await screen.findByAltText('Captured Clawd composition');

    act(() => {
      camera.track.dispatchEvent(new Event('ended'));
    });

    expect(
      screen.getByAltText('Captured Clawd composition'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    expect(
      await screen.findByRole('button', { name: 'Restart camera' }),
    ).toBeInTheDocument();
  });

  it('recovers from a composition error without restarting the camera', async () => {
    const camera = createStream();
    const cameraAdapter = createCameraAdapter([camera.stream]);
    const canvasToBlob = vi
      .fn<CompositionAdapter['canvasToBlob']>()
      .mockRejectedValueOnce(
        new CaptureError(
          'blob-failed',
          'Canvas returned an empty capture Blob.',
        ),
      )
      .mockResolvedValueOnce(new Blob(['photo'], { type: 'image/jpeg' }));
    const compositionAdapter = createCompositionAdapter({ canvasToBlob });

    render(
      <CameraView
        adapter={cameraAdapter}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Canvas returned an empty capture Blob.',
    );
    expect(screen.getByLabelText('Live camera preview')).toHaveProperty(
      'srcObject',
      camera.stream,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));

    await screen.findByAltText('Captured Clawd composition');
    expect(cameraAdapter.requestStream).toHaveBeenCalledTimes(1);
  });

  it('captures from the latest stream identity after switching cameras', async () => {
    const rear = createStream();
    const front = createStream();
    const cameraAdapter = createCameraAdapter([rear.stream, front.stream]);

    render(
      <CameraView
        adapter={cameraAdapter}
        compositionAdapter={createCompositionAdapter()}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to front camera' }),
    );
    await screen.findByText('Front camera ready');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));

    await screen.findByAltText('Captured Clawd composition');
    expect(screen.getByText('Front', { selector: 'dd' })).toBeInTheDocument();
    expect(rear.track.stop).toHaveBeenCalledTimes(1);
  });

  it('does not create an object URL for a late Blob after unmount', async () => {
    const camera = createStream();
    const blob = deferred<Blob>();
    const compositionAdapter = createCompositionAdapter({
      canvasToBlob: vi.fn(() => blob.promise),
    });
    const view = render(
      <CameraView
        adapter={createCameraAdapter([camera.stream])}
        compositionAdapter={compositionAdapter}
      />,
    );
    setStageSize();
    await startReadyCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    view.unmount();

    await act(async () => {
      blob.resolve(new Blob(['late'], { type: 'image/jpeg' }));
      await blob.promise;
    });

    expect(compositionAdapter.createObjectURL).not.toHaveBeenCalled();
  });
});

const FIRST_ASSET: OverlayAssetDescriptor = {
  id: 'first',
  label: 'First',
  previewAssetUrl: '/first.png',
  intrinsicWidth: 100,
  intrinsicHeight: 100,
  aspectRatio: 1,
  anchor: { x: 0.5, y: 0.5 },
  canonicalDisplayWidth: 0.4,
};
const SECOND_ASSET: OverlayAssetDescriptor = {
  ...FIRST_ASSET,
  id: 'second',
  label: 'Second',
  previewAssetUrl: '/second.png',
};

function HookHarness({
  asset,
  adapter,
}: {
  asset: OverlayAssetDescriptor;
  adapter: CompositionAdapter;
}) {
  const stageRef = {
    current: document.createElement('div'),
  };
  const source = {
    requestId: 1,
    stream: { getTracks: () => [] } as unknown as MediaStream,
    video: {} as HTMLVideoElement,
    facingMode: 'environment' as CameraFacingMode,
    dimensions: { width: 1, height: 1 },
  } satisfies CameraCaptureSource;
  const capture = usePhotoCapture({
    asset,
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    stageRef,
    getCameraCaptureSource: () => source,
    isCameraCaptureSourceCurrent: () => true,
    adapter,
  });

  return <output>{capture.state.status}</output>;
}

describe('usePhotoCapture asset session', () => {
  it('ignores a late decode from an obsolete asset session', async () => {
    const firstDecode = deferred<CanvasImageSource>();
    const secondDecode = deferred<CanvasImageSource>();
    const adapter = createCompositionAdapter({
      loadImage: vi
        .fn<CompositionAdapter['loadImage']>()
        .mockReturnValueOnce(firstDecode.promise)
        .mockReturnValueOnce(secondDecode.promise),
    });
    const view = render(<HookHarness asset={FIRST_ASSET} adapter={adapter} />);

    view.rerender(<HookHarness asset={SECOND_ASSET} adapter={adapter} />);
    await act(async () => {
      secondDecode.resolve({ second: true } as unknown as CanvasImageSource);
      await secondDecode.promise;
    });
    expect(screen.getByText('ready')).toBeInTheDocument();

    await act(async () => {
      firstDecode.resolve({ first: true } as unknown as CanvasImageSource);
      await firstDecode.promise;
    });
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(adapter.loadImage).toHaveBeenCalledTimes(2);
  });
});

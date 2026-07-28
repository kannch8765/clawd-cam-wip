import { useRef } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { CameraView } from '../camera/CameraView';
import type { CameraAdapter, CameraCaptureSource } from '../camera/cameraTypes';
import { REFERENCE_CLAWD_ASSET } from '../overlay/overlayAssets';
import { DEFAULT_OVERLAY_TRANSFORM } from '../overlay/overlayTypes';
import { calculateCoverCrop, calculateOutputSize } from './captureGeometry';
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

function createCameraAdapter(stream: MediaStream): CameraAdapter {
  return {
    requestStream: vi.fn(async () => stream),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
    ]),
    stopStream: vi.fn((activeStream: MediaStream) => {
      for (const track of activeStream.getTracks()) {
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

function createCompositionFixture(overrides: Partial<CompositionAdapter> = {}) {
  const drawImage = vi.fn();
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage,
  } as unknown as CanvasRenderingContext2D;
  const createCanvas = vi.fn((width: number, height: number) => ({
    canvas: { width, height } as HTMLCanvasElement,
    context,
  }));
  let objectUrlId = 0;
  const createObjectURL = vi.fn(() => {
    objectUrlId += 1;
    return `blob:photo-${objectUrlId}`;
  });
  const revokeObjectURL = vi.fn();
  const adapter: CompositionAdapter = {
    loadImage: vi.fn(
      async () => ({ decoded: true }) as unknown as CanvasImageSource,
    ),
    createCanvas,
    canvasToBlob: vi.fn(
      async () => new Blob(['photo'], { type: 'image/jpeg' }),
    ),
    createObjectURL,
    revokeObjectURL,
    now: vi.fn(() => new Date('2026-07-29T08:00:00.000Z')),
    ...overrides,
  };

  return {
    adapter,
    createCanvas,
    createObjectURL,
    drawImage,
    revokeObjectURL,
  };
}

function setElementSize(
  element: HTMLElement,
  width: number,
  height: number,
): void {
  Object.defineProperty(element, 'clientWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: height,
  });
}

async function startReadyCamera(): Promise<void> {
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

  return { promise, reject, resolve };
}

function createCaptureSource(): CameraCaptureSource {
  const { stream } = createStream();
  const video = document.createElement('video');
  Object.defineProperty(video, 'srcObject', {
    configurable: true,
    value: stream,
  });
  Object.defineProperty(video, 'videoWidth', {
    configurable: true,
    value: 1920,
  });
  Object.defineProperty(video, 'videoHeight', {
    configurable: true,
    value: 1080,
  });

  return {
    requestId: 1,
    stream,
    video,
    facingMode: 'environment',
    dimensions: { width: 1920, height: 1080 },
  };
}

function CaptureHookHarness({
  adapter,
  source,
}: {
  adapter: CompositionAdapter;
  source: CameraCaptureSource;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const photoCapture = usePhotoCapture({
    asset: REFERENCE_CLAWD_ASSET,
    transform: { ...DEFAULT_OVERLAY_TRANSFORM },
    stageRef,
    getCameraCaptureSource: () => source,
    isCameraCaptureSourceCurrent: (candidate) => candidate === source,
    adapter,
  });

  return (
    <>
      <div ref={stageRef} data-testid="hook-stage" />
      <output data-testid="hook-status">{photoCapture.state.status}</output>
      {photoCapture.state.status === 'captured' && (
        <output data-testid="hook-object-url">
          {photoCapture.state.objectUrl}
        </output>
      )}
      <button type="button" onClick={() => void photoCapture.capture()}>
        Hook capture
      </button>
      <button type="button" onClick={photoCapture.retake}>
        Hook retake
      </button>
    </>
  );
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('capture lifecycle regressions', () => {
  it('recovers after an asset decode failure and retry', async () => {
    const camera = createStream();
    const loadImage = vi
      .fn<CompositionAdapter['loadImage']>()
      .mockRejectedValueOnce(
        new CaptureError(
          'asset-decode-failed',
          'The Clawd capture asset could not be decoded.',
        ),
      )
      .mockResolvedValueOnce({ decoded: true } as unknown as CanvasImageSource);
    const { adapter } = createCompositionFixture({ loadImage });

    render(
      <CameraView
        adapter={createCameraAdapter(camera.stream)}
        compositionAdapter={adapter}
      />,
    );
    setElementSize(screen.getByTestId('camera-stage'), 390, 844);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The Clawd capture asset could not be decoded.',
    );
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry Clawd asset' }));

    await waitFor(() => expect(loadImage).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('revokes the previous object URL when a result is replaced', async () => {
    const source = createCaptureSource();
    const fixture = createCompositionFixture();

    render(<CaptureHookHarness adapter={fixture.adapter} source={source} />);
    setElementSize(screen.getByTestId('hook-stage'), 390, 844);
    await waitFor(() =>
      expect(screen.getByTestId('hook-status')).toHaveTextContent('ready'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hook capture' }));
    expect(await screen.findByTestId('hook-object-url')).toHaveTextContent(
      'blob:photo-1',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hook capture' }));
    await waitFor(() =>
      expect(screen.getByTestId('hook-object-url')).toHaveTextContent(
        'blob:photo-2',
      ),
    );

    expect(fixture.createObjectURL).toHaveBeenCalledTimes(2);
    expect(fixture.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:photo-1');
  });

  it('ignores a late Blob after Retake invalidates the capture session', async () => {
    const source = createCaptureSource();
    const blob = deferred<Blob>();
    const fixture = createCompositionFixture({
      canvasToBlob: vi.fn(() => blob.promise),
    });

    render(<CaptureHookHarness adapter={fixture.adapter} source={source} />);
    setElementSize(screen.getByTestId('hook-stage'), 390, 844);
    await waitFor(() =>
      expect(screen.getByTestId('hook-status')).toHaveTextContent('ready'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hook capture' }));
    await waitFor(() =>
      expect(screen.getByTestId('hook-status')).toHaveTextContent('capturing'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hook retake' }));
    expect(screen.getByTestId('hook-status')).toHaveTextContent('ready');

    await act(async () => {
      blob.resolve(new Blob(['late'], { type: 'image/jpeg' }));
      await blob.promise;
      await Promise.resolve();
    });

    expect(screen.getByTestId('hook-status')).toHaveTextContent('ready');
    expect(screen.queryByTestId('hook-object-url')).toBeNull();
    expect(fixture.createObjectURL).not.toHaveBeenCalled();
  });

  it('keeps the shutter-time crop and output after a preview resize', async () => {
    const camera = createStream();
    const blob = deferred<Blob>();
    const fixture = createCompositionFixture({
      canvasToBlob: vi.fn(() => blob.promise),
    });

    render(
      <CameraView
        adapter={createCameraAdapter(camera.stream)}
        compositionAdapter={fixture.adapter}
      />,
    );
    const stage = screen.getByTestId('camera-stage');
    setElementSize(stage, 390, 844);
    await startReadyCamera();

    const shutterCrop = calculateCoverCrop({
      videoWidth: 1920,
      videoHeight: 1080,
      previewWidth: 390,
      previewHeight: 844,
    });
    const shutterOutput = calculateOutputSize(shutterCrop);
    const resizedOutput = calculateOutputSize(
      calculateCoverCrop({
        videoWidth: 1920,
        videoHeight: 1080,
        previewWidth: 844,
        previewHeight: 390,
      }),
    );
    expect(resizedOutput).not.toEqual(shutterOutput);

    const preview = screen.getByLabelText('Live camera preview');
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await waitFor(() =>
      expect(fixture.adapter.canvasToBlob).toHaveBeenCalledTimes(1),
    );

    expect(fixture.createCanvas).toHaveBeenCalledWith(
      shutterOutput.width,
      shutterOutput.height,
    );
    const cameraDraw = fixture.drawImage.mock.calls[0];
    expect(cameraDraw[0]).toBe(preview);
    expect(cameraDraw[1]).toBeCloseTo(shutterCrop.cropX);
    expect(cameraDraw[2]).toBeCloseTo(shutterCrop.cropY);
    expect(cameraDraw[3]).toBeCloseTo(shutterCrop.visibleSourceWidth);
    expect(cameraDraw[4]).toBeCloseTo(shutterCrop.visibleSourceHeight);
    expect(cameraDraw.slice(5)).toEqual([
      0,
      0,
      shutterOutput.width,
      shutterOutput.height,
    ]);

    act(() => {
      setElementSize(stage, 844, 390);
      window.dispatchEvent(new Event('resize'));
    });

    await act(async () => {
      blob.resolve(new Blob(['photo'], { type: 'image/jpeg' }));
      await blob.promise;
    });

    await screen.findByAltText('Captured Clawd composition');
    expect(
      screen.getByText(`${shutterOutput.width} × ${shutterOutput.height}`, {
        selector: 'dd',
      }),
    ).toBeInTheDocument();
    expect(fixture.createCanvas).toHaveBeenCalledTimes(1);
    expect(fixture.createCanvas).not.toHaveBeenCalledWith(
      resizedOutput.width,
      resizedOutput.height,
    );
  });
});

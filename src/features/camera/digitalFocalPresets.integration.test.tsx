import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import type { CompositionAdapter } from '../composition/compositionTypes';
import { CameraView } from './CameraView';
import type { CameraAdapter } from './cameraTypes';

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

function createStream(): MediaStream {
  const track = new FakeTrack();
  return {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
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
    stopStream: vi.fn(),
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

function createCompositionAdapter(
  canvasToBlob: CompositionAdapter['canvasToBlob'] = vi.fn(
    async () => new Blob(['photo'], { type: 'image/jpeg' }),
  ),
): CompositionAdapter {
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  return {
    loadImage: vi.fn(
      async () => ({ decoded: true }) as unknown as CanvasImageSource,
    ),
    createCanvas: vi.fn((width, height) => ({
      canvas: { width, height } as HTMLCanvasElement,
      context,
    })),
    canvasToBlob,
    createObjectURL: vi.fn(() => 'blob:focal-photo'),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date('2026-08-06T09:00:00.000Z')),
  };
}

function setStageSize(): void {
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

async function startReadyCamera(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
  await screen.findByText('Rear camera ready');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
  );
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

describe('digital focal preset controls', () => {
  it('changes rear preview framing without changing the sticker transform', async () => {
    render(
      <CameraView
        adapter={createCameraAdapter([createStream()])}
        compositionAdapter={createCompositionAdapter()}
      />,
    );
    setStageSize();

    expect(screen.queryByRole('button', { name: '24 eq.' })).toBeNull();
    await startReadyCamera();

    const preview = screen.getByLabelText('Live camera preview');
    const overlay = document.querySelector('.clawd-overlay');
    const overlayStyle = overlay?.getAttribute('style');
    const preset24 = screen.getByRole('button', { name: '24 eq.' });
    const preset50 = screen.getByRole('button', { name: '50 eq.' });

    expect(preset24).toHaveAttribute('aria-pressed', 'true');
    expect(preview).toHaveAttribute('data-focal-preset', '24');
    expect(preview.style.getPropertyValue('--camera-digital-zoom')).toBe('1');
    expect(preview.style.getPropertyValue('--camera-mirror-scale')).toBe('1');

    fireEvent.click(preset50);

    expect(preset24).toHaveAttribute('aria-pressed', 'false');
    expect(preset50).toHaveAttribute('aria-pressed', 'true');
    expect(preview).toHaveAttribute('data-focal-preset', '50');
    expect(preview.style.getPropertyValue('--camera-digital-zoom')).toBe(
      String(50 / 24),
    );
    expect(preview).toHaveAttribute('data-mirrored', 'false');
    expect(overlay?.getAttribute('style')).toBe(overlayStyle);
  });

  it('preserves the selected preset while composing front mirroring', async () => {
    render(
      <CameraView
        adapter={createCameraAdapter([createStream(), createStream()])}
        compositionAdapter={createCompositionAdapter()}
      />,
    );
    setStageSize();
    await startReadyCamera();

    fireEvent.click(screen.getByRole('button', { name: '77 eq.' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to front camera' }),
    );
    await screen.findByText('Front camera ready');

    const preview = screen.getByLabelText('Live camera preview');
    expect(screen.getByRole('button', { name: '77 eq.' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(preview).toHaveAttribute('data-focal-preset', '77');
    expect(preview.style.getPropertyValue('--camera-digital-zoom')).toBe(
      String(77 / 24),
    );
    expect(preview.style.getPropertyValue('--camera-mirror-scale')).toBe('-1');
    expect(preview).toHaveAttribute('data-mirrored', 'true');
  });

  it('locks presets during capture and preserves the selection after Retake', async () => {
    const blob = deferred<Blob>();
    render(
      <CameraView
        adapter={createCameraAdapter([createStream()])}
        compositionAdapter={createCompositionAdapter(vi.fn(() => blob.promise))}
      />,
    );
    setStageSize();
    await startReadyCamera();

    fireEvent.click(screen.getByRole('button', { name: '120 eq.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));

    expect(screen.getByRole('button', { name: '120 eq.' })).toBeDisabled();
    await act(async () => {
      blob.resolve(new Blob(['photo'], { type: 'image/jpeg' }));
      await blob.promise;
    });
    await screen.findByAltText('Captured Clawd composition');

    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));

    expect(screen.getByRole('button', { name: '120 eq.' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Live camera preview')).toHaveAttribute(
      'data-focal-preset',
      '120',
    );
  });
});

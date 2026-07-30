import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompositionAdapter } from '../composition/compositionTypes';
import type { CameraAdapter } from './cameraTypes';
import {
  CameraView,
  expectedStageOrientation,
  geometryIsStable,
} from './CameraView';

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  enabled = true;
  muted = false;
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

function rect(width: number, height: number): DOMRectReadOnly {
  return { width, height } as DOMRectReadOnly;
}

function createCameraAdapter(): CameraAdapter {
  const track = new FakeTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
  return {
    requestStream: vi.fn(async () => stream),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
    ]),
    stopStream: vi.fn((activeStream) =>
      activeStream
        .getTracks()
        .forEach((activeTrack: MediaStreamTrack) => activeTrack.stop()),
    ),
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

function createCompositionAdapter() {
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  const createCanvas = vi.fn((width: number, height: number) => ({
    canvas: { width, height } as HTMLCanvasElement,
    context,
  }));
  let objectUrlId = 0;
  const adapter: CompositionAdapter = {
    loadImage: vi.fn(
      async () => ({ decoded: true }) as unknown as CanvasImageSource,
    ),
    createCanvas,
    canvasToBlob: vi.fn(
      async () => new Blob(['photo'], { type: 'image/jpeg' }),
    ),
    createObjectURL: vi.fn(() => {
      objectUrlId += 1;
      return `blob:orientation-${objectUrlId}`;
    }),
    revokeObjectURL: vi.fn(),
    now: vi.fn(() => new Date('2026-07-30T07:00:00.000Z')),
  };
  return { adapter, createCanvas };
}

let landscape = false;
let frameId = 0;
let pendingFrames = new Map<number, FrameRequestCallback>();

async function flushFrames(): Promise<void> {
  await act(async () => {
    while (pendingFrames.size > 0) {
      const callbacks = [...pendingFrames.values()];
      pendingFrames.clear();
      for (const callback of callbacks) {
        callback(performance.now());
      }
      await Promise.resolve();
    }
  });
}

function setViewport(
  width: number,
  height: number,
  isLandscape: boolean,
): void {
  landscape = isLandscape;
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
}

function installDynamicStageGeometry(stage: HTMLElement) {
  let width = 0;
  let height = 0;
  Object.defineProperty(stage, 'clientWidth', {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(stage, 'clientHeight', {
    configurable: true,
    get: () => height,
  });
  vi.spyOn(stage, 'getBoundingClientRect').mockImplementation(() =>
    rect(width, height),
  );
  return (nextWidth: number, nextHeight: number) => {
    width = nextWidth;
    height = nextHeight;
  };
}

beforeEach(() => {
  landscape = false;
  frameId = 0;
  pendingFrames = new Map();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches:
        query === '(pointer: coarse)' ||
        (query === '(orientation: landscape)' && landscape),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: vi.fn((callback: FrameRequestCallback) => {
      frameId += 1;
      pendingFrames.set(frameId, callback);
      return frameId;
    }),
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value: vi.fn((id: number) => {
      pendingFrames.delete(id);
    }),
  });
  setViewport(390, 844, false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('capture orientation geometry gate', () => {
  it('requires stable geometry that matches the handheld viewport orientation', () => {
    expect(geometryIsStable(rect(390, 520), rect(390, 520), 'portrait')).toBe(
      true,
    );
    expect(geometryIsStable(rect(844, 633), rect(844, 633), 'landscape')).toBe(
      true,
    );
    expect(geometryIsStable(rect(390, 520), rect(390, 520), 'landscape')).toBe(
      false,
    );
    expect(geometryIsStable(rect(520, 390), rect(520, 390), 'portrait')).toBe(
      false,
    );
    expect(geometryIsStable(rect(390, 520), rect(844, 633), 'landscape')).toBe(
      false,
    );
  });

  it('detects portrait and landscape for a coarse-pointer phone above 720 CSS px', () => {
    setViewport(844, 390, true);
    expect(expectedStageOrientation()).toBe('landscape');
    setViewport(390, 844, false);
    expect(expectedStageOrientation()).toBe('portrait');
  });

  it('uses the latest settled stage for portrait to landscape to portrait captures', async () => {
    const cameraAdapter = createCameraAdapter();
    const composition = createCompositionAdapter();
    render(
      <CameraView
        adapter={cameraAdapter}
        compositionAdapter={composition.adapter}
      />,
    );

    const stage = screen.getByTestId('camera-stage');
    const setStage = installDynamicStageGeometry(stage);
    setStage(390, 520);
    window.dispatchEvent(new Event('resize'));
    await flushFrames();

    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await screen.findByAltText('Captured Clawd composition');
    const portraitOutput = composition.createCanvas.mock.calls[0];
    expect(portraitOutput[1]).toBeGreaterThan(portraitOutput[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
    );

    setViewport(844, 390, true);
    window.dispatchEvent(new Event('orientationchange'));
    await flushFrames();
    expect(
      screen.getByText('Preparing the current preview orientation…'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    expect(composition.createCanvas).toHaveBeenCalledTimes(1);

    setStage(520, 390);
    window.dispatchEvent(new Event('resize'));
    await flushFrames();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await waitFor(() =>
      expect(composition.createCanvas).toHaveBeenCalledTimes(2),
    );
    await screen.findByAltText('Captured Clawd composition');
    const landscapeOutput = composition.createCanvas.mock.calls[1];
    expect(landscapeOutput[0]).toBeGreaterThan(landscapeOutput[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Take photo' })).toBeEnabled(),
    );

    setViewport(390, 844, false);
    window.dispatchEvent(new Event('orientationchange'));
    await flushFrames();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    expect(composition.createCanvas).toHaveBeenCalledTimes(2);

    setStage(390, 520);
    window.dispatchEvent(new Event('resize'));
    await flushFrames();
    fireEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await waitFor(() =>
      expect(composition.createCanvas).toHaveBeenCalledTimes(3),
    );
    const returnedPortraitOutput = composition.createCanvas.mock.calls[2];
    expect(returnedPortraitOutput[1]).toBeGreaterThan(
      returnedPortraitOutput[0],
    );
  });
});

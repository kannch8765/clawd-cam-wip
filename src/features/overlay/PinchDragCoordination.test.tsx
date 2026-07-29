import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { CameraView } from '../camera/CameraView';
import type { CameraAdapter } from '../camera/cameraTypes';

class FakeTrack extends EventTarget {
  stop = vi.fn();
}

function createAdapter(): CameraAdapter {
  const track = new FakeTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;

  return {
    requestStream: vi.fn(async () => stream),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
      { deviceId: 'front', groupId: 'phone', label: 'Front camera' },
    ]),
    stopStream: vi.fn((activeStream) => {
      for (const activeTrack of activeStream.getTracks()) {
        activeTrack.stop();
      }
    }),
    waitForVideoReady: vi.fn(async () => ({ width: 1280, height: 720 })),
  };
}

interface RenderedTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

function readTransform(element: HTMLElement): RenderedTransform {
  return {
    x: Number(element.dataset.overlayX),
    y: Number(element.dataset.overlayY),
    scale: Number(element.dataset.overlayScale),
    rotation: Number(element.dataset.overlayRotation),
  };
}

function expectTransformCloseTo(
  actual: RenderedTransform,
  expected: RenderedTransform,
) {
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
  expect(actual.scale).toBeCloseTo(expected.scale, 8);
  expect(actual.rotation).toBeCloseTo(expected.rotation, 8);
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pinch and drag coordination', () => {
  it('suppresses the original drag until it fully ends after a two-pointer pinch', async () => {
    render(<CameraView adapter={createAdapter()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');

    const layer = screen.getByTestId('overlay-interaction-layer');
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 400,
      top: 0,
      right: 300,
      bottom: 400,
      left: 0,
      toJSON: () => ({}),
    });

    const overlay = screen.getByAltText('Reference Clawd');

    await act(async () => {
      fireEvent.pointerDown(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 90,
        clientY: 200,
      });
      fireEvent.pointerMove(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 105,
        clientY: 200,
      });
      fireEvent.pointerDown(layer, {
        pointerId: 2,
        pointerType: 'touch',
        isPrimary: false,
        buttons: 1,
        clientX: 210,
        clientY: 200,
      });
      fireEvent.pointerMove(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 90,
        clientY: 180,
      });
      fireEvent.pointerMove(layer, {
        pointerId: 2,
        pointerType: 'touch',
        isPrimary: false,
        buttons: 1,
        clientX: 240,
        clientY: 240,
      });
    });

    await waitFor(() => {
      expect(Number(overlay.dataset.overlayScale)).toBeGreaterThan(1);
      expect(Math.abs(Number(overlay.dataset.overlayRotation))).toBeGreaterThan(
        1,
      );
    });
    const pinchMoveTransform = readTransform(overlay);

    await act(async () => {
      fireEvent.pointerUp(layer, {
        pointerId: 2,
        pointerType: 'touch',
        isPrimary: false,
        buttons: 0,
        clientX: 240,
        clientY: 240,
      });
    });

    const pinchEndTransform = readTransform(overlay);
    expectTransformCloseTo(pinchEndTransform, pinchMoveTransform);
    expect(pinchEndTransform.scale).toBeGreaterThan(1);
    expect(Math.abs(pinchEndTransform.rotation)).toBeGreaterThan(1);

    await act(async () => {
      fireEvent.pointerMove(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 145,
        clientY: 225,
      });
    });
    expectTransformCloseTo(readTransform(overlay), pinchEndTransform);

    await act(async () => {
      fireEvent.pointerUp(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 0,
        clientX: 145,
        clientY: 225,
      });
    });
    expectTransformCloseTo(readTransform(overlay), pinchEndTransform);
  });
});

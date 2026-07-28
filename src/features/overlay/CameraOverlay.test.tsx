import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { CameraView } from '../camera/CameraView';
import type { CameraAdapter, CameraFacingMode } from '../camera/cameraTypes';

class FakeTrack extends EventTarget {
  stop = vi.fn();
}

function createStream(): MediaStream {
  const track = new FakeTrack();
  return {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
}

function createAdapter(
  streams: MediaStream[] = [createStream()],
): CameraAdapter {
  const requestStream = vi
    .fn<(facingMode: CameraFacingMode) => Promise<MediaStream>>()
    .mockImplementation(async () => streams.shift() ?? createStream());

  return {
    requestStream,
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear camera' },
      { deviceId: 'front', groupId: 'phone', label: 'Front camera' },
    ]),
    stopStream: vi.fn((stream) => {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }),
    waitForVideoReady: vi.fn(async () => ({ width: 1280, height: 720 })),
  };
}

async function startCamera(adapter: CameraAdapter) {
  render(<CameraView adapter={adapter} />);
  fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
  await screen.findByText('Rear camera ready');
}

function mockPreviewBounds(
  element: HTMLElement,
  width: number,
  height: number,
) {
  return vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    toJSON: () => ({}),
  });
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('camera overlay integration', () => {
  it('does not show an interactive overlay before the camera is ready', () => {
    render(<CameraView adapter={createAdapter()} />);

    expect(screen.queryByAltText('Reference Clawd')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('overlay-interaction-layer'),
    ).not.toBeInTheDocument();
  });

  it('shows the reference Clawd with the default authoritative transform once ready', async () => {
    await startCamera(createAdapter());

    const overlay = screen.getByAltText('Reference Clawd');
    expect(overlay).toHaveAttribute(
      'src',
      '/assets/reference/clawd-reference-overlay.png',
    );
    expect(overlay).toHaveAttribute('data-overlay-x', '0.5');
    expect(overlay).toHaveAttribute('data-overlay-y', '0.52');
    expect(overlay).toHaveAttribute('data-overlay-scale', '1');
    expect(overlay).toHaveAttribute('data-overlay-rotation', '0');
    expect(screen.getByRole('button', { name: 'Reset Clawd' })).toBeEnabled();
  });

  it('updates normalized x and y from a real single-pointer drag and Reset restores defaults', async () => {
    await startCamera(createAdapter());
    const layer = screen.getByTestId('overlay-interaction-layer');
    mockPreviewBounds(layer, 200, 400);

    await act(async () => {
      fireEvent.pointerDown(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 100,
        clientY: 200,
      });
      fireEvent.pointerMove(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 150,
        clientY: 240,
      });
      fireEvent.pointerUp(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 0,
        clientX: 150,
        clientY: 240,
      });
    });

    const overlay = screen.getByAltText('Reference Clawd');
    await waitFor(() => {
      expect(overlay).toHaveAttribute('data-overlay-x', '0.75');
      expect(overlay).toHaveAttribute('data-overlay-y', '0.62');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Clawd' }));
    expect(overlay).toHaveAttribute('data-overlay-x', '0.5');
    expect(overlay).toHaveAttribute('data-overlay-y', '0.52');
  });

  it('keeps the same normalized placement when the preview CSS size changes', async () => {
    await startCamera(createAdapter());
    const layer = screen.getByTestId('overlay-interaction-layer');
    const bounds = mockPreviewBounds(layer, 200, 400);

    await act(async () => {
      fireEvent.pointerDown(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 100,
        clientY: 200,
      });
      fireEvent.pointerMove(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 1,
        clientX: 140,
        clientY: 240,
      });
      fireEvent.pointerUp(layer, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        buttons: 0,
        clientX: 140,
        clientY: 240,
      });
    });

    const overlay = screen.getByAltText('Reference Clawd');
    await waitFor(() => {
      expect(overlay).toHaveAttribute('data-overlay-x', '0.7');
      expect(overlay).toHaveAttribute('data-overlay-y', '0.62');
    });
    const leftBeforeResize = overlay.style.left;
    const topBeforeResize = overlay.style.top;

    bounds.mockReturnValue({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
      top: 0,
      right: 400,
      bottom: 800,
      left: 0,
      toJSON: () => ({}),
    });
    fireEvent(window, new Event('resize'));

    expect(overlay).toHaveAttribute('data-overlay-x', '0.7');
    expect(overlay).toHaveAttribute('data-overlay-y', '0.62');
    expect(overlay.style.left).toBe(leftBeforeResize);
    expect(overlay.style.top).toBe(topBeforeResize);
  });

  it('mirrors only the front camera preview and never mirrors the Clawd', async () => {
    const adapter = createAdapter([createStream(), createStream()]);
    await startCamera(adapter);

    const rearPreview = screen.getByLabelText('Live camera preview');
    const rearOverlay = screen.getByAltText('Reference Clawd');
    expect(rearPreview).toHaveAttribute('data-mirrored', 'false');
    expect(rearOverlay).toHaveAttribute('data-mirrored', 'false');

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to front camera' }),
    );
    await screen.findByText('Front camera ready');

    const frontPreview = screen.getByLabelText('Live camera preview');
    const frontOverlay = screen.getByAltText('Reference Clawd');
    expect(frontPreview).toHaveClass('camera-preview--mirrored');
    expect(frontPreview).toHaveAttribute('data-mirrored', 'true');
    expect(frontOverlay).not.toHaveClass('camera-preview--mirrored');
    expect(frontOverlay).toHaveAttribute('data-mirrored', 'false');
  });

  it('removes gesture listeners on camera restart and component unmount', async () => {
    const adapter = createAdapter([createStream(), createStream()]);
    const view = render(<CameraView adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
    await screen.findByText('Rear camera ready');

    const firstLayer = screen.getByTestId('overlay-interaction-layer');
    const firstRemoveListener = vi.spyOn(firstLayer, 'removeEventListener');
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to front camera' }),
    );
    await screen.findByText('Front camera ready');

    expect(firstLayer).not.toBeInTheDocument();
    expect(firstRemoveListener).toHaveBeenCalled();

    const secondLayer = screen.getByTestId('overlay-interaction-layer');
    const secondRemoveListener = vi.spyOn(secondLayer, 'removeEventListener');
    view.unmount();

    expect(secondRemoveListener).toHaveBeenCalled();
  });
});

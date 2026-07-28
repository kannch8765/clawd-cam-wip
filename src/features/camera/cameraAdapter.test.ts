import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserCameraAdapter, mapCameraError } from './cameraAdapter';
import { CameraError } from './cameraTypes';

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  'mediaDevices',
);

function setMediaDevices(value: Partial<MediaDevices> | undefined) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  vi.restoreAllMocks();

  if (originalMediaDevicesDescriptor) {
    Object.defineProperty(
      navigator,
      'mediaDevices',
      originalMediaDevicesDescriptor,
    );
  } else {
    Reflect.deleteProperty(navigator, 'mediaDevices');
  }
});

describe('browserCameraAdapter', () => {
  it('reports unsupported when mediaDevices is missing', async () => {
    setMediaDevices(undefined);

    await expect(
      browserCameraAdapter.requestStream('environment'),
    ).rejects.toMatchObject({ code: 'unsupported' });
  });

  it('reports unsupported when getUserMedia is missing', async () => {
    setMediaDevices({});

    await expect(
      browserCameraAdapter.requestStream('environment'),
    ).rejects.toMatchObject({ code: 'unsupported' });
  });

  it('uses ideal facing constraints and maps permission denial', async () => {
    const getUserMedia = vi.fn(async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    });
    setMediaDevices({ getUserMedia } as Partial<MediaDevices>);

    await expect(
      browserCameraAdapter.requestStream('user'),
    ).rejects.toMatchObject({ code: 'permission-denied' });
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
  });

  it('falls back to a basic video request after a constraint failure', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const getUserMedia = vi
      .fn<(constraints?: MediaStreamConstraints) => Promise<MediaStream>>()
      .mockRejectedValueOnce(
        new DOMException('Unavailable constraint', 'OverconstrainedError'),
      )
      .mockResolvedValueOnce(stream);
    setMediaDevices({ getUserMedia } as Partial<MediaDevices>);

    await expect(
      browserCameraAdapter.requestStream('environment'),
    ).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      audio: false,
      video: true,
    });
  });

  it('enumerates only video input devices', async () => {
    setMediaDevices({
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn(
        async () =>
          [
            {
              kind: 'audioinput',
              deviceId: 'microphone',
              groupId: 'group',
              label: 'Microphone',
            },
            {
              kind: 'videoinput',
              deviceId: 'camera',
              groupId: 'group',
              label: 'Camera',
            },
          ] as MediaDeviceInfo[],
      ),
    } as Partial<MediaDevices>);

    await expect(browserCameraAdapter.enumerateVideoInputs()).resolves.toEqual([
      {
        deviceId: 'camera',
        groupId: 'group',
        label: 'Camera',
      },
    ]);
  });

  it('waits for metadata and non-zero intrinsic dimensions', async () => {
    const video = document.createElement('video');
    const abortController = new AbortController();

    Object.defineProperties(video, {
      readyState: { configurable: true, value: 0 },
      videoWidth: { configurable: true, value: 0 },
      videoHeight: { configurable: true, value: 0 },
    });

    const readiness = browserCameraAdapter.waitForVideoReady(
      video,
      abortController.signal,
    );

    Object.defineProperties(video, {
      readyState: {
        configurable: true,
        value: HTMLMediaElement.HAVE_METADATA,
      },
      videoWidth: { configurable: true, value: 640 },
      videoHeight: { configurable: true, value: 480 },
    });
    video.dispatchEvent(new Event('loadedmetadata'));

    await expect(readiness).resolves.toEqual({ width: 640, height: 480 });
  });

  it('maps unknown browser failures to runtime errors', () => {
    expect(mapCameraError(new Error('boom'))).toEqual(
      expect.objectContaining({
        code: 'runtime-error',
        name: 'CameraError',
      }),
    );
    expect(mapCameraError(new CameraError('unavailable', 'none'))).toEqual(
      expect.objectContaining({ code: 'unavailable' }),
    );
  });
});

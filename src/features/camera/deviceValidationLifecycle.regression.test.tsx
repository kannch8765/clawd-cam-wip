import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CameraAdapter } from './cameraTypes';
import { MUTE_RECOVERY_GRACE_MS, useCamera } from './useCamera';

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  enabled = true;
  muted = false;
  muteWhenListenerIsAdded = false;
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'mute' && this.muteWhenListenerIsAdded) {
      this.muteWhenListenerIsAdded = false;
      this.muted = true;
    }
    super.addEventListener(type, callback, options);
  }
}

function streamWith(track: FakeTrack): MediaStream {
  return {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
}

function adapterFor(stream: MediaStream): CameraAdapter {
  return {
    requestStream: vi.fn(async () => stream),
    enumerateVideoInputs: vi.fn(async () => [
      { deviceId: 'rear', groupId: 'phone', label: 'Rear' },
    ]),
    stopStream: vi.fn((value) =>
      value.getTracks().forEach((track: MediaStreamTrack) => track.stop()),
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

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  });
}

beforeEach(() => {
  setVisibility('visible');
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('0.1.0 camera lifecycle boundaries', () => {
  it('rejects a muted startup stream instead of reporting ready and exposes retry', async () => {
    const track = new FakeTrack();
    track.muted = true;
    const adapter = adapterFor(streamWith(track));
    const { result } = renderHook(() => useCamera(adapter));
    result.current.videoRef.current = document.createElement('video');

    await act(async () => result.current.startCamera('environment'));

    expect(result.current.state.status).toBe('interrupted');
    expect(adapter.stopStream).toHaveBeenCalledTimes(1);
    expect(result.current.retry).toEqual(expect.any(Function));
  });

  it('reconciles a mute that occurs before wrapper listeners are installed', async () => {
    vi.useFakeTimers();
    const track = new FakeTrack();
    track.muteWhenListenerIsAdded = true;
    const adapter = adapterFor(streamWith(track));
    const { result } = renderHook(() => useCamera(adapter));
    result.current.videoRef.current = document.createElement('video');

    await act(async () => result.current.startCamera('environment'));

    expect(result.current.state.status).toBe('interrupted');
    expect(result.current.getCameraCaptureSource()).toBeNull();

    await act(async () =>
      vi.advanceTimersByTimeAsync(MUTE_RECOVERY_GRACE_MS + 1),
    );

    expect(result.current.state.status).toBe('interrupted');
    expect(adapter.stopStream).toHaveBeenCalledTimes(1);
  });

  it('turns a persistent visible mute into a recoverable interruption', async () => {
    vi.useFakeTimers();
    const track = new FakeTrack();
    const adapter = adapterFor(streamWith(track));
    const { result } = renderHook(() => useCamera(adapter));
    result.current.videoRef.current = document.createElement('video');

    await act(async () => result.current.startCamera('environment'));
    expect(result.current.state.status).toBe('ready');

    track.muted = true;
    act(() => track.dispatchEvent(new Event('mute')));

    expect(result.current.state.status).toBe('interrupted');
    expect(result.current.getCameraCaptureSource()).toBeNull();

    await act(async () =>
      vi.advanceTimersByTimeAsync(MUTE_RECOVERY_GRACE_MS + 1),
    );

    expect(result.current.state.status).toBe('interrupted');
    expect(adapter.stopStream).toHaveBeenCalledTimes(1);
  });

  it('allows a hidden iOS stream to recover after becoming visible without a 750ms false kill', async () => {
    vi.useFakeTimers();
    const track = new FakeTrack();
    const adapter = adapterFor(streamWith(track));
    const { result } = renderHook(() => useCamera(adapter));
    result.current.videoRef.current = document.createElement('video');

    await act(async () => result.current.startCamera('environment'));
    expect(result.current.state.status).toBe('ready');

    setVisibility('hidden');
    track.muted = true;
    act(() => track.dispatchEvent(new Event('mute')));
    await act(async () =>
      vi.advanceTimersByTimeAsync(MUTE_RECOVERY_GRACE_MS + 1),
    );
    expect(result.current.state.status).toBe('ready');

    setVisibility('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.state.status).toBe('interrupted');
    await act(async () => vi.advanceTimersByTimeAsync(1_500));

    track.muted = false;
    act(() => track.dispatchEvent(new Event('unmute')));
    expect(result.current.state.status).toBe('ready');
    await act(async () =>
      vi.advanceTimersByTimeAsync(MUTE_RECOVERY_GRACE_MS + 1),
    );

    expect(result.current.state.status).toBe('ready');
    expect(result.current.getCameraCaptureSource()).not.toBeNull();
    expect(adapter.stopStream).not.toHaveBeenCalled();
  });

  it('releases the active stream once and clears the video during React cleanup', async () => {
    const track = new FakeTrack();
    const adapter = adapterFor(streamWith(track));
    const { result, unmount } = renderHook(() => useCamera(adapter));
    const video = document.createElement('video');
    result.current.videoRef.current = video;

    await act(async () => result.current.startCamera('environment'));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(video.srcObject).not.toBeNull();

    unmount();

    expect(video.srcObject).toBeNull();
    expect(adapter.stopStream).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
  });
});

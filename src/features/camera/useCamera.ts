import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CameraError,
  type CameraAdapter,
  type CameraCaptureSource,
} from './cameraTypes';
import {
  CAMERA_STARTUP_TIMEOUT_MS,
  useCamera as useBaseCamera,
} from './useCameraBase';

export { CAMERA_STARTUP_TIMEOUT_MS };
export const MUTE_RECOVERY_GRACE_MS = 3_000;

function streamIsUsable(stream: MediaStream): boolean {
  const tracks = stream.getTracks();
  return (
    tracks.length > 0 &&
    tracks.every(
      (track) =>
        track.readyState !== 'ended' &&
        track.enabled !== false &&
        track.muted !== true,
    )
  );
}

function interruptStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.dispatchEvent(new Event('ended'));
  }
}

export function useCamera(adapter: CameraAdapter) {
  const stoppedStreamsRef = useRef(new WeakSet<MediaStream>());
  const [trackInterrupted, setTrackInterrupted] = useState(false);
  const wrappedAdapter = useMemo<CameraAdapter>(
    () => ({
      ...adapter,
      async requestStream(facingMode) {
        const stream = await adapter.requestStream(facingMode);
        if (!streamIsUsable(stream)) {
          if (!stoppedStreamsRef.current.has(stream)) {
            stoppedStreamsRef.current.add(stream);
            adapter.stopStream(stream);
          }
          throw new CameraError(
            'interrupted',
            'The camera did not provide a usable video track. Please try again.',
          );
        }
        return stream;
      },
      async waitForVideoReady(video, signal) {
        const dimensions = await adapter.waitForVideoReady(video, signal);
        const stream = video.srcObject as MediaStream | null;
        if (
          !stream ||
          typeof stream.getTracks !== 'function' ||
          !streamIsUsable(stream)
        ) {
          throw new CameraError(
            'interrupted',
            'The camera stopped before a usable preview became available.',
          );
        }
        return dimensions;
      },
      stopStream(stream) {
        if (stoppedStreamsRef.current.has(stream)) {
          return;
        }
        stoppedStreamsRef.current.add(stream);
        adapter.stopStream(stream);
      },
    }),
    [adapter],
  );
  const camera = useBaseCamera(wrappedAdapter);
  const {
    state,
    getCameraCaptureSource: getBaseCameraCaptureSource,
    isCameraCaptureSourceCurrent: isBaseCameraCaptureSourceCurrent,
  } = camera;

  useLayoutEffect(() => {
    if (state.status !== 'ready') {
      return;
    }

    const source = getBaseCameraCaptureSource();
    if (!source) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const cancelTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };
    const scheduleVisibleInterruption = () => {
      if (
        timer !== null ||
        document.visibilityState !== 'visible' ||
        streamIsUsable(source.stream)
      ) {
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        if (
          document.visibilityState === 'visible' &&
          !streamIsUsable(source.stream)
        ) {
          interruptStream(source.stream);
        }
      }, MUTE_RECOVERY_GRACE_MS);
    };
    const reconcileTrackState = () => {
      if (
        document.visibilityState !== 'visible' ||
        streamIsUsable(source.stream)
      ) {
        cancelTimer();
        setTrackInterrupted(false);
        return;
      }
      setTrackInterrupted(true);
      scheduleVisibleInterruption();
    };

    const tracks = source.stream.getTracks();
    for (const track of tracks) {
      track.addEventListener('mute', reconcileTrackState);
      track.addEventListener('unmute', reconcileTrackState);
    }
    document.addEventListener('visibilitychange', reconcileTrackState);

    // Reconcile after listener installation so a mute that happened between the
    // base ready transition and this layout effect cannot leave a false-ready UI.
    reconcileTrackState();

    return () => {
      cancelTimer();
      for (const track of tracks) {
        track.removeEventListener('mute', reconcileTrackState);
        track.removeEventListener('unmute', reconcileTrackState);
      }
      document.removeEventListener('visibilitychange', reconcileTrackState);
      if (source.video.srcObject === source.stream) {
        source.video.srcObject = null;
      }
    };
  }, [state.status, getBaseCameraCaptureSource]);

  const getCameraCaptureSource = useCallback(() => {
    const source = getBaseCameraCaptureSource();
    return source && streamIsUsable(source.stream) ? source : null;
  }, [getBaseCameraCaptureSource]);

  const isCameraCaptureSourceCurrent = useCallback(
    (source: CameraCaptureSource) =>
      streamIsUsable(source.stream) && isBaseCameraCaptureSourceCurrent(source),
    [isBaseCameraCaptureSourceCurrent],
  );

  const exposedState =
    trackInterrupted && state.status === 'ready'
      ? {
          status: 'interrupted' as const,
          facingMode: state.facingMode,
          error: new CameraError(
            'interrupted',
            'The camera is temporarily unavailable. Wait for it to resume or restart it.',
          ),
        }
      : state;

  return {
    ...camera,
    state: exposedState,
    getCameraCaptureSource,
    isCameraCaptureSourceCurrent,
  };
}

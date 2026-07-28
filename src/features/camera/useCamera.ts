import { useCallback, useEffect, useRef, useState } from 'react';
import { mapCameraError } from './cameraAdapter';
import {
  CameraError,
  type CameraAdapter,
  type CameraFacingMode,
  type CameraState,
} from './cameraTypes';

const initialState: CameraState = {
  status: 'idle',
  facingMode: 'environment',
};

function errorState(
  error: CameraError,
  facingMode: CameraFacingMode,
): CameraState {
  switch (error.code) {
    case 'permission-denied':
      return { status: 'permission-denied', facingMode, error };
    case 'unsupported':
      return { status: 'unsupported', facingMode, error };
    case 'unavailable':
    case 'constraints':
      return { status: 'unavailable', facingMode, error };
    case 'interrupted':
      return { status: 'interrupted', facingMode, error };
    case 'runtime-error':
      return { status: 'runtime-error', facingMode, error };
  }
}

export function useCamera(adapter: CameraAdapter) {
  const [state, setState] = useState<CameraState>(initialState);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const removeTrackListenersRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(false);
  const releasedStreamsRef = useRef(new WeakSet<MediaStream>());

  const stopStreamOnce = useCallback(
    (stream: MediaStream) => {
      if (releasedStreamsRef.current.has(stream)) {
        return;
      }

      releasedStreamsRef.current.add(stream);
      adapter.stopStream(stream);
    },
    [adapter],
  );

  const releaseCurrentStream = useCallback(() => {
    removeTrackListenersRef.current?.();
    removeTrackListenersRef.current = null;

    const stream = streamRef.current;
    streamRef.current = null;

    if (videoRef.current?.srcObject === stream) {
      videoRef.current.srcObject = null;
    }

    if (stream) {
      stopStreamOnce(stream);
    }
  }, [stopStreamOnce]);

  const cancelCurrentRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    releaseCurrentStream();
  }, [releaseCurrentStream]);

  const startCamera = useCallback(
    async (facingMode: CameraFacingMode) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      cancelCurrentRequest();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setState({ status: 'requesting', facingMode });

      let requestedStream: MediaStream | null = null;

      try {
        requestedStream = await adapter.requestStream(facingMode);

        if (!mountedRef.current || requestIdRef.current !== requestId) {
          stopStreamOnce(requestedStream);
          return;
        }

        streamRef.current = requestedStream;

        const handleTrackEnded = () => {
          if (
            !mountedRef.current ||
            requestIdRef.current !== requestId ||
            streamRef.current !== requestedStream
          ) {
            return;
          }

          requestIdRef.current += 1;
          abortControllerRef.current?.abort();
          abortControllerRef.current = null;
          releaseCurrentStream();
          setState({
            status: 'interrupted',
            facingMode,
            error: new CameraError(
              'interrupted',
              'The active camera stream ended unexpectedly.',
            ),
          });
        };

        const tracks = requestedStream.getTracks();
        for (const track of tracks) {
          track.addEventListener('ended', handleTrackEnded);
        }
        removeTrackListenersRef.current = () => {
          for (const track of tracks) {
            track.removeEventListener('ended', handleTrackEnded);
          }
        };

        const devices = await adapter.enumerateVideoInputs();

        if (!mountedRef.current || requestIdRef.current !== requestId) {
          stopStreamOnce(requestedStream);
          return;
        }

        if (devices.length === 0) {
          throw new CameraError('unavailable', 'No video input is available.');
        }

        const video = videoRef.current;

        if (!video) {
          throw new CameraError(
            'runtime-error',
            'The camera preview is not available.',
          );
        }

        video.srcObject = requestedStream;
        try {
          void video.play().catch(() => undefined);
        } catch {
          // Metadata events can still establish readiness when play() is unavailable.
        }

        const dimensions = await adapter.waitForVideoReady(
          video,
          abortController.signal,
        );

        if (!mountedRef.current || requestIdRef.current !== requestId) {
          stopStreamOnce(requestedStream);
          return;
        }

        abortControllerRef.current = null;
        setState({
          status: 'ready',
          facingMode,
          deviceCount: devices.length,
          dimensions,
        });
      } catch (error) {
        if (!mountedRef.current || requestIdRef.current !== requestId) {
          if (requestedStream) {
            stopStreamOnce(requestedStream);
          }
          return;
        }

        abortControllerRef.current = null;
        releaseCurrentStream();
        setState(errorState(mapCameraError(error), facingMode));
      }
    },
    [adapter, cancelCurrentRequest, releaseCurrentStream, stopStreamOnce],
  );

  const retry = useCallback(() => {
    void startCamera(state.facingMode);
  }, [startCamera, state.facingMode]);

  const switchCamera = useCallback(() => {
    const facingMode = state.facingMode === 'user' ? 'environment' : 'user';
    void startCamera(facingMode);
  }, [startCamera, state.facingMode]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      cancelCurrentRequest();
    };
  }, [cancelCurrentRequest]);

  return {
    state,
    videoRef,
    startCamera,
    retry,
    switchCamera,
  };
}

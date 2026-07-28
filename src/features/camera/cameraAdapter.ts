import {
  CameraError,
  type CameraAdapter,
  type CameraDevice,
  type CameraFacingMode,
  type VideoDimensions,
} from './cameraTypes';

const preferredConstraints = (
  facingMode: CameraFacingMode,
): MediaStreamConstraints => ({
  audio: false,
  video: {
    facingMode: { ideal: facingMode },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
});

const fallbackConstraints: MediaStreamConstraints = {
  audio: false,
  video: true,
};

function getMediaDevices(): MediaDevices {
  const mediaDevices = navigator.mediaDevices;

  if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
    throw new CameraError(
      'unsupported',
      'This browser does not support camera access.',
    );
  }

  return mediaDevices;
}

export function mapCameraError(error: unknown): CameraError {
  if (error instanceof CameraError) {
    return error;
  }

  const name =
    typeof error === 'object' && error && 'name' in error
      ? String(error.name)
      : '';

  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return new CameraError(
        'permission-denied',
        'Camera permission was denied.',
        error,
      );
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return new CameraError('unavailable', 'No camera was found.', error);
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return new CameraError(
        'interrupted',
        'The camera could not be started or was interrupted.',
        error,
      );
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return new CameraError(
        'constraints',
        'The requested camera constraints are not available.',
        error,
      );
    default:
      return new CameraError(
        'runtime-error',
        'The camera could not be started.',
        error,
      );
  }
}

async function requestStream(
  facingMode: CameraFacingMode,
): Promise<MediaStream> {
  const mediaDevices = getMediaDevices();

  try {
    return await mediaDevices.getUserMedia(preferredConstraints(facingMode));
  } catch (error) {
    const mappedError = mapCameraError(error);

    if (mappedError.code !== 'constraints') {
      throw mappedError;
    }

    try {
      return await mediaDevices.getUserMedia(fallbackConstraints);
    } catch (fallbackError) {
      throw mapCameraError(fallbackError);
    }
  }
}

async function enumerateVideoInputs(): Promise<CameraDevice[]> {
  const mediaDevices = getMediaDevices();

  if (typeof mediaDevices.enumerateDevices !== 'function') {
    return [{ deviceId: '', groupId: '', label: 'Camera' }];
  }

  const devices = await mediaDevices.enumerateDevices();

  return devices
    .filter((device) => device.kind === 'videoinput')
    .map(({ deviceId, groupId, label }) => ({ deviceId, groupId, label }));
}

function stopStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function waitForVideoReady(
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<VideoDimensions> {
  return new Promise((resolve, reject) => {
    const getDimensions = (): VideoDimensions | null => {
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        return null;
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        return null;
      }

      return { width: video.videoWidth, height: video.videoHeight };
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('resize', handleReady);
      video.removeEventListener('canplay', handleReady);
      signal.removeEventListener('abort', handleAbort);
    };

    const handleReady = () => {
      const dimensions = getDimensions();

      if (!dimensions) {
        return;
      }

      cleanup();
      resolve(dimensions);
    };

    const handleAbort = () => {
      cleanup();
      reject(
        new CameraError(
          'interrupted',
          'The camera request was replaced or cancelled.',
        ),
      );
    };

    if (signal.aborted) {
      handleAbort();
      return;
    }

    const dimensions = getDimensions();

    if (dimensions) {
      resolve(dimensions);
      return;
    }

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('resize', handleReady);
    video.addEventListener('canplay', handleReady);
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

export const browserCameraAdapter: CameraAdapter = {
  requestStream,
  enumerateVideoInputs,
  stopStream,
  waitForVideoReady,
};

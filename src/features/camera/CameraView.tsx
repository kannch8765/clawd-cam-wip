import { browserCameraAdapter } from './cameraAdapter';
import type { CameraAdapter, CameraState } from './cameraTypes';
import { useCamera } from './useCamera';
import { OverlayPreview } from '../overlay/OverlayPreview';
import { REFERENCE_CLAWD_ASSET } from '../overlay/overlayAssets';
import { useOverlayController } from '../overlay/useOverlayController';

interface CameraViewProps {
  adapter?: CameraAdapter;
}

function statusLabel(state: CameraState): string {
  switch (state.status) {
    case 'idle':
      return 'Camera off';
    case 'requesting':
      return 'Requesting access';
    case 'ready':
      return state.facingMode === 'user'
        ? 'Front camera ready'
        : 'Rear camera ready';
    case 'permission-denied':
      return 'Permission denied';
    case 'unsupported':
      return 'Camera unsupported';
    case 'unavailable':
      return 'Camera unavailable';
    case 'interrupted':
      return 'Camera interrupted';
    case 'runtime-error':
      return 'Camera error';
  }
}

function stateMessage(state: CameraState): string {
  switch (state.status) {
    case 'idle':
      return 'Start the camera when you are ready. ClawdCam will ask for permission only after you tap the button.';
    case 'requesting':
      return 'Waiting for camera permission and a usable video preview.';
    case 'ready':
      return state.facingMode === 'user'
        ? 'Front camera preview is mirrored so it behaves like a selfie view.'
        : 'Rear camera preview is shown without mirroring.';
    case 'permission-denied':
      return 'Camera access was denied. Allow camera permission in your browser settings, then try again.';
    case 'unsupported':
      return 'This browser does not expose the camera APIs ClawdCam needs.';
    case 'unavailable':
      return 'No usable camera is available. Another app may be using it, or this device may not expose a video input.';
    case 'interrupted':
      return 'The camera stream ended unexpectedly. You can restart it safely.';
    case 'runtime-error':
      return 'ClawdCam could not start the camera. Try again after checking the device and browser permissions.';
  }
}

export function CameraView({
  adapter = browserCameraAdapter,
}: CameraViewProps) {
  const { state, videoRef, startCamera, retry, switchCamera } =
    useCamera(adapter);
  const { transform, updateTransform, resetTransform } = useOverlayController();
  const isReady = state.status === 'ready';
  const isMirrored = isReady && state.facingMode === 'user';
  const canSwitch = isReady && state.deviceCount > 1;
  const previewClassName = isMirrored
    ? 'camera-preview camera-preview--mirrored'
    : 'camera-preview';

  return (
    <section className="camera-card" aria-labelledby="camera-heading">
      <div className="camera-stage">
        <video
          ref={videoRef}
          className={previewClassName}
          data-mirrored={isMirrored ? 'true' : 'false'}
          aria-label="Live camera preview"
          muted
          playsInline
          autoPlay
        />
        {isReady && (
          <OverlayPreview
            asset={REFERENCE_CLAWD_ASSET}
            transform={transform}
            onTransformChange={updateTransform}
          />
        )}
        {!isReady && (
          <div className="camera-stage-message" aria-live="polite">
            <span className="camera-glyph" aria-hidden="true">
              ◉
            </span>
            <strong>{statusLabel(state)}</strong>
          </div>
        )}
      </div>

      <div className="camera-copy">
        <p className="status-pill">{statusLabel(state)}</p>
        <h2 id="camera-heading">Camera workspace</h2>
        <p>{stateMessage(state)}</p>

        {state.status === 'idle' && (
          <button
            className="primary-action"
            type="button"
            onClick={() => void startCamera('environment')}
          >
            Start camera
          </button>
        )}

        {state.status === 'requesting' && (
          <p className="camera-progress" role="status">
            Opening camera…
          </p>
        )}

        {canSwitch && (
          <button
            className="secondary-action"
            type="button"
            onClick={switchCamera}
          >
            Switch to {state.facingMode === 'user' ? 'rear' : 'front'} camera
          </button>
        )}

        {isReady && (
          <>
            <p className="camera-details">
              {state.facingMode === 'user' ? 'Front' : 'Rear'} camera ·{' '}
              {state.dimensions.width} × {state.dimensions.height}
            </p>
            <div
              className="overlay-controls"
              aria-label="Clawd overlay controls"
            >
              <p className="overlay-selection">
                <span>Selected overlay</span>
                <strong>{REFERENCE_CLAWD_ASSET.label}</strong>
              </p>
              <button
                className="secondary-action overlay-reset"
                type="button"
                onClick={resetTransform}
              >
                Reset Clawd
              </button>
            </div>
          </>
        )}

        {(state.status === 'permission-denied' ||
          state.status === 'unavailable' ||
          state.status === 'interrupted' ||
          state.status === 'runtime-error') && (
          <button className="primary-action" type="button" onClick={retry}>
            {state.status === 'interrupted' ? 'Restart camera' : 'Try again'}
          </button>
        )}
      </div>
    </section>
  );
}

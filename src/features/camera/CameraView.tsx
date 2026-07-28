import { useEffect, useRef, useState, type RefObject } from 'react';
import { CaptureResult } from '../composition/CaptureResult';
import { browserCompositionAdapter } from '../composition/captureAdapter';
import type { CompositionAdapter } from '../composition/compositionTypes';
import {
  measureContentBox,
  usePhotoCapture,
} from '../composition/usePhotoCapture';
import { OverlayPreview } from '../overlay/OverlayPreview';
import { REFERENCE_CLAWD_ASSET } from '../overlay/overlayAssets';
import { useOverlayController } from '../overlay/useOverlayController';
import { browserCameraAdapter } from './cameraAdapter';
import type { CameraAdapter, CameraState } from './cameraTypes';
import { useCamera } from './useCamera';

interface CameraViewProps {
  adapter?: CameraAdapter;
  compositionAdapter?: CompositionAdapter;
}

function useStageContentBoxReady(
  stageRef: RefObject<HTMLElement | null>,
  refreshKey: string,
): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      setIsReady(false);
      return;
    }

    const update = () => {
      const { width, height } = measureContentBox(stage);
      setIsReady(width > 0 && height > 0);
    };
    update();

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(stage);
    window.addEventListener('resize', update);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [refreshKey, stageRef]);

  return isReady;
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
  compositionAdapter = browserCompositionAdapter,
}: CameraViewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const {
    state,
    videoRef,
    startCamera,
    retry,
    switchCamera,
    getCameraCaptureSource,
    isCameraCaptureSourceCurrent,
  } = useCamera(adapter);
  const { transform, updateTransform, resetTransform } = useOverlayController();
  const photoCapture = usePhotoCapture({
    asset: REFERENCE_CLAWD_ASSET,
    transform,
    stageRef,
    getCameraCaptureSource,
    isCameraCaptureSourceCurrent,
    adapter: compositionAdapter,
  });
  const isReady = state.status === 'ready';
  const capturedState =
    photoCapture.state.status === 'captured' ? photoCapture.state : null;
  const isCaptured = capturedState !== null;
  const isCapturing = photoCapture.state.status === 'capturing';
  const isMirrored = isReady && state.facingMode === 'user';
  const canSwitch = isReady && state.deviceCount > 1;
  const isStageReady = useStageContentBoxReady(
    stageRef,
    `${state.status}:${photoCapture.state.status}`,
  );
  const captureSource = isReady ? getCameraCaptureSource() : null;
  const canCapture =
    captureSource !== null &&
    isStageReady &&
    photoCapture.isAssetReady &&
    !isCapturing &&
    !isCaptured;
  const previewClassName = [
    'camera-preview',
    isMirrored ? 'camera-preview--mirrored' : '',
    isCaptured ? 'camera-preview--hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="camera-card" aria-labelledby="camera-heading">
      <div ref={stageRef} className="camera-stage" data-testid="camera-stage">
        <video
          ref={videoRef}
          className={previewClassName}
          data-mirrored={isMirrored ? 'true' : 'false'}
          aria-label="Live camera preview"
          muted
          playsInline
          autoPlay
        />
        {isReady && !isCaptured && (
          <OverlayPreview
            asset={REFERENCE_CLAWD_ASSET}
            transform={transform}
            onTransformChange={updateTransform}
          />
        )}
        {isCaptured && (
          <img
            className="capture-result-image"
            src={capturedState?.objectUrl}
            alt="Captured Clawd composition"
          />
        )}
        {!isReady && !isCaptured && (
          <div className="camera-stage-message" aria-live="polite">
            <span className="camera-glyph" aria-hidden="true">
              ◉
            </span>
            <strong>{statusLabel(state)}</strong>
          </div>
        )}
        {isCapturing && (
          <div className="capture-progress-overlay" role="status">
            Composing photo…
          </div>
        )}
      </div>

      <div className="camera-copy">
        {isCaptured ? (
          <CaptureResult
            result={capturedState.result}
            onRetake={photoCapture.retake}
          />
        ) : (
          <>
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
                disabled={isCapturing}
              >
                Switch to {state.facingMode === 'user' ? 'rear' : 'front'}{' '}
                camera
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
                    disabled={isCapturing}
                  >
                    Reset Clawd
                  </button>
                </div>

                {photoCapture.state.status === 'preparing' && (
                  <p className="capture-setup" role="status">
                    Preparing the reference Clawd for capture…
                  </p>
                )}

                {photoCapture.state.status === 'error' && (
                  <div className="capture-error" role="alert">
                    <strong>Capture needs attention</strong>
                    <p>{photoCapture.state.error.message}</p>
                    {photoCapture.state.phase === 'asset' && (
                      <button
                        className="secondary-action"
                        type="button"
                        onClick={photoCapture.retryAsset}
                      >
                        Retry Clawd asset
                      </button>
                    )}
                  </div>
                )}

                <button
                  className="shutter-action"
                  type="button"
                  aria-label="Take photo"
                  onClick={() => void photoCapture.capture()}
                  disabled={!canCapture}
                >
                  <span aria-hidden="true" />
                  {isCapturing
                    ? 'Capturing…'
                    : photoCapture.state.status === 'error' &&
                        photoCapture.state.phase === 'capture'
                      ? 'Try capture again'
                      : 'Take photo'}
                </button>
              </>
            )}

            {(state.status === 'permission-denied' ||
              state.status === 'unavailable' ||
              state.status === 'interrupted' ||
              state.status === 'runtime-error') && (
              <button className="primary-action" type="button" onClick={retry}>
                {state.status === 'interrupted'
                  ? 'Restart camera'
                  : 'Try again'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

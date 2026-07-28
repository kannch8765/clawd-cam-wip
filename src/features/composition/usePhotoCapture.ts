import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { CameraCaptureSource } from '../camera/cameraTypes';
import type {
  OverlayAssetDescriptor,
  OverlayTransform,
} from '../overlay/overlayTypes';
import { browserCompositionAdapter } from './captureAdapter';
import { composePhoto, freezeCaptureSnapshot } from './composePhoto';
import {
  CaptureError,
  type CaptureSnapshot,
  type CompositionAdapter,
  type PhotoCaptureResult,
} from './compositionTypes';

export type PhotoCaptureState =
  | { status: 'preparing' }
  | { status: 'ready' }
  | { status: 'capturing' }
  | {
      status: 'captured';
      result: PhotoCaptureResult;
      objectUrl: string;
    }
  | {
      status: 'error';
      phase: 'asset' | 'capture';
      error: CaptureError;
    };

interface UsePhotoCaptureInput {
  asset: OverlayAssetDescriptor;
  transform: OverlayTransform;
  stageRef: RefObject<HTMLElement | null>;
  getCameraCaptureSource(): CameraCaptureSource | null;
  isCameraCaptureSourceCurrent(source: CameraCaptureSource): boolean;
  adapter?: CompositionAdapter;
}

function toCaptureError(error: unknown): CaptureError {
  if (error instanceof CaptureError) {
    return error;
  }

  return new CaptureError(
    'unexpected',
    'ClawdCam could not compose this photo. Please try again.',
    error,
  );
}

function parseCssPixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function measureContentBox(element: HTMLElement): {
  width: number;
  height: number;
} {
  const style = getComputedStyle(element);
  const horizontalPadding =
    parseCssPixels(style.paddingLeft) + parseCssPixels(style.paddingRight);
  const verticalPadding =
    parseCssPixels(style.paddingTop) + parseCssPixels(style.paddingBottom);
  const rect = element.getBoundingClientRect();
  const horizontalBorder =
    parseCssPixels(style.borderLeftWidth) +
    parseCssPixels(style.borderRightWidth);
  const verticalBorder =
    parseCssPixels(style.borderTopWidth) +
    parseCssPixels(style.borderBottomWidth);
  const contentWidth = element.clientWidth
    ? element.clientWidth - horizontalPadding
    : rect.width - horizontalPadding - horizontalBorder;
  const contentHeight = element.clientHeight
    ? element.clientHeight - verticalPadding
    : rect.height - verticalPadding - verticalBorder;

  return {
    width: contentWidth,
    height: contentHeight,
  };
}

export function usePhotoCapture({
  asset,
  transform,
  stageRef,
  getCameraCaptureSource,
  isCameraCaptureSourceCurrent,
  adapter = browserCompositionAdapter,
}: UsePhotoCaptureInput) {
  const [state, setState] = useState<PhotoCaptureState>({
    status: 'preparing',
  });
  const [assetAttempt, setAssetAttempt] = useState(0);
  const mountedRef = useRef(false);
  const decodedImageRef = useRef<CanvasImageSource | null>(null);
  const assetLoadSessionRef = useRef(0);
  const captureSessionRef = useRef(0);
  const activeCaptureSessionRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeCurrentObjectUrl = useCallback(() => {
    const objectUrl = objectUrlRef.current;
    objectUrlRef.current = null;
    if (objectUrl) {
      adapter.revokeObjectURL(objectUrl);
    }
  }, [adapter]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      assetLoadSessionRef.current += 1;
      captureSessionRef.current += 1;
      activeCaptureSessionRef.current = null;
      revokeCurrentObjectUrl();
    };
  }, [revokeCurrentObjectUrl]);

  useEffect(() => {
    const loadSession = assetLoadSessionRef.current + 1;
    assetLoadSessionRef.current = loadSession;
    captureSessionRef.current += 1;
    activeCaptureSessionRef.current = null;
    decodedImageRef.current = null;
    revokeCurrentObjectUrl();
    queueMicrotask(() => {
      if (mountedRef.current && assetLoadSessionRef.current === loadSession) {
        setState({ status: 'preparing' });
      }
    });

    void Promise.resolve()
      .then(() => adapter.loadImage(asset))
      .then(
        (image) => {
          if (
            !mountedRef.current ||
            assetLoadSessionRef.current !== loadSession
          ) {
            return;
          }
          decodedImageRef.current = image;
          setState({ status: 'ready' });
        },
        (error: unknown) => {
          if (
            !mountedRef.current ||
            assetLoadSessionRef.current !== loadSession
          ) {
            return;
          }
          setState({
            status: 'error',
            phase: 'asset',
            error: toCaptureError(error),
          });
        },
      );
  }, [adapter, asset, assetAttempt, revokeCurrentObjectUrl]);

  const capture = useCallback(async (): Promise<void> => {
    if (activeCaptureSessionRef.current !== null) {
      return;
    }

    const image = decodedImageRef.current;
    const camera = getCameraCaptureSource();
    const stage = stageRef.current;

    if (!image || !camera || !stage) {
      if (mountedRef.current) {
        setState({
          status: 'error',
          phase: 'capture',
          error: new CaptureError(
            'camera-not-ready',
            'The camera, preview, and Clawd asset must all be ready before capture.',
          ),
        });
      }
      return;
    }

    const captureSession = captureSessionRef.current + 1;
    captureSessionRef.current = captureSession;
    activeCaptureSessionRef.current = captureSession;

    let snapshot: CaptureSnapshot;
    try {
      const preview = measureContentBox(stage);
      snapshot = freezeCaptureSnapshot({
        camera,
        previewWidth: preview.width,
        previewHeight: preview.height,
        overlayAsset: asset,
        overlayTransform: transform,
        capturedAt: adapter.now(),
      });
    } catch (error) {
      activeCaptureSessionRef.current = null;
      if (mountedRef.current) {
        setState({
          status: 'error',
          phase: 'capture',
          error: toCaptureError(error),
        });
      }
      return;
    }

    setState({ status: 'capturing' });

    try {
      const result = await composePhoto({
        snapshot,
        image,
        adapter,
        isSourceCurrent: isCameraCaptureSourceCurrent,
      });

      if (
        !mountedRef.current ||
        captureSessionRef.current !== captureSession ||
        activeCaptureSessionRef.current !== captureSession
      ) {
        return;
      }

      const objectUrl = adapter.createObjectURL(result.blob);
      revokeCurrentObjectUrl();
      objectUrlRef.current = objectUrl;
      setState({ status: 'captured', result, objectUrl });
    } catch (error) {
      if (
        mountedRef.current &&
        captureSessionRef.current === captureSession &&
        activeCaptureSessionRef.current === captureSession
      ) {
        setState({
          status: 'error',
          phase: 'capture',
          error: toCaptureError(error),
        });
      }
    } finally {
      if (activeCaptureSessionRef.current === captureSession) {
        activeCaptureSessionRef.current = null;
      }
    }
  }, [
    adapter,
    asset,
    getCameraCaptureSource,
    isCameraCaptureSourceCurrent,
    revokeCurrentObjectUrl,
    stageRef,
    transform,
  ]);

  const retake = useCallback(() => {
    captureSessionRef.current += 1;
    activeCaptureSessionRef.current = null;
    revokeCurrentObjectUrl();
    setState(
      decodedImageRef.current
        ? { status: 'ready' }
        : {
            status: 'error',
            phase: 'asset',
            error: new CaptureError(
              'asset-decode-failed',
              'The Clawd capture asset must be loaded again.',
            ),
          },
    );
  }, [revokeCurrentObjectUrl]);

  const retryAsset = useCallback(() => {
    setAssetAttempt((attempt) => attempt + 1);
  }, []);

  const isAssetReady =
    state.status === 'ready' ||
    state.status === 'capturing' ||
    state.status === 'captured' ||
    (state.status === 'error' && state.phase === 'capture');

  return {
    state,
    capture,
    retake,
    retryAsset,
    isAssetReady,
  };
}

import type { OverlayAssetDescriptor } from '../overlay/overlayTypes';
import { CaptureError, type CompositionAdapter } from './compositionTypes';

export const CAPTURE_MIME_TYPE = 'image/jpeg';
export const CAPTURE_FALLBACK_MIME_TYPE = 'image/png';
export const CAPTURE_QUALITY = 0.92;
export const CAPTURE_BLOB_TIMEOUT_MS = 5_000;
export const CAPTURE_ASSET_DECODE_TIMEOUT_MS = 10_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  createError: () => CaptureError,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(createError());
    }, timeoutMs);

    void promise.then(
      (value) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function waitForImageLoad(
  image: HTMLImageElement,
  source: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const handleLoad = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(
        new CaptureError(
          'asset-decode-failed',
          'The Clawd capture asset could not be loaded.',
        ),
      );
    };
    const cleanup = () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };

    image.addEventListener('load', handleLoad, { once: true });
    image.addEventListener('error', handleError, { once: true });
    image.src = source;
  });
}

export async function loadDecodedImage(
  asset: OverlayAssetDescriptor,
): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';

  let decodePromise: Promise<void>;
  if (typeof image.decode === 'function') {
    image.src = asset.previewAssetUrl;
    decodePromise = image.decode();
  } else {
    decodePromise = waitForImageLoad(image, asset.previewAssetUrl);
  }

  try {
    await withTimeout(
      decodePromise,
      CAPTURE_ASSET_DECODE_TIMEOUT_MS,
      () =>
        new CaptureError(
          'asset-decode-timeout',
          'The Clawd capture asset took too long to decode.',
        ),
    );
  } catch (error) {
    if (error instanceof CaptureError) {
      throw error;
    }
    throw new CaptureError(
      'asset-decode-failed',
      'The Clawd capture asset could not be decoded.',
      error,
    );
  }

  if (
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0 ||
    image.naturalWidth !== asset.intrinsicWidth ||
    image.naturalHeight !== asset.intrinsicHeight
  ) {
    throw new CaptureError(
      'asset-decode-failed',
      'The decoded Clawd capture asset dimensions do not match its descriptor.',
    );
  }

  return image;
}

export function createCanvasSurface(
  width: number,
  height: number,
): ReturnType<CompositionAdapter['createCanvas']> {
  if (typeof document === 'undefined') {
    throw new CaptureError(
      'canvas-unavailable',
      'Canvas is unavailable in this environment.',
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new CaptureError(
      'context-unavailable',
      'A Canvas 2D context could not be created.',
    );
  }

  return { canvas, context };
}

function encodeCanvasOnce(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return withTimeout(
    new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new CaptureError(
                  'blob-failed',
                  'Canvas returned an empty capture Blob.',
                ),
              );
              return;
            }
            resolve(blob);
          },
          mimeType,
          quality,
        );
      } catch (error) {
        reject(
          new CaptureError(
            'blob-unsupported',
            `Canvas could not encode ${mimeType}.`,
            error,
          ),
        );
      }
    }),
    CAPTURE_BLOB_TIMEOUT_MS,
    () =>
      new CaptureError(
        'blob-timeout',
        'Canvas capture encoding took too long.',
      ),
  );
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  try {
    return await encodeCanvasOnce(canvas, mimeType, quality);
  } catch (error) {
    if (
      error instanceof CaptureError &&
      error.code === 'blob-unsupported' &&
      mimeType !== CAPTURE_FALLBACK_MIME_TYPE
    ) {
      return encodeCanvasOnce(canvas, CAPTURE_FALLBACK_MIME_TYPE, quality);
    }
    throw error;
  }
}

export const browserCompositionAdapter: CompositionAdapter = {
  loadImage: loadDecodedImage,
  createCanvas: createCanvasSurface,
  canvasToBlob,
  createObjectURL(blob) {
    return URL.createObjectURL(blob);
  },
  revokeObjectURL(url) {
    URL.revokeObjectURL(url);
  },
  now() {
    return new Date();
  },
};

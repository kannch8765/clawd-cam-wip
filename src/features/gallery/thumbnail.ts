import { GalleryStorageError } from './galleryTypes';

export const THUMBNAIL_MAX_EDGE = 320;
export const THUMBNAIL_MIME_TYPE = 'image/png';
export const THUMBNAIL_QUALITY = 1;
export const THUMBNAIL_DEADLINE_MS = 5_000;

export interface DecodedThumbnailImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release(): void;
}

export interface ThumbnailCanvasSurface {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
}

export interface ThumbnailAdapter {
  decodeImage(blob: Blob): Promise<DecodedThumbnailImage>;
  createCanvas(width: number, height: number): ThumbnailCanvasSurface;
  canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number,
  ): Promise<Blob | null>;
}

function thumbnailError(message: string, cause?: unknown): GalleryStorageError {
  return new GalleryStorageError('thumbnail-failed', message, cause);
}

function decodeHtmlImage(blob: Blob): Promise<DecodedThumbnailImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    let settled = false;

    const release = () => {
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        release();
        reject(thumbnailError('The captured image has invalid dimensions.'));
        return;
      }
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release,
      });
    };
    image.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      release();
      reject(thumbnailError('ClawdCam could not decode the captured photo.'));
    };
    image.src = objectUrl;

    if (typeof image.decode === 'function') {
      void image.decode().catch(() => {
        // The load/error events remain the normalized completion boundary.
      });
    }
  });
}

async function decodeBrowserImage(blob: Blob): Promise<DecodedThumbnailImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      if (bitmap.width <= 0 || bitmap.height <= 0) {
        bitmap.close();
        throw thumbnailError('The captured image has invalid dimensions.');
      }

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch (error) {
      if (error instanceof GalleryStorageError) {
        throw error;
      }
      // Some WebKit versions expose createImageBitmap but reject particular
      // Blob codecs. The HTMLImageElement path is the compatibility fallback.
    }
  }

  return decodeHtmlImage(blob);
}

function browserCanvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(resolve, mimeType, quality);
    } catch (error) {
      reject(error);
    }
  });
}

export const browserThumbnailAdapter: ThumbnailAdapter = {
  decodeImage: decodeBrowserImage,
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return {
      canvas,
      context: canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false,
      }),
    };
  },
  canvasToBlob: browserCanvasToBlob,
};

export function calculateThumbnailSize(
  width: number,
  height: number,
  maxEdge = THUMBNAIL_MAX_EDGE,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(maxEdge) ||
    maxEdge <= 0
  ) {
    throw thumbnailError('The captured image has invalid dimensions.');
  }

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function withDeadline<T>(
  operation: Promise<T>,
  deadlineMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () =>
        reject(
          thumbnailError(
            'Thumbnail generation timed out. Please try saving again.',
          ),
        ),
      deadlineMs,
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generateThumbnail(
  photoBlob: Blob,
  adapter: ThumbnailAdapter = browserThumbnailAdapter,
  deadlineMs = THUMBNAIL_DEADLINE_MS,
): Promise<Blob> {
  if (!(photoBlob instanceof Blob) || photoBlob.size === 0) {
    throw thumbnailError('The captured photo Blob is empty or unavailable.');
  }

  return withDeadline(
    (async () => {
      let decoded: DecodedThumbnailImage;
      try {
        decoded = await adapter.decodeImage(photoBlob);
      } catch (error) {
        if (error instanceof GalleryStorageError) {
          throw error;
        }
        throw thumbnailError(
          'ClawdCam could not decode the captured photo.',
          error,
        );
      }

      try {
        const size = calculateThumbnailSize(decoded.width, decoded.height);
        const surface = adapter.createCanvas(size.width, size.height);
        if (!surface.context) {
          throw thumbnailError(
            'This browser could not create a thumbnail canvas context.',
          );
        }

        surface.context.save();
        try {
          surface.context.globalCompositeOperation = 'copy';
          surface.context.drawImage(
            decoded.source,
            0,
            0,
            size.width,
            size.height,
          );
        } finally {
          surface.context.restore();
        }

        let thumbnail: Blob | null;
        try {
          thumbnail = await adapter.canvasToBlob(
            surface.canvas,
            THUMBNAIL_MIME_TYPE,
            THUMBNAIL_QUALITY,
          );
        } catch (error) {
          throw thumbnailError(
            'ClawdCam could not encode the photo thumbnail.',
            error,
          );
        }

        if (!thumbnail || thumbnail.size === 0) {
          throw thumbnailError(
            'The browser returned an empty photo thumbnail.',
          );
        }
        if (thumbnail.type && thumbnail.type !== THUMBNAIL_MIME_TYPE) {
          throw thumbnailError(
            'The browser did not encode the requested PNG thumbnail.',
          );
        }
        return thumbnail;
      } finally {
        decoded.release();
      }
    })(),
    deadlineMs,
  );
}

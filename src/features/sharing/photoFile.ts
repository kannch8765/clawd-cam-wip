import type { PhotoCaptureResult } from '../composition/compositionTypes';
import type { StoredPhotoRecord } from '../gallery/galleryTypes';
import {
  PhotoActionError,
  type ShareablePhoto,
} from './sharingTypes';

const MIME_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface PhotoFileFactory {
  supportsFile(): boolean;
  createFile(
    blob: Blob,
    filename: string,
    options: FilePropertyBag,
  ): File;
}

export interface PreparedPhoto {
  readonly photo: ShareablePhoto;
  readonly filename: string;
  readonly mimeType: string;
  readonly file: File | null;
  readonly fileError: PhotoActionError | null;
}

function normalizeMimeType(value: string): string {
  return value.trim().toLowerCase();
}

function hasUnsafeMimeCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || code === 0x2028 || code === 0x2029) {
      return true;
    }
  }
  return false;
}

export function resolvePhotoMimeType(photo: ShareablePhoto): string {
  const blobMimeType = normalizeMimeType(photo.blob.type);
  const metadataMimeType = normalizeMimeType(photo.mimeType);

  if (
    hasUnsafeMimeCharacter(blobMimeType) ||
    hasUnsafeMimeCharacter(metadataMimeType)
  ) {
    throw new PhotoActionError(
      'invalid-photo',
      'This photo has invalid file type metadata.',
    );
  }

  if (
    blobMimeType.length > 0 &&
    metadataMimeType.length > 0 &&
    blobMimeType !== metadataMimeType
  ) {
    throw new PhotoActionError(
      'mime-mismatch',
      'This photo has conflicting file type metadata and cannot be shared or downloaded safely.',
    );
  }

  return blobMimeType || metadataMimeType || 'application/octet-stream';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildPhotoFilename(
  capturedAt: number,
  mimeType: string,
): string {
  if (!Number.isFinite(capturedAt)) {
    throw new PhotoActionError(
      'invalid-photo',
      'This photo has an invalid capture time.',
    );
  }

  const date = new Date(capturedAt);
  if (!Number.isFinite(date.getTime())) {
    throw new PhotoActionError(
      'invalid-photo',
      'This photo has an invalid capture time.',
    );
  }

  const extension = MIME_EXTENSIONS[normalizeMimeType(mimeType)] ?? 'bin';
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `clawdcam-${datePart}-${timePart}.${extension}`;
}

export function shareablePhotoFromCaptureResult(
  result: PhotoCaptureResult,
): ShareablePhoto {
  return {
    blob: result.blob,
    mimeType: result.mimeType,
    width: result.width,
    height: result.height,
    capturedAt: Date.parse(result.capturedAt),
    facingMode: result.facingMode,
    overlayAssetId: result.overlayAssetId,
  };
}

export function shareablePhotoFromStoredRecord(
  record: StoredPhotoRecord,
): ShareablePhoto {
  return {
    blob: record.photoBlob,
    mimeType: record.mimeType,
    width: record.width,
    height: record.height,
    capturedAt: record.capturedAt,
    facingMode: record.facingMode,
    overlayAssetId: record.overlayAssetId,
  };
}

export function preparePhoto(
  photo: ShareablePhoto,
  factory: PhotoFileFactory,
): PreparedPhoto {
  const mimeType = resolvePhotoMimeType(photo);
  const filename = buildPhotoFilename(photo.capturedAt, mimeType);

  if (!factory.supportsFile()) {
    return {
      photo,
      filename,
      mimeType,
      file: null,
      fileError: new PhotoActionError(
        'file-unavailable',
        'This browser cannot construct image files for system sharing.',
      ),
    };
  }

  try {
    return {
      photo,
      filename,
      mimeType,
      file: factory.createFile(photo.blob, filename, {
        type: mimeType,
        lastModified: photo.capturedAt,
      }),
      fileError: null,
    };
  } catch (error) {
    return {
      photo,
      filename,
      mimeType,
      file: null,
      fileError: new PhotoActionError(
        'file-unavailable',
        'This browser could not prepare the image file for system sharing.',
        error,
      ),
    };
  }
}

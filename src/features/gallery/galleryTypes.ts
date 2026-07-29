import type { CameraFacingMode } from '../camera/cameraTypes';
import type { PhotoCaptureResult } from '../composition/compositionTypes';
import type { OverlayTransform } from '../overlay/overlayTypes';

export const STORED_PHOTO_SCHEMA_VERSION = 1;

export type GalleryStorageErrorCode =
  | 'unsupported'
  | 'unavailable'
  | 'quota-exceeded'
  | 'write-failed'
  | 'read-failed'
  | 'delete-failed'
  | 'corrupt-record'
  | 'thumbnail-failed';

export class GalleryStorageError extends Error {
  readonly code: GalleryStorageErrorCode;
  readonly cause?: unknown;

  constructor(code: GalleryStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'GalleryStorageError';
    this.code = code;
    this.cause = cause;
  }
}

export interface StoredPhotoRecord {
  id: string;
  schemaVersion: number;
  photoBlob: Blob;
  thumbnailBlob: Blob;
  capturedAt: number;
  width: number;
  height: number;
  mimeType: string;
  facingMode: CameraFacingMode;
  mirrored: boolean;
  overlayAssetId: string;
  overlayTransform: OverlayTransform;
}

export interface StoredPhotoSummary {
  id: string;
  schemaVersion: number;
  thumbnailBlob: Blob;
  capturedAt: number;
  width: number;
  height: number;
  mimeType: string;
  facingMode: CameraFacingMode;
  mirrored: boolean;
  overlayAssetId: string;
}

export interface GalleryRepository {
  savePhoto(record: StoredPhotoRecord): Promise<void>;
  listPhotos(): Promise<StoredPhotoSummary[]>;
  getPhoto(id: string): Promise<StoredPhotoRecord | undefined>;
  deletePhoto(id: string): Promise<void>;
}

export interface StoredPhotoIdFactory {
  createId(): string;
}

export const browserStoredPhotoIdFactory: StoredPhotoIdFactory = {
  createId() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }

    const random = Math.random().toString(36).slice(2);
    return `photo-${Date.now().toString(36)}-${random}`;
  },
};

export function cloneOverlayTransform(
  transform: OverlayTransform,
): OverlayTransform {
  return {
    x: transform.x,
    y: transform.y,
    scale: transform.scale,
    rotation: transform.rotation,
  };
}

export function createStoredPhotoRecord(
  result: PhotoCaptureResult,
  thumbnailBlob: Blob,
  idFactory: StoredPhotoIdFactory = browserStoredPhotoIdFactory,
): StoredPhotoRecord {
  const capturedAt = Date.parse(result.capturedAt);
  if (!isValidCapturedAt(capturedAt)) {
    throw new GalleryStorageError(
      'corrupt-record',
      'The captured photo timestamp is invalid and cannot be saved.',
    );
  }

  return {
    id: idFactory.createId(),
    schemaVersion: STORED_PHOTO_SCHEMA_VERSION,
    photoBlob: result.blob,
    thumbnailBlob,
    capturedAt,
    width: result.width,
    height: result.height,
    mimeType: result.mimeType,
    facingMode: result.facingMode,
    mirrored: result.mirrored,
    overlayAssetId: result.overlayAssetId,
    overlayTransform: cloneOverlayTransform(result.overlayTransform),
  };
}

export function toStoredPhotoSummary(
  record: StoredPhotoRecord,
): StoredPhotoSummary {
  return {
    id: record.id,
    schemaVersion: record.schemaVersion,
    thumbnailBlob: record.thumbnailBlob,
    capturedAt: record.capturedAt,
    width: record.width,
    height: record.height,
    mimeType: record.mimeType,
    facingMode: record.facingMode,
    mirrored: record.mirrored,
    overlayAssetId: record.overlayAssetId,
  };
}

function isBlobValue(value: unknown): value is Blob {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Blob>;
  return (
    typeof candidate.size === 'number' &&
    Number.isFinite(candidate.size) &&
    candidate.size >= 0 &&
    typeof candidate.type === 'string' &&
    typeof candidate.slice === 'function' &&
    typeof candidate.arrayBuffer === 'function'
  );
}

export function toValidCapturedAtDate(value: unknown): Date | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function isValidCapturedAt(value: unknown): value is number {
  return toValidCapturedAtDate(value) !== null;
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isOverlayTransform(value: unknown): value is OverlayTransform {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OverlayTransform>;
  return (
    typeof candidate.x === 'number' &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === 'number' &&
    Number.isFinite(candidate.y) &&
    typeof candidate.scale === 'number' &&
    Number.isFinite(candidate.scale) &&
    candidate.scale > 0 &&
    typeof candidate.rotation === 'number' &&
    Number.isFinite(candidate.rotation)
  );
}

export function isStoredPhotoRecord(
  value: unknown,
): value is StoredPhotoRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredPhotoRecord>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    candidate.schemaVersion === STORED_PHOTO_SCHEMA_VERSION &&
    isBlobValue(candidate.photoBlob) &&
    isBlobValue(candidate.thumbnailBlob) &&
    isValidCapturedAt(candidate.capturedAt) &&
    isFinitePositive(candidate.width) &&
    isFinitePositive(candidate.height) &&
    typeof candidate.mimeType === 'string' &&
    candidate.mimeType.length > 0 &&
    (candidate.facingMode === 'user' ||
      candidate.facingMode === 'environment') &&
    typeof candidate.mirrored === 'boolean' &&
    typeof candidate.overlayAssetId === 'string' &&
    candidate.overlayAssetId.length > 0 &&
    isOverlayTransform(candidate.overlayTransform)
  );
}

export function isStoredPhotoSummary(
  value: unknown,
): value is StoredPhotoSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredPhotoSummary>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    candidate.schemaVersion === STORED_PHOTO_SCHEMA_VERSION &&
    isBlobValue(candidate.thumbnailBlob) &&
    isValidCapturedAt(candidate.capturedAt) &&
    isFinitePositive(candidate.width) &&
    isFinitePositive(candidate.height) &&
    typeof candidate.mimeType === 'string' &&
    candidate.mimeType.length > 0 &&
    (candidate.facingMode === 'user' ||
      candidate.facingMode === 'environment') &&
    typeof candidate.mirrored === 'boolean' &&
    typeof candidate.overlayAssetId === 'string' &&
    candidate.overlayAssetId.length > 0
  );
}

import type { CameraFacingMode } from '../camera/cameraTypes';

export interface ShareablePhoto {
  readonly blob: Blob;
  readonly mimeType: string;
  readonly width: number;
  readonly height: number;
  readonly capturedAt: number;
  readonly facingMode: CameraFacingMode;
  readonly overlayAssetId: string;
}

export type FileShareCapabilityStatus =
  | 'photo-invalid'
  | 'unsupported'
  | 'text-only'
  | 'file-share-supported'
  | 'file-rejected';

export interface FileShareCapability {
  status: FileShareCapabilityStatus;
}

export type PhotoActionErrorCode =
  | 'invalid-photo'
  | 'file-unavailable'
  | 'mime-mismatch'
  | 'not-allowed'
  | 'invalid-state'
  | 'file-rejected'
  | 'share-failed'
  | 'download-failed';

export class PhotoActionError extends Error {
  readonly code: PhotoActionErrorCode;
  readonly cause?: unknown;

  constructor(code: PhotoActionErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PhotoActionError';
    this.code = code;
    this.cause = cause;
  }
}

export type PhotoActionState =
  | { status: 'idle' }
  | { status: 'sharing' }
  | { status: 'shared' }
  | { status: 'cancelled' }
  | { status: 'downloading' }
  | { status: 'download-started' }
  | { status: 'error'; error: PhotoActionError };

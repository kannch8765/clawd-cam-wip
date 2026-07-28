export type CameraFacingMode = 'user' | 'environment';

export type CameraErrorCode =
  | 'permission-denied'
  | 'unsupported'
  | 'unavailable'
  | 'interrupted'
  | 'constraints'
  | 'runtime-error';

export class CameraError extends Error {
  readonly code: CameraErrorCode;
  readonly cause?: unknown;

  constructor(code: CameraErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'CameraError';
    this.code = code;
    this.cause = cause;
  }
}

export interface CameraDevice {
  deviceId: string;
  groupId: string;
  label: string;
}

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface CameraAdapter {
  requestStream(facingMode: CameraFacingMode): Promise<MediaStream>;
  enumerateVideoInputs(): Promise<CameraDevice[]>;
  stopStream(stream: MediaStream): void;
  waitForVideoReady(
    video: HTMLVideoElement,
    signal: AbortSignal,
  ): Promise<VideoDimensions>;
}

interface CameraStateBase {
  facingMode: CameraFacingMode;
}

export type CameraState =
  | (CameraStateBase & { status: 'idle' })
  | (CameraStateBase & { status: 'requesting' })
  | (CameraStateBase & {
      status: 'ready';
      deviceCount: number;
      dimensions: VideoDimensions;
    })
  | (CameraStateBase & {
      status: 'permission-denied';
      error: CameraError;
    })
  | (CameraStateBase & { status: 'unsupported'; error: CameraError })
  | (CameraStateBase & { status: 'unavailable'; error: CameraError })
  | (CameraStateBase & { status: 'interrupted'; error: CameraError })
  | (CameraStateBase & { status: 'runtime-error'; error: CameraError });

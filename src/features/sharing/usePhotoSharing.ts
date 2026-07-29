import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { preparePhoto, type PreparedPhoto } from './photoFile';
import type { SharingAdapter } from './sharingAdapter';
import {
  PhotoActionError,
  type FileShareCapability,
  type PhotoActionState,
  type ShareablePhoto,
} from './sharingTypes';

interface PreparedPhotoSuccess {
  ok: true;
  value: PreparedPhoto;
}

interface PreparedPhotoFailure {
  ok: false;
  error: PhotoActionError;
}

type PreparedPhotoResult = PreparedPhotoSuccess | PreparedPhotoFailure;

export interface PhotoSharingController {
  readonly state: PhotoActionState;
  readonly capability: FileShareCapability;
  readonly isBusy: boolean;
  readonly canDownload: boolean;
  readonly filename: string | null;
  share(): Promise<void>;
  download(): void;
}

export function detectFileShareCapability(
  adapter: SharingAdapter,
  prepared: PreparedPhotoResult,
): FileShareCapability {
  if (!prepared.ok) {
    return { status: 'photo-invalid' };
  }

  if (!adapter.hasShare()) {
    return { status: 'unsupported' };
  }

  if (!adapter.hasCanShare() || !prepared.value.file) {
    return { status: 'text-only' };
  }

  try {
    return adapter.canShareFile(prepared.value.file)
      ? { status: 'file-share-supported' }
      : { status: 'file-rejected' };
  } catch {
    return { status: 'file-rejected' };
  }
}

function errorName(error: unknown): string | null {
  if (error instanceof DOMException || error instanceof Error) {
    return error.name;
  }

  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    typeof error.name === 'string'
  ) {
    return error.name;
  }

  return null;
}

export function classifyShareFailure(
  error: unknown,
): { cancelled: true } | { cancelled: false; error: PhotoActionError } {
  switch (errorName(error)) {
    case 'AbortError':
      return { cancelled: true };
    case 'NotAllowedError':
      return {
        cancelled: false,
        error: new PhotoActionError(
          'not-allowed',
          'The browser blocked sharing. Tap Share directly and check this site’s permissions.',
          error,
        ),
      };
    case 'InvalidStateError':
      return {
        cancelled: false,
        error: new PhotoActionError(
          'invalid-state',
          'The system share sheet is not available right now. Try again in a moment.',
          error,
        ),
      };
    case 'DataError':
    case 'TypeError':
    case 'NotSupportedError':
      return {
        cancelled: false,
        error: new PhotoActionError(
          'file-rejected',
          'This browser rejected the image file for sharing. Download is still available.',
          error,
        ),
      };
    default:
      return {
        cancelled: false,
        error: new PhotoActionError(
          'share-failed',
          'ClawdCam could not open the system share sheet. Download is still available.',
          error,
        ),
      };
  }
}

function prepare(
  photo: ShareablePhoto,
  adapter: SharingAdapter,
): PreparedPhotoResult {
  try {
    return { ok: true, value: preparePhoto(photo, adapter) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof PhotoActionError
          ? error
          : new PhotoActionError(
              'invalid-photo',
              'This photo cannot be prepared for sharing or download.',
              error,
            ),
    };
  }
}

export function usePhotoSharing(
  photo: ShareablePhoto,
  adapter: SharingAdapter,
): PhotoSharingController {
  const prepared = useMemo(() => prepare(photo, adapter), [adapter, photo]);
  const capability = useMemo(
    () => detectFileShareCapability(adapter, prepared),
    [adapter, prepared],
  );
  const [state, setState] = useState<PhotoActionState>({ status: 'idle' });
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const operationRef = useRef<'share' | 'download' | null>(null);
  const inputRef = useRef({ adapter, photo });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      operationRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (
      inputRef.current.adapter === adapter &&
      inputRef.current.photo === photo
    ) {
      return;
    }

    inputRef.current = { adapter, photo };
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    operationRef.current = null;
    queueMicrotask(() => {
      if (mountedRef.current && generationRef.current === generation) {
        setState({ status: 'idle' });
      }
    });
  }, [adapter, photo]);

  const share = useCallback(async (): Promise<void> => {
    if (operationRef.current) {
      return;
    }

    if (!prepared.ok) {
      if (mountedRef.current) {
        setState({ status: 'error', error: prepared.error });
      }
      return;
    }

    if (capability.status !== 'file-share-supported' || !prepared.value.file) {
      const error =
        prepared.value.fileError ??
        new PhotoActionError(
          'file-rejected',
          'File sharing is unavailable here. Download is still available.',
        );
      if (mountedRef.current) {
        setState({ status: 'error', error });
      }
      return;
    }

    operationRef.current = 'share';
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const operationInput = inputRef.current;
    if (mountedRef.current) {
      setState({ status: 'sharing' });
    }

    try {
      const request = adapter.shareFile(prepared.value.file);
      await request;
      if (
        mountedRef.current &&
        generationRef.current === generation &&
        inputRef.current === operationInput
      ) {
        setState({ status: 'shared' });
      }
    } catch (error) {
      if (
        !mountedRef.current ||
        generationRef.current !== generation ||
        inputRef.current !== operationInput
      ) {
        return;
      }
      const classified = classifyShareFailure(error);
      if (classified.cancelled) {
        setState({ status: 'cancelled' });
      } else {
        setState({ status: 'error', error: classified.error });
      }
    } finally {
      if (
        generationRef.current === generation &&
        inputRef.current === operationInput
      ) {
        operationRef.current = null;
      }
    }
  }, [adapter, capability.status, prepared]);

  const download = useCallback((): void => {
    if (operationRef.current) {
      return;
    }

    if (!prepared.ok) {
      if (mountedRef.current) {
        setState({ status: 'error', error: prepared.error });
      }
      return;
    }

    operationRef.current = 'download';
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const operationInput = inputRef.current;
    if (mountedRef.current) {
      setState({ status: 'downloading' });
    }

    try {
      adapter.downloadBlob(prepared.value.photo.blob, prepared.value.filename);
      if (
        mountedRef.current &&
        generationRef.current === generation &&
        inputRef.current === operationInput
      ) {
        setState({ status: 'download-started' });
      }
    } catch (error) {
      if (
        mountedRef.current &&
        generationRef.current === generation &&
        inputRef.current === operationInput
      ) {
        setState({
          status: 'error',
          error: new PhotoActionError(
            'download-failed',
            'ClawdCam could not start the download. The photo is still available here.',
            error,
          ),
        });
      }
    } finally {
      if (
        generationRef.current === generation &&
        inputRef.current === operationInput
      ) {
        operationRef.current = null;
      }
    }
  }, [adapter, prepared]);

  const presentedState: PhotoActionState = prepared.ok
    ? state
    : { status: 'error', error: prepared.error };

  return {
    state: presentedState,
    capability,
    isBusy:
      presentedState.status === 'sharing' ||
      presentedState.status === 'downloading',
    canDownload: prepared.ok,
    filename: prepared.ok ? prepared.value.filename : null,
    share,
    download,
  };
}

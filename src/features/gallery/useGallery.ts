import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhotoCaptureResult } from '../composition/compositionTypes';
import {
  createStoredPhotoRecord,
  GalleryStorageError,
  type GalleryRepository,
  type StoredPhotoIdFactory,
  type StoredPhotoRecord,
  type StoredPhotoSummary,
} from './galleryTypes';

export type GalleryListState =
  | { status: 'loading' }
  | { status: 'error'; error: GalleryStorageError }
  | { status: 'ready'; photos: StoredPhotoSummary[] };

export type GalleryDetailState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; error: GalleryStorageError }
  | { status: 'ready'; photo: StoredPhotoRecord };

export type PhotoSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; id: string }
  | { status: 'error'; error: GalleryStorageError };

function normalizeError(
  error: unknown,
  fallbackMessage: string,
): GalleryStorageError {
  if (error instanceof GalleryStorageError) {
    return error;
  }
  return new GalleryStorageError('unavailable', fallbackMessage, error);
}

export function useBlobObjectUrl(blob: Blob | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const nextObjectUrl = blob ? URL.createObjectURL(blob) : null;

    queueMicrotask(() => {
      if (active) {
        setObjectUrl(nextObjectUrl);
      }
    });

    return () => {
      active = false;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [blob]);

  return objectUrl;
}

export function useGallery(repository: GalleryRepository) {
  const [state, setState] = useState<GalleryListState>({ status: 'loading' });
  const mountedRef = useRef(false);
  const generationRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    if (mountedRef.current) {
      setState({ status: 'loading' });
    }

    try {
      const photos = await repository.listPhotos();
      if (mountedRef.current && generationRef.current === generation) {
        setState({ status: 'ready', photos });
      }
    } catch (error) {
      if (mountedRef.current && generationRef.current === generation) {
        setState({
          status: 'error',
          error: normalizeError(
            error,
            'ClawdCam could not load the local gallery.',
          ),
        });
      }
    }
  }, [repository]);

  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => {
      if (mountedRef.current) {
        void reload();
      }
    });
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, [reload]);

  return { state, reload };
}

export function useGalleryDetail(repository: GalleryRepository, id: string) {
  const [state, setState] = useState<GalleryDetailState>({ status: 'loading' });
  const mountedRef = useRef(false);
  const generationRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    if (mountedRef.current) {
      setState({ status: 'loading' });
    }

    try {
      const photo = await repository.getPhoto(id);
      if (!mountedRef.current || generationRef.current !== generation) {
        return;
      }
      setState(photo ? { status: 'ready', photo } : { status: 'missing' });
    } catch (error) {
      if (mountedRef.current && generationRef.current === generation) {
        setState({
          status: 'error',
          error: normalizeError(error, 'ClawdCam could not load this photo.'),
        });
      }
    }
  }, [id, repository]);

  const invalidate = useCallback(() => {
    generationRef.current += 1;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => {
      if (mountedRef.current) {
        void reload();
      }
    });
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, [reload]);

  return { state, reload, invalidate };
}

interface UseSavePhotoInput {
  result: PhotoCaptureResult;
  repository: GalleryRepository;
  createThumbnail(photoBlob: Blob): Promise<Blob>;
  idFactory: StoredPhotoIdFactory;
}

export function useSavePhoto({
  result,
  repository,
  createThumbnail,
  idFactory,
}: UseSavePhotoInput) {
  const [state, setState] = useState<PhotoSaveState>({ status: 'idle' });
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const inFlightRef = useRef(false);
  const savedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    inFlightRef.current = false;
    savedRef.current = false;
    queueMicrotask(() => {
      if (mountedRef.current && generationRef.current === generation) {
        setState({ status: 'idle' });
      }
    });
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, [result]);

  const save = useCallback(async (): Promise<void> => {
    if (inFlightRef.current || savedRef.current) {
      return;
    }

    inFlightRef.current = true;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const id = idFactory.createId();
    if (mountedRef.current) {
      setState({ status: 'saving' });
    }

    try {
      const thumbnailBlob = await createThumbnail(result.blob);
      const record = createStoredPhotoRecord(result, thumbnailBlob, {
        createId: () => id,
      });
      await repository.savePhoto(record);

      if (mountedRef.current && generationRef.current === generation) {
        savedRef.current = true;
        setState({ status: 'saved', id });
      }
    } catch (error) {
      if (mountedRef.current && generationRef.current === generation) {
        setState({
          status: 'error',
          error: normalizeError(error, 'ClawdCam could not save this photo.'),
        });
      }
    } finally {
      if (generationRef.current === generation) {
        inFlightRef.current = false;
      }
    }
  }, [createThumbnail, idFactory, repository, result]);

  return { state, save };
}

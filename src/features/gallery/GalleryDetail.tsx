import { useEffect, useRef, useState } from 'react';
import type { GalleryRepository, StoredPhotoRecord } from './galleryTypes';
import { GalleryStorageError } from './galleryTypes';
import { useBlobObjectUrl, useGalleryDetail } from './useGallery';

interface GalleryDetailProps {
  id: string;
  repository: GalleryRepository;
  onBack(): void;
  onDeleted(): void;
}

function formatCapturedAt(capturedAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(capturedAt));
}

function DetailPhoto({ photo }: { photo: StoredPhotoRecord }) {
  const objectUrl = useBlobObjectUrl(photo.photoBlob);
  return objectUrl ? (
    <img
      className="gallery-detail-image"
      src={objectUrl}
      alt="Saved Clawd composition"
    />
  ) : (
    <p role="status">Preparing saved photo…</p>
  );
}

export function GalleryDetail({
  id,
  repository,
  onBack,
  onDeleted,
}: GalleryDetailProps) {
  const { state, reload, invalidate } = useGalleryDetail(repository, id);
  const [deleteError, setDeleteError] = useState<GalleryStorageError | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const deletePhoto = async () => {
    if (deletingRef.current) {
      return;
    }
    if (!window.confirm('Delete this Clawd photo from this device?')) {
      return;
    }

    deletingRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await repository.deletePhoto(id);
      invalidate();
      onDeleted();
    } catch (error) {
      const normalized =
        error instanceof GalleryStorageError
          ? error
          : new GalleryStorageError(
              'delete-failed',
              'ClawdCam could not delete this photo.',
              error,
            );
      if (mountedRef.current) {
        setDeleteError(normalized);
      }
    } finally {
      deletingRef.current = false;
      if (mountedRef.current) {
        setIsDeleting(false);
      }
    }
  };

  if (state.status === 'loading') {
    return (
      <section
        className="gallery-card"
        aria-labelledby="gallery-detail-heading"
      >
        <button className="secondary-action" type="button" onClick={onBack}>
          Back to gallery
        </button>
        <h2 id="gallery-detail-heading">Saved photo</h2>
        <p role="status">Loading full-size photo…</p>
      </section>
    );
  }

  if (state.status === 'missing') {
    return (
      <section
        className="gallery-card"
        aria-labelledby="gallery-detail-heading"
      >
        <h2 id="gallery-detail-heading">Photo not found</h2>
        <p>This photo is no longer stored on this device.</p>
        <button className="primary-action" type="button" onClick={onBack}>
          Back to gallery
        </button>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section
        className="gallery-card"
        aria-labelledby="gallery-detail-heading"
      >
        <h2 id="gallery-detail-heading">Saved photo unavailable</h2>
        <div className="gallery-error" role="alert">
          <p>{state.error.message}</p>
        </div>
        <div className="gallery-actions">
          <button
            className="primary-action"
            type="button"
            onClick={() => void reload()}
          >
            Retry photo
          </button>
          <button className="secondary-action" type="button" onClick={onBack}>
            Back to gallery
          </button>
        </div>
      </section>
    );
  }

  const { photo } = state;
  return (
    <section className="gallery-card" aria-labelledby="gallery-detail-heading">
      <button className="secondary-action" type="button" onClick={onBack}>
        Back to gallery
      </button>
      <h2 id="gallery-detail-heading">Saved Clawd photo</h2>
      <DetailPhoto photo={photo} />
      <dl className="capture-metadata gallery-detail-metadata">
        <div>
          <dt>Captured</dt>
          <dd>
            <time dateTime={new Date(photo.capturedAt).toISOString()}>
              {formatCapturedAt(photo.capturedAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>
            {photo.width} × {photo.height}
          </dd>
        </div>
        <div>
          <dt>Camera</dt>
          <dd>{photo.facingMode === 'user' ? 'Front' : 'Rear'}</dd>
        </div>
        <div>
          <dt>Clawd</dt>
          <dd>{photo.overlayAssetId}</dd>
        </div>
      </dl>
      {deleteError && (
        <div className="gallery-error" role="alert">
          <strong>Photo was not deleted</strong>
          <p>{deleteError.message}</p>
        </div>
      )}
      <button
        className="danger-action"
        type="button"
        onClick={() => void deletePhoto()}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting…' : 'Delete photo'}
      </button>
    </section>
  );
}

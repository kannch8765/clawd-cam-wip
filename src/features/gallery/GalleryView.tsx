import { useState } from 'react';
import { GalleryDetail } from './GalleryDetail';
import {
  toValidCapturedAtDate,
  type GalleryRepository,
  type StoredPhotoSummary,
} from './galleryTypes';
import { useBlobObjectUrl, useGallery } from './useGallery';

interface GalleryViewProps {
  repository: GalleryRepository;
  onBackToCamera(): void;
}

interface CapturedAtPresentation {
  dateTime?: string;
  label: string;
}

function formatCapturedAt(capturedAt: number): CapturedAtPresentation {
  const date = toValidCapturedAtDate(capturedAt);
  if (!date) {
    return { label: 'Unknown capture time' };
  }

  return {
    dateTime: date.toISOString(),
    label: new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  };
}

function GalleryThumbnail({
  photo,
  onOpen,
}: {
  photo: StoredPhotoSummary;
  onOpen(): void;
}) {
  const objectUrl = useBlobObjectUrl(photo.thumbnailBlob);
  const capturedAt = formatCapturedAt(photo.capturedAt);
  return (
    <button className="gallery-tile" type="button" onClick={onOpen}>
      {objectUrl ? (
        <img src={objectUrl} alt="Saved Clawd photo thumbnail" />
      ) : (
        <span className="gallery-thumbnail-loading">Preparing thumbnail…</span>
      )}
      <span className="gallery-tile-caption">
        <time dateTime={capturedAt.dateTime}>{capturedAt.label}</time>
      </span>
    </button>
  );
}

export function GalleryView({ repository, onBackToCamera }: GalleryViewProps) {
  const { state, reload } = useGallery(repository);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <GalleryDetail
        id={selectedId}
        repository={repository}
        onBack={() => setSelectedId(null)}
        onDeleted={(deletedId) => {
          setSelectedId((currentId) =>
            currentId === deletedId ? null : currentId,
          );
          void reload();
        }}
      />
    );
  }

  if (state.status === 'loading') {
    return (
      <section className="gallery-card" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">Local gallery</h2>
        <p role="status">Loading saved Clawd photos…</p>
        <button
          className="secondary-action"
          type="button"
          onClick={() => void reload()}
        >
          Reload
        </button>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section className="gallery-card" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">Local gallery unavailable</h2>
        <div className="gallery-error" role="alert">
          <p>{state.error.message}</p>
        </div>
        <div className="gallery-actions">
          <button
            className="primary-action"
            type="button"
            onClick={() => void reload()}
          >
            Retry gallery
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={onBackToCamera}
          >
            Back to camera
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="gallery-card" aria-labelledby="gallery-heading">
      <div className="gallery-heading-row">
        <div>
          <p className="status-pill">Stored on this device</p>
          <h2 id="gallery-heading">Local gallery</h2>
        </div>
        <button
          className="secondary-action"
          type="button"
          onClick={() => void reload()}
        >
          Reload
        </button>
      </div>

      {state.photos.length === 0 ? (
        <div className="gallery-empty">
          <p>No Clawd photos yet</p>
          <button
            className="primary-action"
            type="button"
            onClick={onBackToCamera}
          >
            Open camera
          </button>
        </div>
      ) : (
        <div className="gallery-grid" aria-label="Saved Clawd photos">
          {state.photos.map((photo) => (
            <GalleryThumbnail
              key={photo.id}
              photo={photo}
              onOpen={() => setSelectedId(photo.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

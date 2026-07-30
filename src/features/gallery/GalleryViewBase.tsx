import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
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
  headingRef?: RefObject<HTMLHeadingElement | null>;
  focusHeadingOnReady?: boolean;
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
  registerButton,
}: {
  photo: StoredPhotoSummary;
  onOpen(): void;
  registerButton(button: HTMLButtonElement | null): void;
}) {
  const objectUrl = useBlobObjectUrl(photo.thumbnailBlob);
  const capturedAt = formatCapturedAt(photo.capturedAt);
  return (
    <button
      ref={registerButton}
      className="gallery-tile"
      type="button"
      onClick={onOpen}
    >
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

export function GalleryView({
  repository,
  onBackToCamera,
  headingRef,
  focusHeadingOnReady = false,
}: GalleryViewProps) {
  const { state, reload } = useGallery(repository);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const internalHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const activeHeadingRef = headingRef ?? internalHeadingRef;
  const focusOnReadyRef = useRef(focusHeadingOnReady);
  const returnFocusIdRef = useRef<string | null>(null);
  const tileButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const focusHeadingAfterDeleteRef = useRef(false);

  useLayoutEffect(() => {
    if (selectedId !== null) {
      return;
    }

    if (focusHeadingAfterDeleteRef.current) {
      if (state.status === 'loading') {
        return;
      }
      focusHeadingAfterDeleteRef.current = false;
      activeHeadingRef.current?.focus();
      return;
    }

    if (focusOnReadyRef.current) {
      if (state.status === 'loading') {
        return;
      }
      focusOnReadyRef.current = false;
      activeHeadingRef.current?.focus();
      return;
    }

    const returnFocusId = returnFocusIdRef.current;
    if (!returnFocusId) {
      return;
    }

    const returnTarget = tileButtonsRef.current.get(returnFocusId);
    if (returnTarget) {
      returnTarget.focus();
      returnFocusIdRef.current = null;
    }
  }, [activeHeadingRef, selectedId, state.status]);

  if (selectedId) {
    return (
      <GalleryDetail
        id={selectedId}
        repository={repository}
        onBack={() => setSelectedId(null)}
        onDeleted={(deletedId) => {
          focusHeadingAfterDeleteRef.current = true;
          returnFocusIdRef.current = null;
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
      <section
        className="gallery-card"
        aria-labelledby="gallery-heading"
        aria-busy="true"
      >
        <h2 id="gallery-heading" ref={activeHeadingRef} tabIndex={-1}>
          Local gallery
        </h2>
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
        <h2 id="gallery-heading" ref={activeHeadingRef} tabIndex={-1}>
          Local gallery unavailable
        </h2>
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
          <h2 id="gallery-heading" ref={activeHeadingRef} tabIndex={-1}>
            Local gallery
          </h2>
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
              registerButton={(button) => {
                if (button) {
                  tileButtonsRef.current.set(photo.id, button);
                } else {
                  tileButtonsRef.current.delete(photo.id);
                }
              }}
              onOpen={() => {
                returnFocusIdRef.current = photo.id;
                setSelectedId(photo.id);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

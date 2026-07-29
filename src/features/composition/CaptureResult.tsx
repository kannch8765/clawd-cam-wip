import { useMemo, type RefObject } from 'react';
import { useGalleryServices } from '../gallery/galleryServices';
import { useSavePhoto } from '../gallery/useGallery';
import { PhotoActions } from '../sharing/PhotoActions';
import { shareablePhotoFromCaptureResult } from '../sharing/photoFile';
import { useSharingAdapter } from '../sharing/sharingServices';
import { usePhotoSharing } from '../sharing/usePhotoSharing';
import type { PhotoCaptureResult } from './compositionTypes';

interface CaptureResultProps {
  result: PhotoCaptureResult;
  onRetake(): void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

export function CaptureResult({
  result,
  onRetake,
  headingRef,
}: CaptureResultProps) {
  const { repository, createThumbnail, idFactory } = useGalleryServices();
  const sharingAdapter = useSharingAdapter();
  const shareablePhoto = useMemo(
    () => shareablePhotoFromCaptureResult(result),
    [result],
  );
  const photoActions = usePhotoSharing(shareablePhoto, sharingAdapter);
  const savePhoto = useSavePhoto({
    result,
    repository,
    createThumbnail,
    idFactory,
  });
  const isSaving = savePhoto.state.status === 'saving';
  const isSaved = savePhoto.state.status === 'saved';

  return (
    <div
      className="capture-result-copy"
      aria-busy={isSaving || photoActions.isBusy}
    >
      <p className="status-pill">Photo captured</p>
      <h2 id="camera-heading" ref={headingRef} tabIndex={-1}>
        Clawd composition
      </h2>
      <p>
        This preview is the generated photo Blob, composed from the frozen
        camera frame geometry and Clawd transform.
      </p>
      <dl className="capture-metadata">
        <div>
          <dt>Size</dt>
          <dd>
            {result.width} × {result.height}
          </dd>
        </div>
        <div>
          <dt>Camera</dt>
          <dd>{result.facingMode === 'user' ? 'Front' : 'Rear'}</dd>
        </div>
        <div>
          <dt>Clawd</dt>
          <dd>{result.overlayAssetId}</dd>
        </div>
      </dl>

      {savePhoto.state.status === 'error' && (
        <div className="gallery-error" role="alert">
          <strong>Photo was not saved</strong>
          <p>
            {savePhoto.state.error.code === 'quota-exceeded'
              ? 'This device does not have enough browser storage. The captured photo is still available here, so you can retry.'
              : savePhoto.state.error.message}
          </p>
        </div>
      )}
      {isSaved && (
        <p className="gallery-save-success" role="status">
          Saved to the local gallery.
        </p>
      )}

      <PhotoActions controller={photoActions} />

      <div className="capture-result-actions">
        <button
          className="primary-action"
          type="button"
          onClick={() => void savePhoto.save()}
          disabled={isSaving || isSaved || photoActions.isBusy}
        >
          {isSaving
            ? 'Saving…'
            : isSaved
              ? 'Saved to gallery'
              : savePhoto.state.status === 'error'
                ? 'Retry save'
                : 'Save to gallery'}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={onRetake}
          disabled={photoActions.isBusy}
        >
          Retake
        </button>
      </div>
    </div>
  );
}

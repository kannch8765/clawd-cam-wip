import { useId } from 'react';
import type { PhotoSharingController } from './usePhotoSharing';

interface PhotoActionsProps {
  controller: PhotoSharingController;
}

function statusMessage(controller: PhotoSharingController): string | null {
  switch (controller.state.status) {
    case 'idle':
    case 'sharing':
    case 'downloading':
    case 'error':
      return null;
    case 'shared':
      return 'Share sheet closed.';
    case 'cancelled':
      return 'Sharing cancelled.';
    case 'download-started':
      return 'Download started. Your browser controls where the file goes.';
  }
}

function capabilityMessage(controller: PhotoSharingController): string | null {
  switch (controller.capability.status) {
    case 'photo-invalid':
    case 'file-share-supported':
      return null;
    case 'unsupported':
      return 'System file sharing is unavailable in this browser. Download remains available.';
    case 'text-only':
      return 'This browser cannot share image files. Download remains available.';
    case 'file-rejected':
      return 'This browser rejected this image for file sharing. Download remains available.';
  }
}

export function PhotoActions({ controller }: PhotoActionsProps) {
  const hintId = useId();
  const message = statusMessage(controller);
  const capability = capabilityMessage(controller);
  const isSharing = controller.state.status === 'sharing';
  const isDownloading = controller.state.status === 'downloading';

  return (
    <div className="photo-action-panel">
      <div
        className="photo-actions"
        aria-label="Photo sharing and download actions"
        aria-busy={controller.isBusy}
      >
        {controller.capability.status === 'file-share-supported' && (
          <button
            className="secondary-action"
            type="button"
            onClick={() => void controller.share()}
            disabled={controller.isBusy}
          >
            {isSharing ? 'Sharing…' : 'Share'}
          </button>
        )}
        <button
          className="primary-action"
          type="button"
          aria-describedby={capability ? hintId : undefined}
          onClick={controller.download}
          disabled={controller.isBusy || !controller.canDownload}
        >
          {isDownloading ? 'Starting download…' : 'Download'}
        </button>
      </div>

      {capability && (
        <p id={hintId} className="photo-action-hint">
          {capability}
        </p>
      )}
      <div
        className="photo-action-feedback"
        aria-live="polite"
        aria-atomic="true"
      >
        {message && (
          <p className="photo-action-status" role="status">
            {message}
          </p>
        )}
      </div>
      {controller.state.status === 'error' && (
        <div className="photo-action-error" role="alert">
          <strong>Photo action needs attention</strong>
          <p>{controller.state.error.message}</p>
        </div>
      )}
    </div>
  );
}

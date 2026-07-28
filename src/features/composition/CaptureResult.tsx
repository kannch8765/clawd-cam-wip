import type { PhotoCaptureResult } from './compositionTypes';

interface CaptureResultProps {
  result: PhotoCaptureResult;
  onRetake(): void;
}

export function CaptureResult({ result, onRetake }: CaptureResultProps) {
  return (
    <div className="capture-result-copy">
      <p className="status-pill">Photo captured</p>
      <h2 id="camera-heading">Clawd composition</h2>
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
      <button className="primary-action" type="button" onClick={onRetake}>
        Retake
      </button>
    </div>
  );
}

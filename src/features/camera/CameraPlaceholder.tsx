export function CameraPlaceholder() {
  return (
    <section className="camera-card" aria-labelledby="camera-heading">
      <div className="camera-frame" aria-hidden="true">
        <span className="camera-glyph">⌁</span>
      </div>
      <div className="camera-copy">
        <p className="status-pill">Not enabled in task 001</p>
        <h2 id="camera-heading">Camera workspace</h2>
        <p>
          This placeholder reserves the future camera surface while keeping
          permissions, capture, storage, sharing, and official assets out of the
          project foundation.
        </p>
      </div>
    </section>
  );
}

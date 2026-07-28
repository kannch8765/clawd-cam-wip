import { useRef } from 'react';
import type { OverlayAssetDescriptor, OverlayTransform } from './overlayTypes';
import { useOverlayGestures } from './useOverlayGestures';

interface OverlayPreviewProps {
  asset: OverlayAssetDescriptor;
  transform: OverlayTransform;
  onTransformChange(transform: OverlayTransform): void;
}

export function OverlayPreview({
  asset,
  transform,
  onTransformChange,
}: OverlayPreviewProps) {
  const interactionLayerRef = useRef<HTMLDivElement | null>(null);

  useOverlayGestures({
    target: interactionLayerRef,
    transform,
    onTransformChange,
  });

  return (
    <div
      ref={interactionLayerRef}
      className="overlay-interaction-layer"
      data-testid="overlay-interaction-layer"
    >
      <img
        className="clawd-overlay"
        src={asset.previewAssetUrl}
        alt={asset.label}
        draggable={false}
        data-overlay-x={transform.x}
        data-overlay-y={transform.y}
        data-overlay-scale={transform.scale}
        data-overlay-rotation={transform.rotation}
        data-mirrored="false"
        onDragStart={(event) => event.preventDefault()}
        style={{
          left: `${transform.x * 100}%`,
          top: `${transform.y * 100}%`,
          width: `${asset.canonicalDisplayWidth * 100}%`,
          transformOrigin: `${asset.anchor.x * 100}% ${asset.anchor.y * 100}%`,
          transform: `translate(${-asset.anchor.x * 100}%, ${-asset.anchor.y * 100}%) rotate(${transform.rotation}deg) scale(${transform.scale})`,
        }}
      />
    </div>
  );
}

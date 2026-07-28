import { useCallback, useState } from 'react';
import { constrainOverlayTransform } from './overlayGeometry';
import {
  DEFAULT_OVERLAY_TRANSFORM,
  type OverlayTransform,
} from './overlayTypes';

function copyTransform(
  transform: Readonly<OverlayTransform>,
): OverlayTransform {
  return { ...transform };
}

export function useOverlayController(
  initialTransform: Readonly<OverlayTransform> = DEFAULT_OVERLAY_TRANSFORM,
) {
  const [transform, setTransform] = useState<OverlayTransform>(() =>
    constrainOverlayTransform(copyTransform(initialTransform)),
  );

  const updateTransform = useCallback((nextTransform: OverlayTransform) => {
    setTransform(constrainOverlayTransform(nextTransform));
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(copyTransform(DEFAULT_OVERLAY_TRANSFORM));
  }, []);

  return {
    transform,
    updateTransform,
    resetTransform,
  };
}

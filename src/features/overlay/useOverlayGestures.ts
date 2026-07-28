import { useEffect, useRef, type RefObject } from 'react';
import { useGesture } from '@use-gesture/react';
import {
  applyDragGesture,
  applyPinchGesture,
  type PixelPoint,
  type PreviewSize,
} from './overlayGeometry';
import { OVERLAY_LIMITS, type OverlayTransform } from './overlayTypes';

interface DragMemo {
  start: OverlayTransform;
}

interface PinchMemo {
  start: OverlayTransform;
  startOrigin: PixelPoint;
}

export interface OverlayGestureOptions {
  target: RefObject<HTMLElement | null>;
  transform: OverlayTransform;
  onTransformChange(transform: OverlayTransform): void;
}

function previewBoundsFromTarget(target: HTMLElement | null): DOMRect | null {
  const bounds = target?.getBoundingClientRect();

  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  return bounds;
}

function previewSizeFromBounds(bounds: DOMRect): PreviewSize {
  return { width: bounds.width, height: bounds.height };
}

export function useOverlayGestures({
  target,
  transform,
  onTransformChange,
}: OverlayGestureOptions): void {
  const transformRef = useRef(transform);
  const dragActiveRef = useRef(false);
  const suppressCurrentDragRef = useRef(false);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const commitTransform = (nextTransform: OverlayTransform) => {
    transformRef.current = nextTransform;
    onTransformChange(nextTransform);
  };

  useGesture(
    {
      onDrag: ({ first, last, movement: [movementX, movementY], memo }) => {
        if (first) {
          dragActiveRef.current = true;
        }

        const previewBounds = previewBoundsFromTarget(target.current);
        const gestureMemo = (memo as DragMemo | undefined) ?? {
          start: transformRef.current,
        };

        if (suppressCurrentDragRef.current) {
          if (last) {
            suppressCurrentDragRef.current = false;
            dragActiveRef.current = false;
          }
          return gestureMemo;
        }

        if (previewBounds) {
          commitTransform(
            applyDragGesture(
              gestureMemo.start,
              { x: movementX, y: movementY },
              previewSizeFromBounds(previewBounds),
            ),
          );
        }

        if (last) {
          dragActiveRef.current = false;
        }

        return gestureMemo;
      },
      onPinch: ({ first, offset: [scale, rotation], origin, memo }) => {
        if (first && dragActiveRef.current) {
          suppressCurrentDragRef.current = true;
        }

        const previewBounds = previewBoundsFromTarget(target.current);
        const currentOrigin = previewBounds
          ? {
              x: origin[0] - previewBounds.left,
              y: origin[1] - previewBounds.top,
            }
          : { x: 0, y: 0 };
        const gestureMemo = (memo as PinchMemo | undefined) ?? {
          start: transformRef.current,
          startOrigin: currentOrigin,
        };

        if (previewBounds) {
          commitTransform(
            applyPinchGesture({
              start: gestureMemo.start,
              startOrigin: gestureMemo.startOrigin,
              currentOrigin,
              scale,
              rotation,
              previewSize: previewSizeFromBounds(previewBounds),
            }),
          );
        }

        return gestureMemo;
      },
    },
    {
      target,
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        preventDefault: true,
        threshold: 0,
      },
      pinch: {
        preventDefault: true,
        scaleBounds: {
          min: OVERLAY_LIMITS.minScale,
          max: OVERLAY_LIMITS.maxScale,
        },
        from: () => [transformRef.current.scale, transformRef.current.rotation],
      },
    },
  );
}

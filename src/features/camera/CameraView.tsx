/* eslint-disable react-refresh/only-export-components */
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { CameraView as CameraViewBase } from './CameraViewBase';
import {
  cancelFrame,
  expectedStageOrientation,
  geometryIsStable,
  requestFrame,
} from './stageGeometry';

export { expectedStageOrientation, geometryIsStable } from './stageGeometry';

export function CameraView(props: ComponentProps<typeof CameraViewBase>) {
  const boundaryRef = useRef<HTMLDivElement | null>(null);
  const [geometryReady, setGeometryReady] = useState(false);

  useEffect(() => {
    const boundary = boundaryRef.current;
    const stage = boundary?.querySelector<HTMLElement>('.camera-stage');
    if (!boundary || !stage) {
      setGeometryReady(false);
      return;
    }

    const hasResizeObserver = typeof ResizeObserver !== 'undefined';
    let firstFrame = 0;
    let secondFrame = 0;
    let generation = 0;
    const settle = () => {
      generation += 1;
      const activeGeneration = generation;
      const expectedOrientation = expectedStageOrientation();
      cancelFrame(firstFrame);
      cancelFrame(secondFrame);
      setGeometryReady(false);
      firstFrame = requestFrame(() => {
        const first = stage.getBoundingClientRect();
        secondFrame = requestFrame(() => {
          if (generation !== activeGeneration) {
            return;
          }
          const second = stage.getBoundingClientRect();
          const unmeasurableDesktopTestFallback =
            !hasResizeObserver &&
            expectedOrientation === 'any' &&
            first.width === 0 &&
            first.height === 0 &&
            second.width === 0 &&
            second.height === 0;
          setGeometryReady(
            unmeasurableDesktopTestFallback ||
              geometryIsStable(first, second, expectedOrientation),
          );
        });
      });
    };

    const observer = hasResizeObserver ? new ResizeObserver(settle) : null;
    observer?.observe(stage);
    window.addEventListener('resize', settle);
    window.addEventListener('orientationchange', settle);
    settle();

    return () => {
      generation += 1;
      cancelFrame(firstFrame);
      cancelFrame(secondFrame);
      observer?.disconnect();
      window.removeEventListener('resize', settle);
      window.removeEventListener('orientationchange', settle);
    };
  }, [props.adapter]);

  const blockUnstableCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (
      !geometryReady &&
      (event.target as Element).closest('.shutter-action')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={boundaryRef}
      className="camera-view-boundary"
      data-geometry-ready={geometryReady ? 'true' : 'false'}
      onClickCapture={blockUnstableCapture}
    >
      <CameraViewBase {...props} captureGeometryReady={geometryReady} />
      <span className="orientation-status" role="status" aria-live="polite">
        {geometryReady ? '' : 'Preparing the current preview orientation…'}
      </span>
    </div>
  );
}

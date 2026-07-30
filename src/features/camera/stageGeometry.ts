export type StageOrientation = 'any' | 'portrait' | 'landscape';

export function requestFrame(callback: FrameRequestCallback): number {
  if (typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(() => callback(performance.now()), 0);
}

export function cancelFrame(handle: number): void {
  if (typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(handle);
    return;
  }
  window.clearTimeout(handle);
}

function mediaMatches(query: string): boolean {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  );
}

export function expectedStageOrientation(): StageOrientation {
  const usesHandheldLayout =
    mediaMatches('(pointer: coarse)') || window.innerWidth <= 720;
  if (!usesHandheldLayout) {
    return 'any';
  }

  const isLandscape =
    mediaMatches('(orientation: landscape)') ||
    window.innerWidth > window.innerHeight;
  return isLandscape ? 'landscape' : 'portrait';
}

export function geometryMatchesOrientation(
  rect: DOMRectReadOnly,
  expectedOrientation: StageOrientation,
): boolean {
  if (expectedOrientation === 'landscape') {
    return rect.width > rect.height;
  }
  if (expectedOrientation === 'portrait') {
    return rect.height >= rect.width;
  }
  return true;
}

export function geometryIsStable(
  first: DOMRectReadOnly,
  second: DOMRectReadOnly,
  expectedOrientation: StageOrientation = 'any',
): boolean {
  return (
    first.width > 0 &&
    first.height > 0 &&
    Math.abs(first.width - second.width) <= 0.5 &&
    Math.abs(first.height - second.height) <= 0.5 &&
    geometryMatchesOrientation(second, expectedOrientation)
  );
}

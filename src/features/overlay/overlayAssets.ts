import type { OverlayAssetDescriptor } from './overlayTypes';

export const REFERENCE_CLAWD_ASSET_PATH =
  'assets/reference/clawd-reference-overlay.png';

export function resolveOverlayAssetUrl(
  assetPath: string,
  baseUrl: string = import.meta.env.BASE_URL,
): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = assetPath.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

export function createReferenceClawdAsset(
  baseUrl: string = import.meta.env.BASE_URL,
): OverlayAssetDescriptor {
  const intrinsicWidth = 500;
  const intrinsicHeight = 325;

  return {
    id: 'reference-clawd-base-v1',
    label: 'Reference Clawd',
    previewAssetUrl: resolveOverlayAssetUrl(
      REFERENCE_CLAWD_ASSET_PATH,
      baseUrl,
    ),
    intrinsicWidth,
    intrinsicHeight,
    aspectRatio: intrinsicWidth / intrinsicHeight,
    anchor: { x: 0.5, y: 0.5 },
    canonicalDisplayWidth: 0.38,
  };
}

export const REFERENCE_CLAWD_ASSET = createReferenceClawdAsset();

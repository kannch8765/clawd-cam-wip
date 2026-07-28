import {
  createReferenceClawdAsset,
  REFERENCE_CLAWD_ASSET_PATH,
  resolveOverlayAssetUrl,
} from './overlayAssets';

describe('overlay assets', () => {
  it('describes the single reference Clawd without a premature manifest', () => {
    const asset = createReferenceClawdAsset('/');

    expect(asset).toMatchObject({
      id: 'reference-clawd-base-v1',
      label: 'Reference Clawd',
      intrinsicWidth: 500,
      intrinsicHeight: 325,
      anchor: { x: 0.5, y: 0.5 },
      canonicalDisplayWidth: 0.38,
    });
    expect(asset.aspectRatio).toBeCloseTo(500 / 325);
  });

  it('resolves the public asset under a Vite and GitHub Pages base path', () => {
    expect(
      resolveOverlayAssetUrl(REFERENCE_CLAWD_ASSET_PATH, '/clawd-cam-wip/'),
    ).toBe('/clawd-cam-wip/assets/reference/clawd-reference-overlay.png');
  });

  it('normalizes a base path without a trailing slash', () => {
    expect(createReferenceClawdAsset('/clawd-cam').previewAssetUrl).toBe(
      '/clawd-cam/assets/reference/clawd-reference-overlay.png',
    );
  });
});

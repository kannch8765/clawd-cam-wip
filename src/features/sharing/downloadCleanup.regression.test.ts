import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browserSharingAdapter } from './sharingAdapter';

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:download-cleanup'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('download object URL cleanup', () => {
  it('revokes the URL when anchor creation throws', () => {
    vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
      throw new Error('anchor creation failed');
    });

    expect(() =>
      browserSharingAdapter.downloadBlob(
        new Blob(['photo']),
        'clawdcam-photo.bin',
      ),
    ).toThrow('anchor creation failed');

    vi.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-cleanup');
  });

  it('revokes the URL even when anchor removal throws', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    const remove = vi
      .spyOn(HTMLAnchorElement.prototype, 'remove')
      .mockImplementation(() => {
        throw new Error('anchor removal failed');
      });

    expect(() =>
      browserSharingAdapter.downloadBlob(
        new Blob(['photo']),
        'clawdcam-photo.bin',
      ),
    ).toThrow('anchor removal failed');

    remove.mockRestore();
    document.querySelector('a')?.remove();
    vi.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-cleanup');
  });
});

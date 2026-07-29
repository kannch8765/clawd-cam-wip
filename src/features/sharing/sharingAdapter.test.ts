import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browserSharingAdapter } from './sharingAdapter';

const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
const originalCanShare = Object.getOwnPropertyDescriptor(navigator, 'canShare');

function restoreNavigatorProperty(
  name: 'share' | 'canShare',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(navigator, name, descriptor);
  } else {
    Reflect.deleteProperty(navigator, name);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:download-1'),
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
  restoreNavigatorProperty('share', originalShare);
  restoreNavigatorProperty('canShare', originalCanShare);
});

describe('browser sharing adapter', () => {
  it('constructs a real File from the supplied full-size Blob', () => {
    const blob = new Blob(['full-size'], { type: 'image/png' });
    const file = browserSharingAdapter.createFile(blob, 'clawdcam.png', {
      type: 'image/png',
      lastModified: 1234,
    });

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('clawdcam.png');
    expect(file.type).toBe('image/png');
    expect(file.lastModified).toBe(1234);
    expect(file.size).toBe(blob.size);
  });

  it('checks the current File without opening the share sheet', () => {
    const share = vi.fn(async () => undefined);
    const canShare = vi.fn(() => true);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: canShare,
    });
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    expect(browserSharingAdapter.canShareFile(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(share).not.toHaveBeenCalled();
  });

  it('calls navigator.share once with one prepared image File', async () => {
    const share = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    await browserSharingAdapter.shareFile(file);

    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({
      files: [file],
      title: 'ClawdCam photo',
      text: 'A ClawdCam photo',
    });
  });

  it('downloads through a temporary anchor and revokes only its own URL', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const append = vi.spyOn(document.body, 'append');
    const blob = new Blob(['full-size'], { type: 'image/jpeg' });

    browserSharingAdapter.downloadBlob(blob, 'clawdcam-photo.jpg');

    const anchor = append.mock.calls[0][0] as HTMLAnchorElement;
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.href).toContain('blob:download-1');
    expect(anchor.download).toBe('clawdcam-photo.jpg');
    expect(click).toHaveBeenCalledTimes(1);
    expect(anchor.isConnected).toBe(false);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-1');
  });

  it('removes the anchor and revokes the URL when click throws', () => {
    const append = vi.spyOn(document.body, 'append');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('click failed');
    });

    expect(() =>
      browserSharingAdapter.downloadBlob(
        new Blob(['photo']),
        'clawdcam-photo.bin',
      ),
    ).toThrow('click failed');
    const anchor = append.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.isConnected).toBe(false);

    vi.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-1');
  });
});

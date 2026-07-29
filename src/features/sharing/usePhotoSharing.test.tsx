import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PhotoActions } from './PhotoActions';
import type { SharingAdapter } from './sharingAdapter';
import type { ShareablePhoto } from './sharingTypes';
import { usePhotoSharing } from './usePhotoSharing';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makePhoto(
  capturedAt = new Date(2026, 6, 29, 8, 9, 10).getTime(),
): ShareablePhoto {
  return {
    blob: new Blob(['full-size-photo'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    width: 1440,
    height: 1080,
    capturedAt,
    facingMode: 'user',
    overlayAssetId: 'reference-clawd',
  };
}

function createAdapter(
  overrides: Partial<SharingAdapter> = {},
): SharingAdapter {
  return {
    supportsFile: () => true,
    createFile: (blob, filename, options) =>
      new File([blob], filename, options),
    hasShare: () => true,
    hasCanShare: () => true,
    canShareFile: () => true,
    shareFile: vi.fn(async () => undefined),
    downloadBlob: vi.fn(),
    ...overrides,
  };
}

function Harness({
  photo,
  adapter,
}: {
  photo: ShareablePhoto;
  adapter: SharingAdapter;
}) {
  const controller = usePhotoSharing(photo, adapter);
  return <PhotoActions controller={controller} />;
}

describe('photo sharing capability detection', () => {
  it('keeps Download when navigator.share is unavailable', () => {
    const adapter = createAdapter({ hasShare: () => false });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
    expect(
      screen.getByText(/System file sharing is unavailable/),
    ).toBeVisible();
  });

  it('classifies share without canShare as text-only', () => {
    const adapter = createAdapter({ hasCanShare: () => false });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByText(/cannot share image files/)).toBeVisible();
  });

  it('hides Share when canShare rejects the current File', () => {
    const adapter = createAdapter({ canShareFile: () => false });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByText(/rejected this image/)).toBeVisible();
  });

  it('treats a canShare exception as file-rejected without crashing', () => {
    const adapter = createAdapter({
      canShareFile: () => {
        throw new Error('canShare failed');
      },
    });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it('shows Share only when the current image File is supported', () => {
    const shareFile = vi.fn(async () => undefined);
    const adapter = createAdapter({ shareFile });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
    expect(shareFile).not.toHaveBeenCalled();
  });

  it('degrades to download when File construction is unsupported', () => {
    const adapter = createAdapter({ supportsFile: () => false });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });
});

describe('photo sharing behavior', () => {
  it('calls share once with the prepared File and blocks rapid double clicks', async () => {
    const request = deferred<void>();
    const shareFile = vi.fn(() => request.promise);
    const adapter = createAdapter({ shareFile });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    const shareButton = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(shareButton);
    fireEvent.click(shareButton);

    expect(shareFile).toHaveBeenCalledTimes(1);
    const file = shareFile.mock.calls[0][0];
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('clawdcam-20260729-080910.jpg');
    expect(file.type).toBe('image/jpeg');
    expect(file.lastModified).toBe(makePhoto().capturedAt);
    expect(screen.getByRole('button', { name: 'Sharing…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();

    await act(async () => {
      request.resolve();
      await request.promise;
    });
    expect(screen.getByRole('status')).toHaveTextContent('Share sheet closed.');
  });

  it('classifies AbortError as cancellation without an error alert', async () => {
    const adapter = createAdapter({
      shareFile: vi.fn(async () => {
        throw new DOMException('cancelled', 'AbortError');
      }),
    });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Sharing cancelled.',
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('maps NotAllowedError and keeps Download available', async () => {
    const adapter = createAdapter({
      shareFile: vi.fn(async () => {
        throw new DOMException('blocked', 'NotAllowedError');
      }),
    });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'browser blocked sharing',
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it.each([
    ['InvalidStateError', 'not available right now'],
    ['DataError', 'rejected the image file'],
    ['TypeError', 'rejected the image file'],
    ['UnknownError', 'could not open the system share sheet'],
  ])('maps %s to an understandable failure', async (name, message) => {
    const adapter = createAdapter({
      shareFile: vi.fn(async () => {
        throw new DOMException('share failed', name);
      }),
    });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it('does not update an unmounted component after a late share resolve', async () => {
    const request = deferred<void>();
    const adapter = createAdapter({ shareFile: vi.fn(() => request.promise) });
    const view = render(<Harness photo={makePhoto()} adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    view.unmount();

    await act(async () => {
      request.resolve();
      await request.promise;
    });
  });

  it('does not let an old share result pollute a replacement photo', async () => {
    const request = deferred<void>();
    const adapter = createAdapter({ shareFile: vi.fn(() => request.promise) });
    const view = render(<Harness photo={makePhoto(1000)} adapter={adapter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    view.rerender(<Harness photo={makePhoto(2000)} adapter={adapter} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled(),
    );

    await act(async () => {
      request.resolve();
      await request.promise;
    });
    expect(screen.queryByText('Share sheet closed.')).toBeNull();
  });
});

describe('photo download behavior', () => {
  it('downloads the original full-size Blob with the shared filename', () => {
    const photo = makePhoto();
    const downloadBlob = vi.fn();
    const adapter = createAdapter({ downloadBlob });
    render(<Harness photo={photo} adapter={adapter} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    expect(downloadBlob).toHaveBeenCalledWith(
      photo.blob,
      'clawdcam-20260729-080910.jpg',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Download started');
  });

  it('shows a recoverable error when download DOM work fails', () => {
    const adapter = createAdapter({
      downloadBlob: vi.fn(() => {
        throw new Error('DOM failed');
      }),
    });
    render(<Harness photo={makePhoto()} adapter={adapter} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'could not start the download',
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { useLayoutEffect } from 'react';
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

function makePhoto(capturedAt = 1000): ShareablePhoto {
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

function CommitBoundaryHarness({
  photo,
  adapter,
  onCommitted,
}: {
  photo: ShareablePhoto;
  adapter: SharingAdapter;
  onCommitted(photo: ShareablePhoto): void;
}) {
  useLayoutEffect(() => {
    onCommitted(photo);
  }, [onCommitted, photo]);

  return <Harness photo={photo} adapter={adapter} />;
}

describe('photo preparation failures', () => {
  it('presents an invalid capture time without a false download hint', () => {
    const canShareFile = vi.fn(() => true);
    render(
      <Harness
        photo={makePhoto(Number.NaN)}
        adapter={createAdapter({ canShareFile })}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('invalid capture time');
    expect(screen.queryByText(/Download remains available/)).toBeNull();
    expect(canShareFile).not.toHaveBeenCalled();
  });

  it('presents a MIME mismatch without a false download hint', () => {
    const canShareFile = vi.fn(() => true);
    const photo: ShareablePhoto = {
      ...makePhoto(),
      blob: new Blob(['png-photo'], { type: 'image/png' }),
      mimeType: 'image/jpeg',
    };
    render(<Harness photo={photo} adapter={createAdapter({ canShareFile })} />);

    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'conflicting file type metadata',
    );
    expect(screen.queryByText(/Download remains available/)).toBeNull();
    expect(canShareFile).not.toHaveBeenCalled();
  });
});

describe('replacement commit-boundary invalidation', () => {
  it('ignores an old resolve completed by the replacement layout commit', async () => {
    const request = deferred<void>();
    const original = makePhoto(1000);
    const replacement = makePhoto(2000);
    const adapter = createAdapter({ shareFile: vi.fn(() => request.promise) });
    const onCommitted = (photo: ShareablePhoto) => {
      if (photo === replacement) {
        request.resolve();
      }
    };
    const view = render(
      <CommitBoundaryHarness
        photo={original}
        adapter={adapter}
        onCommitted={onCommitted}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    view.rerender(
      <CommitBoundaryHarness
        photo={replacement}
        adapter={adapter}
        onCommitted={onCommitted}
      />,
    );
    await act(async () => {
      await request.promise;
    });

    expect(screen.queryByText('Share sheet closed.')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });

  it('ignores an old reject completed by the replacement layout commit', async () => {
    const request = deferred<void>();
    const original = makePhoto(1000);
    const replacement = makePhoto(2000);
    const adapter = createAdapter({ shareFile: vi.fn(() => request.promise) });
    const onCommitted = (photo: ShareablePhoto) => {
      if (photo === replacement) {
        request.reject(new DOMException('old failure', 'NotAllowedError'));
      }
    };
    const view = render(
      <CommitBoundaryHarness
        photo={original}
        adapter={adapter}
        onCommitted={onCommitted}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    view.rerender(
      <CommitBoundaryHarness
        photo={replacement}
        adapter={adapter}
        onCommitted={onCommitted}
      />,
    );
    await act(async () => {
      try {
        await request.promise;
      } catch {
        // The old operation owns and handles this expected rejection.
      }
    });

    expect(screen.queryByText('Share sheet closed.')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });
});

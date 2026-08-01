import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CameraView } from '../features/camera/CameraView';
import type { CameraAdapter } from '../features/camera/cameraTypes';
import { GalleryServicesProvider } from '../features/gallery/GalleryRepositoryContext';
import type { GalleryServices } from '../features/gallery/galleryServices';
import { GalleryView } from '../features/gallery/GalleryView';
import { createGalleryRepository } from '../features/gallery/galleryRepository';

interface AppProps {
  galleryServices?: Partial<GalleryServices>;
  cameraAdapter?: CameraAdapter;
}

export function App({ galleryServices, cameraAdapter }: AppProps) {
  const [activeView, setActiveView] = useState<'camera' | 'gallery'>('camera');
  const cameraHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const galleryHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const previousViewRef = useRef(activeView);
  const defaultRepository = useMemo(() => createGalleryRepository(), []);
  const services = useMemo(
    () => ({ repository: defaultRepository, ...galleryServices }),
    [defaultRepository, galleryServices],
  );

  useLayoutEffect(() => {
    if (previousViewRef.current === activeView) {
      return;
    }

    previousViewRef.current = activeView;
    if (activeView === 'camera') {
      cameraHeadingRef.current?.focus();
    }
  }, [activeView]);

  return (
    <GalleryServicesProvider services={services}>
      <main className="app-shell">
        <header className="hero">
          <p className="eyebrow">Camera and local gallery</p>
          <h1>ClawdCam</h1>
          <p className="tagline">Bring a little Clawd everywhere.</p>
          <nav className="app-navigation" aria-label="ClawdCam views">
            <button
              type="button"
              aria-controls="camera-view"
              aria-current={activeView === 'camera' ? 'page' : undefined}
              onClick={() => setActiveView('camera')}
            >
              Camera
            </button>
            <button
              type="button"
              aria-controls="gallery-view"
              aria-current={activeView === 'gallery' ? 'page' : undefined}
              onClick={() => setActiveView('gallery')}
            >
              Gallery
            </button>
          </nav>
        </header>

        {activeView === 'camera' && (
          <div id="camera-view" data-testid="camera-view">
            <CameraView adapter={cameraAdapter} headingRef={cameraHeadingRef} />
          </div>
        )}
        {activeView === 'gallery' && (
          <div id="gallery-view" data-testid="gallery-view">
            <GalleryView
              focusHeadingOnReady
              headingRef={galleryHeadingRef}
              repository={services.repository}
              onBackToCamera={() => setActiveView('camera')}
            />
          </div>
        )}
      </main>
    </GalleryServicesProvider>
  );
}

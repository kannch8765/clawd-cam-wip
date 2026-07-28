import { useMemo, useState } from 'react';
import { CameraView } from '../features/camera/CameraView';
import { GalleryServicesProvider } from '../features/gallery/GalleryRepositoryContext';
import type { GalleryServices } from '../features/gallery/galleryServices';
import { GalleryView } from '../features/gallery/GalleryView';
import { createGalleryRepository } from '../features/gallery/galleryRepository';

interface AppProps {
  galleryServices?: Partial<GalleryServices>;
}

export function App({ galleryServices }: AppProps) {
  const [activeView, setActiveView] = useState<'camera' | 'gallery'>('camera');
  const defaultRepository = useMemo(() => createGalleryRepository(), []);
  const services = useMemo(
    () => ({ repository: defaultRepository, ...galleryServices }),
    [defaultRepository, galleryServices],
  );

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
              aria-current={activeView === 'camera' ? 'page' : undefined}
              onClick={() => setActiveView('camera')}
            >
              Camera
            </button>
            <button
              type="button"
              aria-current={activeView === 'gallery' ? 'page' : undefined}
              onClick={() => setActiveView('gallery')}
            >
              Gallery
            </button>
          </nav>
        </header>

        <div hidden={activeView !== 'camera'}>
          <CameraView />
        </div>
        {activeView === 'gallery' && (
          <GalleryView
            repository={services.repository}
            onBackToCamera={() => setActiveView('camera')}
          />
        )}
      </main>
    </GalleryServicesProvider>
  );
}

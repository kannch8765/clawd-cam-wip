import { useEffect, useRef, type ComponentProps } from 'react';
import { GalleryView as GalleryViewBase } from './GalleryViewBase';

export function GalleryView(props: ComponentProps<typeof GalleryViewBase>) {
  const boundaryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary) {
      return;
    }

    const handleError = (event: Event) => {
      const image = event.target;
      if (
        !(image instanceof HTMLImageElement) ||
        !image.closest('.gallery-tile')
      ) {
        return;
      }
      const fallback = document.createElement('span');
      fallback.className = 'gallery-thumbnail-error';
      fallback.textContent = 'Thumbnail unavailable — open photo';
      image.replaceWith(fallback);
    };

    boundary.addEventListener('error', handleError, true);
    return () => boundary.removeEventListener('error', handleError, true);
  }, []);

  return (
    <div ref={boundaryRef} className="gallery-view-boundary">
      <GalleryViewBase {...props} />
    </div>
  );
}

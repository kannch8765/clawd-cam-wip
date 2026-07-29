import { type PropsWithChildren } from 'react';
import {
  browserGalleryServices,
  GalleryServicesContext,
  type GalleryServices,
} from './galleryServices';

interface GalleryServicesProviderProps extends PropsWithChildren {
  services?: Partial<GalleryServices>;
}

export function GalleryServicesProvider({
  services,
  children,
}: GalleryServicesProviderProps) {
  const value: GalleryServices = {
    ...browserGalleryServices,
    ...services,
  };
  return (
    <GalleryServicesContext.Provider value={value}>
      {children}
    </GalleryServicesContext.Provider>
  );
}

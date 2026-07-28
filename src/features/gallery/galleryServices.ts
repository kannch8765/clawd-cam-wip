import { createContext, useContext } from 'react';
import { createGalleryRepository } from './galleryRepository';
import {
  browserStoredPhotoIdFactory,
  type GalleryRepository,
  type StoredPhotoIdFactory,
} from './galleryTypes';
import { generateThumbnail } from './thumbnail';

export interface GalleryServices {
  repository: GalleryRepository;
  createThumbnail(photoBlob: Blob): Promise<Blob>;
  idFactory: StoredPhotoIdFactory;
}

export const browserGalleryServices: GalleryServices = {
  repository: createGalleryRepository(),
  createThumbnail: generateThumbnail,
  idFactory: browserStoredPhotoIdFactory,
};

export const GalleryServicesContext = createContext<GalleryServices>(
  browserGalleryServices,
);

export function useGalleryServices(): GalleryServices {
  return useContext(GalleryServicesContext);
}

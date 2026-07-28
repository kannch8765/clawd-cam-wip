import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
} from 'idb';
import type { StoredPhotoRecord, StoredPhotoSummary } from './galleryTypes';
import { GalleryStorageError } from './galleryTypes';

export const GALLERY_DATABASE_NAME = 'clawdcam';
export const GALLERY_DATABASE_VERSION = 1;
export const GALLERY_PHOTO_STORE = 'photos';
export const GALLERY_PHOTO_SUMMARY_STORE = 'photoSummaries';
export const GALLERY_CAPTURED_AT_INDEX = 'capturedAt';

export interface GalleryDatabaseSchema extends DBSchema {
  photos: {
    key: string;
    value: StoredPhotoRecord;
    indexes: { capturedAt: number };
  };
  photoSummaries: {
    key: string;
    value: StoredPhotoSummary;
    indexes: { capturedAt: number };
  };
}

export type GalleryDatabase = IDBPDatabase<GalleryDatabaseSchema>;
export type GalleryUpgradeTransaction = IDBPTransaction<
  GalleryDatabaseSchema,
  Array<'photos' | 'photoSummaries'>,
  'versionchange'
>;
export type GalleryDatabaseProvider = () => Promise<GalleryDatabase>;

interface UpgradeObjectStore {
  readonly indexNames: DOMStringList;
  createIndex(name: string, keyPath: string): unknown;
}

function ensureCapturedAtIndex(store: UpgradeObjectStore): void {
  if (!store.indexNames.contains(GALLERY_CAPTURED_AT_INDEX)) {
    store.createIndex(GALLERY_CAPTURED_AT_INDEX, 'capturedAt');
  }
}

export function upgradeGalleryDatabase(
  database: GalleryDatabase,
  _oldVersion: number,
  _newVersion: number | null,
  transaction: GalleryUpgradeTransaction,
): void {
  const photoStore = database.objectStoreNames.contains(GALLERY_PHOTO_STORE)
    ? transaction.objectStore(GALLERY_PHOTO_STORE)
    : database.createObjectStore(GALLERY_PHOTO_STORE, { keyPath: 'id' });
  ensureCapturedAtIndex(photoStore);

  const summaryStore = database.objectStoreNames.contains(
    GALLERY_PHOTO_SUMMARY_STORE,
  )
    ? transaction.objectStore(GALLERY_PHOTO_SUMMARY_STORE)
    : database.createObjectStore(GALLERY_PHOTO_SUMMARY_STORE, {
        keyPath: 'id',
      });
  ensureCapturedAtIndex(summaryStore);
}

export async function openGalleryDatabase(): Promise<GalleryDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new GalleryStorageError(
      'unsupported',
      'This browser does not support the local ClawdCam gallery.',
    );
  }

  try {
    return await openDB<GalleryDatabaseSchema>(
      GALLERY_DATABASE_NAME,
      GALLERY_DATABASE_VERSION,
      { upgrade: upgradeGalleryDatabase },
    );
  } catch (error) {
    if (error instanceof GalleryStorageError) {
      throw error;
    }

    throw new GalleryStorageError(
      'unavailable',
      'ClawdCam could not open its local photo gallery.',
      error,
    );
  }
}

export function createGalleryDatabaseProvider(): GalleryDatabaseProvider {
  let databasePromise: Promise<GalleryDatabase> | null = null;

  return () => {
    databasePromise ??= openGalleryDatabase().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
    return databasePromise;
  };
}

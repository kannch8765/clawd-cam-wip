import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type OpenDBCallbacks,
} from 'idb';
import type { StoredPhotoRecord, StoredPhotoSummary } from './galleryTypes';
import { GalleryStorageError } from './galleryTypes';

export const GALLERY_DATABASE_NAME = 'clawdcam';
export const GALLERY_DATABASE_VERSION = 1;
export const GALLERY_PHOTO_STORE = 'photos';
export const GALLERY_PHOTO_SUMMARY_STORE = 'photoSummaries';
export const GALLERY_CAPTURED_AT_INDEX = 'capturedAt';
export const GALLERY_DATABASE_OPEN_DEADLINE_MS = 5_000;

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
export type GalleryDatabaseOpenAdapter = (
  callbacks: OpenDBCallbacks<GalleryDatabaseSchema>,
) => Promise<GalleryDatabase>;

export interface OpenGalleryDatabaseOptions {
  openDatabase?: GalleryDatabaseOpenAdapter;
  deadlineMs?: number;
  onInvalidated?(): void;
}

export type GalleryDatabaseProviderOptions = Omit<
  OpenGalleryDatabaseOptions,
  'onInvalidated'
>;

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

const browserGalleryDatabaseOpenAdapter: GalleryDatabaseOpenAdapter = (
  callbacks,
) =>
  openDB<GalleryDatabaseSchema>(
    GALLERY_DATABASE_NAME,
    GALLERY_DATABASE_VERSION,
    callbacks,
  );

function closeDatabase(database: GalleryDatabase | null): void {
  try {
    database?.close();
  } catch {
    // Closing an already terminated connection is harmless.
  }
}

function mapOpenError(error: unknown): GalleryStorageError {
  if (error instanceof GalleryStorageError) {
    return error;
  }

  return new GalleryStorageError(
    'unavailable',
    'ClawdCam could not open its local photo gallery.',
    error,
  );
}

export function openGalleryDatabase(
  options: OpenGalleryDatabaseOptions = {},
): Promise<GalleryDatabase> {
  if (typeof indexedDB === 'undefined' && !options.openDatabase) {
    return Promise.reject(
      new GalleryStorageError(
        'unsupported',
        'This browser does not support the local ClawdCam gallery.',
      ),
    );
  }

  const openDatabase =
    options.openDatabase ?? browserGalleryDatabaseOpenAdapter;
  const deadlineMs = options.deadlineMs ?? GALLERY_DATABASE_OPEN_DEADLINE_MS;

  return new Promise<GalleryDatabase>((resolve, reject) => {
    let settled = false;
    let invalidated = false;
    let database: GalleryDatabase | null = null;

    const timeoutId = setTimeout(() => {
      rejectOnce(
        new GalleryStorageError(
          'unavailable',
          'Opening the local gallery took too long. Close other ClawdCam tabs and retry.',
        ),
      );
    }, deadlineMs);

    const rejectOnce = (error: GalleryStorageError): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    };

    const invalidate = (message: string): void => {
      if (invalidated) {
        return;
      }
      invalidated = true;
      closeDatabase(database);
      options.onInvalidated?.();
      rejectOnce(new GalleryStorageError('unavailable', message));
    };

    let opening: Promise<GalleryDatabase>;
    try {
      opening = openDatabase({
        upgrade: upgradeGalleryDatabase,
        blocked() {
          rejectOnce(
            new GalleryStorageError(
              'unavailable',
              'Another ClawdCam tab is blocking local gallery access. Close it and retry.',
            ),
          );
        },
        blocking() {
          invalidate(
            'The local gallery connection changed in another tab. Please retry.',
          );
        },
        terminated() {
          invalidate(
            'The browser ended the local gallery connection. Please retry.',
          );
        },
      });
    } catch (error) {
      rejectOnce(mapOpenError(error));
      return;
    }

    void opening.then(
      (openedDatabase) => {
        database = openedDatabase;
        if (settled || invalidated) {
          closeDatabase(openedDatabase);
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        resolve(openedDatabase);
      },
      (error: unknown) => rejectOnce(mapOpenError(error)),
    );
  });
}

export function createGalleryDatabaseProvider(
  options: GalleryDatabaseProviderOptions = {},
): GalleryDatabaseProvider {
  let databasePromise: Promise<GalleryDatabase> | null = null;
  let generation = 0;

  return () => {
    if (databasePromise) {
      return databasePromise;
    }

    const attempt = ++generation;
    let invalidated = false;
    const opening = openGalleryDatabase({
      ...options,
      onInvalidated() {
        invalidated = true;
        if (generation === attempt) {
          generation += 1;
          databasePromise = null;
        }
      },
    });

    const tracked = opening.catch((error: unknown) => {
      if (generation === attempt) {
        databasePromise = null;
      }
      throw error;
    });

    if (!invalidated && generation === attempt) {
      databasePromise = tracked;
    }
    return tracked;
  };
}

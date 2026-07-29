import type { IDBPTransaction } from 'idb';
import {
  createGalleryDatabaseProvider,
  GALLERY_CAPTURED_AT_INDEX,
  GALLERY_PHOTO_STORE,
  GALLERY_PHOTO_SUMMARY_STORE,
  type GalleryDatabaseProvider,
  type GalleryDatabaseSchema,
} from './galleryDatabase';
import {
  cloneOverlayTransform,
  GalleryStorageError,
  isStoredPhotoRecord,
  isStoredPhotoSummary,
  toStoredPhotoSummary,
  type GalleryRepository,
  type GalleryStorageErrorCode,
  type StoredPhotoRecord,
  type StoredPhotoSummary,
} from './galleryTypes';

export function mapGalleryStorageError(
  error: unknown,
  fallbackCode: GalleryStorageErrorCode,
  fallbackMessage: string,
): GalleryStorageError {
  if (error instanceof GalleryStorageError) {
    return error;
  }

  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  ) {
    return new GalleryStorageError(
      'quota-exceeded',
      'This device does not have enough browser storage to save the photo.',
      error,
    );
  }

  return new GalleryStorageError(fallbackCode, fallbackMessage, error);
}

function cloneStoredPhotoRecord(record: StoredPhotoRecord): StoredPhotoRecord {
  return {
    ...record,
    overlayTransform: cloneOverlayTransform(record.overlayTransform),
  };
}

export type GalleryWriteTransaction = IDBPTransaction<
  GalleryDatabaseSchema,
  Array<'photos' | 'photoSummaries'>,
  'readwrite'
>;

export async function writeStoredPhotoTransaction(
  transaction: GalleryWriteTransaction,
  record: StoredPhotoRecord,
): Promise<void> {
  const storedRecord = cloneStoredPhotoRecord(record);
  const summary = toStoredPhotoSummary(storedRecord);

  const completion = transaction.done;

  try {
    await Promise.all([
      transaction.objectStore(GALLERY_PHOTO_STORE).put(storedRecord),
      transaction.objectStore(GALLERY_PHOTO_SUMMARY_STORE).put(summary),
    ]);
    await completion;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // The transaction may already be inactive after a request failure.
    }
    await completion.catch(() => undefined);
    throw error;
  }
}

export function createGalleryRepository(
  databaseProvider: GalleryDatabaseProvider = createGalleryDatabaseProvider(),
): GalleryRepository {
  return {
    async savePhoto(record) {
      if (!isStoredPhotoRecord(record)) {
        throw new GalleryStorageError(
          'corrupt-record',
          'ClawdCam refused to save an incomplete photo record.',
        );
      }

      try {
        const database = await databaseProvider();
        const transaction = database.transaction(
          [GALLERY_PHOTO_STORE, GALLERY_PHOTO_SUMMARY_STORE],
          'readwrite',
        );
        await writeStoredPhotoTransaction(transaction, record);
      } catch (error) {
        throw mapGalleryStorageError(
          error,
          'write-failed',
          'ClawdCam could not save this photo to the local gallery.',
        );
      }
    },

    async listPhotos() {
      try {
        const database = await databaseProvider();
        const transaction = database.transaction(
          GALLERY_PHOTO_SUMMARY_STORE,
          'readonly',
        );
        const index = transaction.store.index(GALLERY_CAPTURED_AT_INDEX);
        const summaries: StoredPhotoSummary[] = [];
        let cursor = await index.openCursor(null, 'prev');

        while (cursor) {
          if (isStoredPhotoSummary(cursor.value)) {
            summaries.push({ ...cursor.value });
          }
          cursor = await cursor.continue();
        }
        await transaction.done;

        summaries.sort(
          (left, right) =>
            right.capturedAt - left.capturedAt ||
            right.id.localeCompare(left.id),
        );
        return summaries;
      } catch (error) {
        throw mapGalleryStorageError(
          error,
          'read-failed',
          'ClawdCam could not read the local photo gallery.',
        );
      }
    },

    async getPhoto(id) {
      try {
        const database = await databaseProvider();
        const value = await database.get(GALLERY_PHOTO_STORE, id);
        if (value === undefined) {
          return undefined;
        }
        if (!isStoredPhotoRecord(value)) {
          throw new GalleryStorageError(
            'corrupt-record',
            'This saved photo record is damaged or incomplete.',
          );
        }
        return cloneStoredPhotoRecord(value);
      } catch (error) {
        throw mapGalleryStorageError(
          error,
          'read-failed',
          'ClawdCam could not read this saved photo.',
        );
      }
    },

    async deletePhoto(id) {
      try {
        const database = await databaseProvider();
        const transaction = database.transaction(
          [GALLERY_PHOTO_STORE, GALLERY_PHOTO_SUMMARY_STORE],
          'readwrite',
        );
        await Promise.all([
          transaction.objectStore(GALLERY_PHOTO_STORE).delete(id),
          transaction.objectStore(GALLERY_PHOTO_SUMMARY_STORE).delete(id),
        ]);
        await transaction.done;
      } catch (error) {
        throw mapGalleryStorageError(
          error,
          'delete-failed',
          'ClawdCam could not delete this photo from the local gallery.',
        );
      }
    },
  };
}

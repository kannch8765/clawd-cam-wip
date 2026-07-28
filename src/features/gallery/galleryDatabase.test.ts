import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { deleteDB, openDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GALLERY_CAPTURED_AT_INDEX,
  GALLERY_DATABASE_NAME,
  GALLERY_DATABASE_VERSION,
  GALLERY_PHOTO_STORE,
  GALLERY_PHOTO_SUMMARY_STORE,
  openGalleryDatabase,
  upgradeGalleryDatabase,
  type GalleryDatabase,
  type GalleryDatabaseSchema,
} from './galleryDatabase';
import {
  createGalleryRepository,
  mapGalleryStorageError,
  writeStoredPhotoTransaction,
} from './galleryRepository';
import {
  GalleryStorageError,
  STORED_PHOTO_SCHEMA_VERSION,
  toStoredPhotoSummary,
  type StoredPhotoRecord,
} from './galleryTypes';

const openedDatabases: GalleryDatabase[] = [];
const databaseNames = new Set<string>();

function makeRecord(
  id: string,
  capturedAt: number,
  overrides: Partial<StoredPhotoRecord> = {},
): StoredPhotoRecord {
  return {
    id,
    schemaVersion: STORED_PHOTO_SCHEMA_VERSION,
    photoBlob: new NodeBlob([`photo-${id}`], { type: 'image/jpeg' }) as Blob,
    thumbnailBlob: new NodeBlob([`thumb-${id}`], {
      type: 'image/jpeg',
    }) as Blob,
    capturedAt,
    width: 1200,
    height: 900,
    mimeType: 'image/jpeg',
    facingMode: 'environment',
    mirrored: false,
    overlayAssetId: 'reference-clawd',
    overlayTransform: { x: 0.5, y: 0.52, scale: 1, rotation: 0 },
    ...overrides,
  };
}

async function createTestDatabase(
  name = `clawdcam-test-${crypto.randomUUID()}`,
) {
  databaseNames.add(name);
  const database = await openDB<GalleryDatabaseSchema>(name, 1, {
    upgrade: upgradeGalleryDatabase,
  });
  openedDatabases.push(database);
  return database;
}

afterEach(async () => {
  for (const database of openedDatabases.splice(0)) {
    database.close();
  }
  for (const name of databaseNames) {
    await deleteDB(name);
  }
  databaseNames.clear();
  vi.unstubAllGlobals();
});

describe('gallery database schema', () => {
  it('creates the production database, stores, and capturedAt indexes', async () => {
    databaseNames.add(GALLERY_DATABASE_NAME);
    const database = await openGalleryDatabase();
    openedDatabases.push(database);

    expect(database.name).toBe(GALLERY_DATABASE_NAME);
    expect(database.version).toBe(GALLERY_DATABASE_VERSION);
    expect(database.objectStoreNames.contains(GALLERY_PHOTO_STORE)).toBe(true);
    expect(
      database.objectStoreNames.contains(GALLERY_PHOTO_SUMMARY_STORE),
    ).toBe(true);

    const transaction = database.transaction(
      [GALLERY_PHOTO_STORE, GALLERY_PHOTO_SUMMARY_STORE],
      'readonly',
    );
    expect(
      transaction
        .objectStore(GALLERY_PHOTO_STORE)
        .indexNames.contains(GALLERY_CAPTURED_AT_INDEX),
    ).toBe(true);
    expect(
      transaction
        .objectStore(GALLERY_PHOTO_SUMMARY_STORE)
        .indexNames.contains(GALLERY_CAPTURED_AT_INDEX),
    ).toBe(true);
  });

  it('keeps existing records during an idempotent future upgrade', async () => {
    const name = `clawdcam-migration-${crypto.randomUUID()}`;
    databaseNames.add(name);
    const legacy = await openDB<GalleryDatabaseSchema>(name, 1, {
      upgrade(database) {
        const photos = database.createObjectStore(GALLERY_PHOTO_STORE, {
          keyPath: 'id',
        });
        photos.createIndex(GALLERY_CAPTURED_AT_INDEX, 'capturedAt');
        const summaries = database.createObjectStore(
          GALLERY_PHOTO_SUMMARY_STORE,
          { keyPath: 'id' },
        );
        summaries.createIndex(GALLERY_CAPTURED_AT_INDEX, 'capturedAt');
      },
    });
    const record = makeRecord('legacy-photo', 100);
    await legacy.put(GALLERY_PHOTO_STORE, record);
    await legacy.put(GALLERY_PHOTO_SUMMARY_STORE, toStoredPhotoSummary(record));
    legacy.close();

    const upgraded = await openDB<GalleryDatabaseSchema>(name, 2, {
      upgrade: upgradeGalleryDatabase,
    });
    openedDatabases.push(upgraded);

    expect(await upgraded.get(GALLERY_PHOTO_STORE, record.id)).toMatchObject({
      id: record.id,
      capturedAt: 100,
    });
    expect(
      await upgraded.get(GALLERY_PHOTO_SUMMARY_STORE, record.id),
    ).toMatchObject({ id: record.id, capturedAt: 100 });
  });

  it('reports unsupported storage without affecting camera code', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(openGalleryDatabase()).rejects.toMatchObject({
      code: 'unsupported',
    });
  });
});

describe('gallery repository', () => {
  it('saves full and thumbnail Blobs with copied metadata', async () => {
    const database = await createTestDatabase();
    const repository = createGalleryRepository(async () => database);
    const record = makeRecord('photo-a', 200);

    await repository.savePhoto(record);
    record.overlayTransform.x = 0.1;
    const stored = await repository.getPhoto(record.id);

    expect(await stored?.photoBlob.text()).toBe('photo-photo-a');
    expect(await stored?.thumbnailBlob.text()).toBe('thumb-photo-a');
    expect(stored?.overlayTransform.x).toBe(0.5);
    expect(stored).toMatchObject({
      id: 'photo-a',
      width: 1200,
      height: 900,
      capturedAt: 200,
      facingMode: 'environment',
    });
  });

  it('lists newest summaries first without exposing full-size Blobs', async () => {
    const database = await createTestDatabase();
    const repository = createGalleryRepository(async () => database);
    await repository.savePhoto(makeRecord('same-b', 200));
    await repository.savePhoto(makeRecord('older', 100));
    await repository.savePhoto(makeRecord('same-a', 200));

    const summaries = await repository.listPhotos();
    expect(summaries.map((summary) => summary.id)).toEqual([
      'same-b',
      'same-a',
      'older',
    ]);
    expect(summaries[0]).not.toHaveProperty('photoBlob');
    expect(await summaries[0].thumbnailBlob.text()).toBe('thumb-same-b');
  });

  it('returns one full record and deletes only the requested photo', async () => {
    const database = await createTestDatabase();
    const repository = createGalleryRepository(async () => database);
    await repository.savePhoto(makeRecord('keep', 100));
    await repository.savePhoto(makeRecord('remove', 200));

    expect((await repository.getPhoto('remove'))?.id).toBe('remove');
    await repository.deletePhoto('remove');

    expect(await repository.getPhoto('remove')).toBeUndefined();
    expect((await repository.listPhotos()).map((photo) => photo.id)).toEqual([
      'keep',
    ]);
  });

  it('treats deletion of a missing id as a safe no-op', async () => {
    const database = await createTestDatabase();
    const repository = createGalleryRepository(async () => database);
    await expect(repository.deletePhoto('missing')).resolves.toBeUndefined();
  });

  it('skips corrupt summaries instead of crashing the entire gallery', async () => {
    const database = await createTestDatabase();
    const repository = createGalleryRepository(async () => database);
    const valid = makeRecord('valid', 100);
    await repository.savePhoto(valid);
    await database.put(GALLERY_PHOTO_SUMMARY_STORE, {
      ...toStoredPhotoSummary(makeRecord('corrupt', 200)),
      thumbnailBlob: 'not-a-blob',
    } as never);

    expect((await repository.listPhotos()).map((photo) => photo.id)).toEqual([
      'valid',
    ]);
  });

  it('classifies a corrupt full record without hiding the error', async () => {
    const database = await createTestDatabase();
    const repository = createGalleryRepository(async () => database);
    await database.put(GALLERY_PHOTO_STORE, {
      ...makeRecord('corrupt', 100),
      overlayTransform: null,
    } as never);

    await expect(repository.getPhoto('corrupt')).rejects.toMatchObject({
      code: 'corrupt-record',
    });
  });

  it('aborts an atomic write so a failed full record leaves no summary', async () => {
    const database = await createTestDatabase();
    const transaction = database.transaction(
      [GALLERY_PHOTO_STORE, GALLERY_PHOTO_SUMMARY_STORE],
      'readwrite',
    );
    const invalid = makeRecord('atomic', 100, {
      photoBlob: (() => undefined) as unknown as Blob,
    });

    await expect(
      writeStoredPhotoTransaction(transaction, invalid),
    ).rejects.toBeDefined();
    expect(await database.get(GALLERY_PHOTO_STORE, 'atomic')).toBeUndefined();
    expect(
      await database.get(GALLERY_PHOTO_SUMMARY_STORE, 'atomic'),
    ).toBeUndefined();
  });

  it('maps quota and generic operation failures to ClawdCam errors', () => {
    expect(
      mapGalleryStorageError(
        new DOMException('full', 'QuotaExceededError'),
        'write-failed',
        'fallback',
      ),
    ).toMatchObject({ code: 'quota-exceeded' });
    expect(
      mapGalleryStorageError(new Error('nope'), 'read-failed', 'fallback'),
    ).toMatchObject({ code: 'read-failed', message: 'fallback' });
    expect(
      mapGalleryStorageError(
        new GalleryStorageError('delete-failed', 'kept'),
        'read-failed',
        'fallback',
      ),
    ).toMatchObject({ code: 'delete-failed', message: 'kept' });
  });
});

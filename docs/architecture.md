# Architecture

## Current foundation

ClawdCam keeps application composition, camera lifecycle, browser APIs, overlay interaction, still-photo composition, local persistence, gallery presentation, styling, PWA behavior, quality tooling, and deployment behind explicit boundaries. Task 006 adds an opt-in local gallery backed by IndexedDB without adding downloads, Web Share, automatic system-photo saving, cloud storage, or accounts.

## Directory layout

```text
src/
  app/
    App.tsx                         Camera/Gallery view navigation and composition
  features/
    camera/                         Camera device and stream lifecycle boundary
    overlay/                        Normalized Clawd transform and gestures
    composition/                    Frozen Canvas 2D capture and capture URL lifecycle
    gallery/
      galleryTypes.ts               Versioned stored records, summaries, and errors
      galleryDatabase.ts            IndexedDB schema, upgrade callback, connection owner
      galleryRepository.ts          Atomic persistence and query API
      thumbnail.ts                  Native image decode and thumbnail Canvas pipeline
      GalleryRepositoryContext.tsx  Injectable gallery services for UI and tests
      useGallery.ts                 Save/list/detail generations and Blob URL lifecycle
      GalleryView.tsx               Loading/error/empty/ready thumbnail grid
      GalleryDetail.tsx             Full-size detail and confirmed deletion
  styles/
    index.css                       Camera and shared visual foundation
    gallery.css                     Mobile-first gallery and navigation styles
```

React components never call IndexedDB or `idb` directly. The database and transactions are confined to `galleryDatabase.ts` and `galleryRepository.ts`. Tests inject fake repositories into the React boundary and use `fake-indexeddb` only for schema and repository coverage.

## Runtime flow

1. `App.tsx` keeps the Camera view mounted and switches the visible surface between Camera and Gallery without React Router.
2. Camera, overlay, and composition retain the Task 005 ownership model. A shutter press freezes camera identity, geometry, mirror policy, overlay identity and transform, and capture time before asynchronous Canvas work.
3. The generated `PhotoCaptureResult` remains in memory and its preview object URL remains owned by `usePhotoCapture()`.
4. Nothing is saved automatically. `CaptureResult.tsx` exposes `Save to gallery` after a successful capture.
5. A save session generates a stable ID before asynchronous thumbnail work, creates a separate thumbnail from the existing full-size result Blob, converts the result into a versioned stored record, and calls the repository once.
6. The repository writes the full record and lightweight summary in one IndexedDB read/write transaction. Success is reported only after `transaction.done` resolves.
7. Gallery list loading reads summary records only. Opening one tile fetches that photo's full record and creates its full-size object URL only for the detail view.
8. Confirmed deletion removes the full record and summary in one transaction, returns to the grid, and reloads it.

## Capture-to-storage boundary

The canonical Task 005 capture remains `PhotoCaptureResult`:

```ts
interface PhotoCaptureResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  capturedAt: string;
  facingMode: 'user' | 'environment';
  mirrored: boolean;
  overlayAssetId: string;
  overlayTransform: OverlayTransform;
}
```

Task 006 converts it exactly once at the save boundary. It uses the original composed `blob`; it does not rerun camera access or Canvas composition. The frozen ISO `capturedAt` value is parsed into a numeric epoch timestamp before persistence. `overlayTransform` is copied into the record so storage never retains an external mutable object reference.

A save ID is generated before thumbnail decoding. An in-flight ref closes the rapid-double-click window synchronously, and a successful capture result cannot be saved twice through the same result UI. A failed save leaves the result Blob and preview visible, clears the in-flight guard, and permits retry. Retake never deletes a previously committed record.

## Stored record and list summary

The first production record schema is version 1:

```ts
interface StoredPhotoRecord {
  id: string;
  schemaVersion: 1;
  photoBlob: Blob;
  thumbnailBlob: Blob;
  capturedAt: number;
  width: number;
  height: number;
  mimeType: string;
  facingMode: 'user' | 'environment';
  mirrored: boolean;
  overlayAssetId: string;
  overlayTransform: OverlayTransform;
}
```

`StoredPhotoSummary` contains the ID, schema version, thumbnail Blob, capture time, dimensions, MIME type, facing/mirror information, and overlay asset ID. It deliberately excludes `photoBlob` and `overlayTransform`. The grid therefore does not load every full-size image into memory.

Records contain no React values, DOM nodes, Canvas objects, camera streams, or object URLs. Blobs are stored directly and are never converted to base64.

## IndexedDB schema and migration

ClawdCam uses the adopted `idb` wrapper and one explicit database boundary:

- database name: `clawdcam`
- database version: `1`
- full record store: `photos`
- summary store: `photoSummaries`
- key path for both stores: `id`
- index for both stores: `capturedAt`

The exported upgrade callback checks for stores and indexes before creating them. It never deletes or recreates an existing store during ordinary startup. The shape leaves one centralized place for future version branches and migrations. An automated upgrade test opens a pre-existing database, inserts data, upgrades through the same callback, and proves the records remain present.

The two-store design makes the list query physically independent from full-size photo Blobs. Save and delete open one transaction across both stores, so a request or transaction failure cannot become a normal half-record. Deleting an unknown ID is a safe no-op. List results are sorted by `capturedAt` descending with ID as a deterministic tie-breaker.

## Thumbnail policy

Thumbnail creation uses browser-native image decoding, an off-screen Canvas 2D surface, and Blob encoding:

- maximum edge: `320` pixels
- upscaling: never
- aspect ratio: preserved
- output MIME type: `image/jpeg`
- JPEG quality: `0.82`
- total deadline: `5,000` milliseconds

The original full-size Blob is not modified. Decode failure, invalid dimensions, missing Canvas context, encode exceptions, null `toBlob()` results, unexpected output MIME type, and deadline expiry are all mapped to `thumbnail-failed`. The temporary decode object URL is revoked in a `finally` path for both success and failure.

## Object URL ownership

Object URLs are temporary UI resources and never enter IndexedDB:

- capture result URL: owned by Task 005 `usePhotoCapture()`;
- grid thumbnail URLs: one per mounted gallery tile, owned by the tile effect;
- detail full-size URL: owned by the mounted detail image effect;
- thumbnail generation source URL: owned by the thumbnail operation and revoked in `finally`.

A URL is revoked when its Blob changes, its record leaves the rendered list, the detail view exits, or the component unmounts. The effect cleanup is idempotent for React Strict Mode. The list never creates full-size URLs for unopened photos.

## Concurrency and stale-result policy

Gallery list and detail hooks use monotonically increasing generations and mounted refs. A later reload invalidates an older request, and late results cannot replace newer state or update an unmounted view. A retry always creates a new generation.

Save and delete have synchronous in-flight refs so repeated taps cannot start duplicate writes or deletes before React renders a disabled button. Save skips post-await state updates after unmount. Detail fetch generations are invalidated before successful deletion navigation, so an old read cannot redisplay a deleted record. A completed save waits for the transaction before reporting success, so an immediate Gallery load can observe the record.

No global mutable React store is used to hide request races. The repository object is injectable, while each mounted view owns its request state.

## Storage errors and camera isolation

`GalleryStorageError` distinguishes:

- `unsupported`
- `unavailable`
- `quota-exceeded`
- `write-failed`
- `read-failed`
- `delete-failed`
- `corrupt-record`
- `thumbnail-failed`

IndexedDB open failures map to `unavailable`. `QuotaExceededError` and Firefox's historical quota name map to `quota-exceeded`. A quota failure never reports success, never deletes older photos, and leaves the capture result available for retry. Corrupt list summaries are skipped so one damaged entry does not crash the grid; requesting a corrupt full record produces an explicit error.

Gallery support is independent from camera support. If IndexedDB is absent or unavailable, Camera and in-memory capture remain usable. Switching views does not request a new camera stream, and gallery deletion never touches a camera stream or current capture result.

## Quality gates and device validation

`npm run check` runs ESLint, Prettier verification, Vitest, and the TypeScript/Vite production build. Camera tests never access real hardware. IndexedDB tests use `fake-indexeddb`, repository components use injected fakes, and thumbnail tests use injected native-boundary adapters.

Automated tests establish persistence semantics by saving through a repository, constructing a fresh repository connection, and reading the same database data. Physical browser retention, private-mode policy, storage eviction, installed-PWA behavior, and offline memory use remain device smoke-test items in `docs/gallery-device-smoke-test.md`.

## Deferred features

Task 006 does not add a download button, `<a download>`, File System Access API, `navigator.share`, Web Share, automatic system-photo saving, cloud synchronization, accounts, multi-device synchronization, production Clawd asset packs, GIF frame export, multi-asset selection, filters, text, layers, undo/redo, editing, batch operations, or storage cleanup policy.

A following task may add download and Web Share behind a separate sharing boundary while reusing the stored full-size Blob. Those behaviors must not be folded into the IndexedDB repository.

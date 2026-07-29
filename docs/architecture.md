# Architecture

## Current foundation

ClawdCam keeps application composition, camera lifecycle, browser APIs, overlay interaction, still-photo composition, local persistence, gallery presentation, photo sharing/download, styling, PWA behavior, quality tooling, and deployment behind explicit boundaries. Task 007 adds user-initiated download and Web Share Level 2 file sharing on top of the Task 006 local gallery without automatic system-photo saving, cloud storage, accounts, or platform SDKs.

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
    sharing/
      sharingTypes.ts               Read-only input, capability, state, and errors
      photoFile.ts                  MIME validation, filename, and File construction
      sharingAdapter.ts             Web Share and download browser boundary
      sharingServices.ts            Sharing context and consumer hook
      SharingServicesContext.tsx    Injectable provider for UI and tests
      usePhotoSharing.ts            Operation arbitration and stale-result protection
      PhotoActions.tsx              Accessible Share/Download controls
  styles/
    index.css                       Camera and shared visual foundation
    gallery.css                     Mobile-first gallery and navigation styles
    sharing.css                     Sharing and download status styles
```

React components never call IndexedDB, `idb`, or `navigator.share()` directly. The database and transactions are confined to `galleryDatabase.ts` and `galleryRepository.ts`. Web Share, `File` construction capability, temporary download anchors, and download object URLs remain confined to the sharing boundary. Tests inject fake repositories and sharing adapters into the React boundaries and use `fake-indexeddb` only for schema and repository coverage.

## Runtime flow

1. `App.tsx` keeps the Camera view mounted and switches the visible surface between Camera and Gallery without React Router.
2. Camera, overlay, and composition retain the Task 005 ownership model. A shutter press freezes camera identity, geometry, mirror policy, overlay identity and transform, and capture time before asynchronous Canvas work.
3. The generated `PhotoCaptureResult` remains in memory and its preview object URL remains owned by `usePhotoCapture()`.
4. Nothing is saved, downloaded, or shared automatically. `CaptureResult.tsx` exposes independent `Save to gallery`, `Share`, `Download`, and `Retake` actions after a successful capture.
5. A save session generates a stable ID before asynchronous thumbnail work, creates a separate thumbnail from the existing full-size result Blob, converts the result into a versioned stored record, and calls the repository once.
6. The repository writes the full record and lightweight summary in one IndexedDB read/write transaction. Success is reported only after `transaction.done` resolves.
7. Gallery list loading reads summary records only. Opening one tile fetches that photo's full record and creates its full-size object URL only for the detail view.
8. Confirmed deletion removes the full record and summary in one transaction, returns to the grid, and reloads it.
9. Capture result and gallery detail convert their existing full-size Blob and frozen metadata to one `ShareablePhoto` model. The gallery path uses `StoredPhotoRecord.photoBlob`, never `thumbnailBlob`.
10. The sharing boundary prepares a deterministic filename and, when supported, one real `File`. Capability detection does not open the Share Sheet. A direct Share click invokes Web Share; a direct Download click creates a separate short-lived object URL and temporary anchor.

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

## Sharing input model

Capture results and stored records are converted to the same read-only input:

```ts
interface ShareablePhoto {
  readonly blob: Blob;
  readonly mimeType: string;
  readonly width: number;
  readonly height: number;
  readonly capturedAt: number;
  readonly facingMode: 'user' | 'environment';
  readonly overlayAssetId: string;
}
```

The capture path uses `PhotoCaptureResult.blob`. The gallery path uses `StoredPhotoRecord.photoBlob`, never `thumbnailBlob`. Neither path passes React state, DOM nodes, display object URLs, Canvas objects, or repository objects into the adapter. No base64 conversion, image re-encoding, compression, or Canvas recomposition occurs.

## Filename, MIME, File, and preparation policy

Filenames are generated internally from the frozen capture time in the user's local timezone:

```text
clawdcam-YYYYMMDD-HHmmss.ext
```

Date fields are zero-padded. JPEG maps to `.jpg`, PNG to `.png`, WebP to `.webp`, and another valid MIME type maps to `.bin`. Invalid timestamps are rejected. Caller-supplied filename fragments are not accepted, so `/`, `\`, `:`, control characters, and platform path syntax cannot enter the output.

The Blob MIME type is authoritative when present. Metadata is accepted when `Blob.type` is empty. Conflicting non-empty Blob and metadata MIME types fail closed. A supported browser receives one `File` built from the original full-size Blob with the deterministic name, validated type, and `lastModified` equal to the frozen capture time. Missing or throwing `File` construction degrades to Download only.

A failure before filename/File preparation, including an invalid capture time or MIME conflict, is distinct from browser capability. It is exposed immediately as a `PhotoActionError`; Share is hidden, Download is disabled, and the UI does not claim that Download remains available. The photo remains visible so the user can navigate away, retake, or delete according to the owning surface.

## Web Share capability and result classification

File sharing is available for the current photo only when:

- preparation succeeded;
- `navigator.share` is a function;
- `navigator.canShare` is a function;
- a real `File` can be constructed;
- `navigator.canShare({ files: [file] })` returns `true`.

The capability model distinguishes `photo-invalid`, `unsupported`, `text-only`, `file-share-supported`, and `file-rejected`. `photo-invalid` represents preparation failure and never emits a browser-capability hint. A thrown `canShare()` is treated as file sharing unavailable. Capability detection never calls `navigator.share()` and does not use user-agent detection.

`navigator.share()` is called only from an explicit Share button click with one prepared image File, title, and text. `AbortError` is user cancellation and is not shown as a red failure. `NotAllowedError`, `InvalidStateError`, `DataError`, `TypeError`, and unknown failures map to understandable errors while Download remains available. A resolved request means only that the system share operation returned; ClawdCam does not claim that a target app saved the photo.

## Download and object URL ownership

Download uses the original full-size Blob and never reuses a capture or gallery display URL. Each click creates a new URL, then attempts temporary anchor construction, append, click, and removal. An outer cleanup path schedules URL revocation even if anchor creation, append, click, or removal throws. If scheduling itself throws, the URL is revoked immediately.

Object URL ownership remains explicit:

- capture result display URL: `usePhotoCapture()`;
- gallery thumbnail URL: mounted gallery tile;
- gallery detail full-size URL: mounted detail image;
- thumbnail decode URL: thumbnail operation;
- download URL: one sharing adapter download operation.

The sharing feature never reuses or revokes capture or gallery display URLs. It does not guarantee that a browser respects the suggested filename or download location. In particular, it never says a download was saved to iOS Photos or Android Gallery.

## Sharing concurrency and replacement invalidation

Sharing uses a synchronous operation ref so rapid Share taps start one request and Share/Download do not overlap within one controller. Retake is disabled while a share is active. Gallery Delete is disabled while a share is active. Gallery Back remains safe because unmount invalidates the operation.

A mounted/input identity ref and monotonic generation protect asynchronous completion. Photo or adapter replacement is detected in a layout effect at the replacement commit boundary, before passive effects and before a parent layout effect can complete an old request. The old operation also captures the exact input identity and must match both identity and generation before writing `shared`, cancellation, error, download, or cleanup state. Late resolve and late reject results therefore cannot pollute a replacement photo.

A cancellation or real failure leaves the capture result or gallery detail intact. Sharing/download failures do not affect camera, composition, persistence, or gallery navigation.

## Quality gates and device validation

`npm run check` runs ESLint, Prettier verification, Vitest, and the TypeScript/Vite production build. Camera tests never access real hardware. IndexedDB tests use `fake-indexeddb`, repository components use injected fakes, thumbnail tests use injected native-boundary adapters, and sharing tests inject `File`, Web Share, object URL, anchor, and operation boundaries.

Automated tests establish persistence semantics by saving through a repository, constructing a fresh repository connection, and reading the same database data. Sharing tests cover unsupported/file-rejected capability, preparation failures, cancellation and real errors, duplicate action suppression, full-size Blob identity, download URL cleanup across DOM failures, unmount, and replacement commit-boundary late resolve/reject. They never open a real Share Sheet or perform a real download.

Physical browser retention, private-mode policy, storage eviction, installed-PWA behavior, offline memory use, Share Sheet previews, target-app behavior, iOS Safari download behavior, Android MIME handling, desktop capability differences, and actual filename/location behavior remain device smoke-test items in `docs/gallery-device-smoke-test.md` and `docs/sharing-device-smoke-test.md`.

## Deferred features

Task 007 does not add automatic saving to iOS Photos or Android Gallery, File System Access API, `showSaveFilePicker`, cloud upload, share-link generation, accounts, multi-device synchronization, social-platform SDKs, Clipboard image writing, image re-encoding controls, EXIF or GPS metadata, batch sharing/download, ZIP export, storage cleanup policy, production dynamic Clawd asset packs, GIF frame export, multi-asset selection, filters, text, layers, undo/redo, or editing.

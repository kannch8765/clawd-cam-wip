# Architecture

## Current foundation

ClawdCam keeps application composition, camera lifecycle, browser APIs, overlay interaction, still-photo composition, local persistence, gallery presentation, photo sharing/download, styling, PWA behavior, quality tooling, and deployment behind explicit boundaries. Task 007 adds user-initiated download and Web Share Level 2 file sharing without automatic system-photo saving, cloud storage, accounts, or platform SDKs.

## Directory layout

```text
src/
  app/
    App.tsx                         Camera/Gallery view navigation and composition
  features/
    camera/                         Camera device and stream lifecycle boundary
    overlay/                        Normalized Clawd transform and gestures
    composition/                    Frozen Canvas capture and capture URL lifecycle
    gallery/
      galleryTypes.ts               Stored records, summaries, and errors
      galleryDatabase.ts            IndexedDB schema and connection owner
      galleryRepository.ts          Atomic persistence and query API
      thumbnail.ts                  Bounded thumbnail pipeline
      useGallery.ts                 Save/list/detail generations and URL lifecycle
      GalleryView.tsx               Summary-only gallery grid
      GalleryDetail.tsx             Full-size detail and confirmed deletion
    sharing/
      sharingTypes.ts               Read-only input, capability, state, and errors
      photoFile.ts                  MIME validation, filename, and File construction
      sharingAdapter.ts             Web Share and download browser boundary
      SharingServicesContext.tsx    Injectable sharing adapter
      usePhotoSharing.ts            Operation arbitration and stale-result protection
      PhotoActions.tsx              Accessible Share/Download controls
  styles/
    index.css
    gallery.css
    sharing.css
```

React components never call IndexedDB or `navigator.share()` directly. IndexedDB remains confined to the gallery repository. Web Share, `File` construction capability, temporary download anchors, and download object URLs remain confined to the sharing boundary.

## Runtime flow

1. Camera, overlay, and composition retain the Task 005 ownership model. A shutter press freezes camera identity, geometry, mirror policy, overlay identity and transform, and capture time before asynchronous Canvas work.
2. The generated `PhotoCaptureResult` remains in memory. Its preview object URL is owned by `usePhotoCapture()`.
3. Nothing is saved, downloaded, or shared automatically. The result exposes distinct `Save to gallery`, `Share`, `Download`, and `Retake` actions.
4. Gallery save reuses the existing full-size result Blob, creates a thumbnail, and atomically writes a full record and lightweight summary. It never reruns composition.
5. Gallery list loads summaries only. Detail loads one full record and owns its full-size display URL.
6. Capture result and gallery detail convert their existing full-size Blob and frozen metadata to one `ShareablePhoto` model.
7. The sharing boundary prepares a deterministic filename and, when supported, one real `File`. Capability detection does not open the Share Sheet.
8. A direct Share click invokes Web Share with that File. A direct Download click creates a separate short-lived object URL and temporary anchor.

## Capture and storage boundary

The canonical capture remains:

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

Task 006 persists the original composed Blob and frozen metadata in schema version 1. Full records contain `photoBlob`, `thumbnailBlob`, capture time, dimensions, MIME type, facing/mirror information, overlay identity, and transform. Summaries omit the full-size Blob and transform so the grid does not load all photos into memory.

The database remains `clawdcam` version 1 with `photos` and `photoSummaries` stores and `capturedAt` indexes. Task 007 does not alter this schema. Share/download state and object URLs never enter a stored record. Sharing and downloading never write, update, or delete IndexedDB data.

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

## Filename, MIME, and File policy

Filenames are generated internally from the frozen capture time in the user's local timezone:

```text
clawdcam-YYYYMMDD-HHmmss.ext
```

Date fields are zero-padded. JPEG maps to `.jpg`, PNG to `.png`, WebP to `.webp`, and another valid MIME type maps to `.bin`. Invalid timestamps are rejected. Caller-supplied filename fragments are not accepted, so `/`, `\`, `:`, control characters, and platform path syntax cannot enter the output.

The Blob MIME type is authoritative when present. Metadata is accepted when `Blob.type` is empty. Conflicting non-empty Blob and metadata MIME types fail closed. A supported browser receives one `File` built from the original full-size Blob with the deterministic name, validated type, and `lastModified` equal to the frozen capture time. Missing or throwing `File` construction degrades to Download only.

## Web Share capability and result classification

File sharing is available for the current photo only when:

- `navigator.share` is a function;
- `navigator.canShare` is a function;
- a real `File` can be constructed;
- `navigator.canShare({ files: [file] })` returns `true`.

The capability model distinguishes `unsupported`, `text-only`, `file-share-supported`, and `file-rejected`. A thrown `canShare()` is treated as file sharing unavailable. Capability detection never calls `navigator.share()` and does not use user-agent detection.

`navigator.share()` is called only from an explicit Share button click with one prepared image File, title, and text. `AbortError` is user cancellation and is not shown as a red failure. `NotAllowedError`, `InvalidStateError`, `DataError`, `TypeError`, and unknown failures map to understandable errors while Download remains available. A resolved request means only that the system share operation returned; ClawdCam does not claim that a target app saved the photo.

## Download and object URL ownership

Download uses the original full-size Blob. One click creates a new URL, creates and appends a temporary `<a download>`, clicks it, removes it, and schedules URL revocation. Cleanup runs even when anchor work throws. Repeated downloads own and clean independent URLs.

Object URL ownership remains explicit:

- capture result display URL: `usePhotoCapture()`;
- gallery thumbnail URL: mounted gallery tile;
- gallery detail full-size URL: mounted detail image;
- thumbnail decode URL: thumbnail operation;
- download URL: one sharing adapter download operation.

The sharing feature never reuses or revokes capture or gallery display URLs. It does not guarantee that a browser respects the suggested filename or download location. In particular, it never says a download was saved to iOS Photos or Android Gallery.

## Concurrency and stale-result policy

Save and delete retain their Task 006 synchronous in-flight guards. Sharing adds a synchronous operation ref so rapid Share taps start one request and Share/Download do not overlap within one controller. A generation and mounted ref invalidate old work when a photo changes, detail navigation occurs, or a component unmounts. Late share resolve/reject results cannot update a replacement photo or unmounted UI.

Retake is disabled while a share is active. Gallery Delete is disabled while a share is active. Gallery Back remains safe because unmount invalidates the sharing generation. A cancellation or real failure leaves the capture result or gallery detail intact. Sharing/download failures do not affect camera, composition, persistence, or gallery navigation.

## Quality gates and device validation

`npm run check` runs ESLint, Prettier verification, Vitest, and the TypeScript/Vite production build. Automated tests mock camera, IndexedDB, `File`, Web Share, object URLs, anchor clicks, and sharing operations; they never open a real Share Sheet or perform a real download.

Physical Share Sheet behavior, target-app previews, installed-PWA user activation and return lifecycle, iOS Safari download behavior, Android MIME handling, desktop capability differences, and actual filename/location behavior remain in `docs/sharing-device-smoke-test.md`.

## Deferred features

Task 007 does not add automatic saving to iOS Photos or Android Gallery, File System Access API, `showSaveFilePicker`, cloud upload, share-link generation, accounts, social-platform SDKs, Clipboard image writing, image re-encoding controls, EXIF or GPS metadata, batch sharing/download, ZIP export, production dynamic Clawd asset packs, multi-asset selection, filters, text, layers, undo/redo, or editing.

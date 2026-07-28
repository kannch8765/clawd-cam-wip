# Architecture

## Current foundation

ClawdCam keeps application composition, camera lifecycle, browser APIs, overlay interaction, still-photo composition, styling, PWA behavior, quality tooling, and deployment concerns behind explicit boundaries. Task 005 adds in-memory Canvas capture without introducing persistence, downloads, or sharing.

## Directory layout

```text
src/
  app/                         Application composition and app-level tests
  features/
    camera/
      cameraAdapter.ts         Native MediaDevices boundary and error mapping
      cameraTypes.ts           Camera domain types and capture-source identity
      useCamera.ts             Request arbitration, stream lifecycle, capture source
      CameraView.tsx           Mobile-first camera/capture UI composition
    overlay/
      overlayTypes.ts          Authoritative transform and asset descriptor types
      overlayGeometry.ts       Normalized interaction geometry pure functions
      overlayAssets.ts         Single reference/test asset descriptor
      useOverlayController.ts  ClawdCam-owned transform state
      useOverlayGestures.ts    @use-gesture/react interpretation adapter
      OverlayPreview.tsx       DOM overlay rendered above the camera preview
    composition/
      compositionTypes.ts      Snapshot, result, adapter, and error contracts
      captureGeometry.ts       Cover crop, output sizing, and overlay draw geometry
      captureAdapter.ts        Image decode, Canvas creation, Blob encoding, object URLs
      composePhoto.ts          Native Canvas 2D camera and overlay composition
      usePhotoCapture.ts       Capture concurrency, sessions, result URL lifecycle
      CaptureResult.tsx        Generated-Blob result metadata and Retake UI
  styles/                      Global styles and design tokens
  test/                        Shared test environment setup
public/
  assets/reference/            Derived reference/test Clawd PNG
  ...                          Static PWA placeholder assets
docs/                          Architecture and physical-device checklists
.github/workflows/             CI and GitHub Pages automation
```

## Runtime flow

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` registers the generated Service Worker and mounts React in Strict Mode.
3. `src/app/App.tsx` composes the camera feature UI.
4. `CameraView.tsx` owns the always-mounted camera and overlay controllers and supplies their authoritative state to `usePhotoCapture()`.
5. `useCamera()` owns request ordering, active-stream replacement, track interruption handling, and cleanup. A ready stream exposes an identity-bearing `CameraCaptureSource` only while the same request, stream, video element, dimensions, and live tracks remain current.
6. `OverlayPreview.tsx` renders the reference Clawd inside the clipped preview stage from the authoritative normalized `OverlayTransform`.
7. `usePhotoCapture()` decodes the reference capture asset, freezes one shutter-time snapshot, arbitrates concurrent capture sessions, and owns generated object URLs.
8. `composePhoto.ts` draws the camera frame and transparent Clawd through native Canvas 2D, then returns a Blob-backed result.
9. `vite-plugin-pwa` generates the web app manifest and Workbox Service Worker for production builds.

## Camera state and lifecycle

The camera state is a discriminated union rather than a loading flag plus an error string. It distinguishes `idle`, `requesting`, `ready`, `permission-denied`, `unsupported`, `unavailable`, `interrupted`, and `runtime-error`.

A request becomes `ready` only after `getUserMedia()` returns a stream, video inputs are enumerated, the stream is attached to the inline muted `<video>`, and non-zero intrinsic video dimensions are available. The complete startup sequence has a 20-second deadline. Old or late requests are invalidated and their streams are stopped exactly once.

Capture does not stop the camera. `useCamera()` exposes the current capture source and a validator that checks request ID, stream object identity, video element identity, `srcObject`, intrinsic dimensions, and active tracks. Stream replacement or interruption invalidates an in-progress composition.

## Overlay domain and gesture boundary

`OverlayTransform` remains the authoritative ClawdCam state:

```ts
export interface OverlayTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

`x` and `y` are normalized coordinates in the visible camera stage, `scale` is a multiplier relative to the asset's canonical display width, and `rotation` is clockwise degrees normalized to `(-180, 180]`. Preview and exporter both consume this same model. Neither reads a CSS transform matrix back from the DOM.

The reference asset descriptor supplies intrinsic dimensions, aspect ratio, anchor/pivot, and canonical display width. Task 005 continues to use the deterministic transparent PNG from Task 004; it does not introduce the future production `preview.gif` and `capture.png` package.

## Capture snapshot boundary

A shutter press synchronously freezes all state needed for that photo before any asynchronous work can alter it:

- camera request ID, stream object, video element, and facing mode;
- intrinsic video width and height;
- preview-stage content-box width and height;
- centered cover crop geometry;
- deterministic output dimensions;
- mirror policy;
- the complete overlay asset descriptor;
- a copy of the current `OverlayTransform`;
- capture timestamp.

The capture pipeline never rereads live overlay state, CSS transforms, page size, or camera selection to change an already-started composition. It validates the frozen camera source immediately before drawing and again after Blob encoding. A changed, stopped, or interrupted source fails closed instead of mixing old geometry with a new frame.

## Cover crop and output size

The visible source rectangle matches CSS `object-fit: cover` with a centered crop:

```ts
const coverScale = Math.max(
  previewWidth / videoWidth,
  previewHeight / videoHeight,
);
const visibleSourceWidth = previewWidth / coverScale;
const visibleSourceHeight = previewHeight / coverScale;
const cropX = (videoWidth - visibleSourceWidth) / 2;
const cropY = (videoHeight - visibleSourceHeight) / 2;
```

`captureGeometry.ts` rejects non-finite or zero dimensions. Output size begins with the visible source crop, preserves its aspect ratio, uses a 960-pixel minimum long edge, and caps the long edge at 2048 pixels. This deterministic policy is independent of CSS pixels and `devicePixelRatio`.

## Canvas layers and mirror policy

Canvas draws two ordered layers:

1. the source-cropped camera frame fills the output;
2. the transparent Clawd PNG is drawn over it.

Rear-camera pixels are drawn normally. Front-camera export wraps only the camera draw in `save()`, `translate(outputWidth, 0)`, `scale(-1, 1)`, and `restore()`. The overlay is then drawn normally, so the final selfie matches the mirrored preview while Clawd itself is never flipped.

The overlay anchor maps to `transform.x * outputWidth` and `transform.y * outputHeight`. Its width is `asset.canonicalDisplayWidth * outputWidth * transform.scale`; height follows the asset aspect ratio. Canvas translates to the anchor, applies positive radians for clockwise CSS-compatible rotation in the downward-positive Canvas coordinate system, offsets by the asset anchor, draws the transparent PNG, and restores context state.

## Blob result and lifecycle

The canonical capture representation is a `Blob`, not a data URL. The default encoder requests `image/jpeg` at quality `0.92`; an encoder that synchronously rejects the requested MIME type falls back to PNG. A null Blob is an error, and Blob callbacks have a five-second deadline so capture cannot remain pending forever.

The in-memory result records the Blob, actual MIME type, output dimensions, timestamp, facing mode, mirrored flag, overlay asset ID, and a copy of the shutter-time transform. Task 005 does not write this record to IndexedDB.

A synchronous in-flight guard prevents rapid double clicks from starting multiple compositions. Capture and asset-load generations reject late results. React state is not updated after unmount. Each generated object URL is revoked when replaced, on Retake, and on unmount. Retake reveals the existing video element and stream without requesting permission again; the overlay controller retains the user's transform.

## Reference/test Clawd asset provenance

`public/assets/reference/clawd-reference-overlay.png` remains the deterministic 500 × 325 transparent derivative documented in Task 004. Its committed SHA-256 is `0e3072de633ac933f12344f29620caf1f93a9c17d3d70ef4eba5dcb8cec26eb2`. It is reference/test artwork, not a final production asset package.

## GitHub Pages base path

`vite.config.ts` derives the production base from `GITHUB_REPOSITORY`. The reference asset URL uses `import.meta.env.BASE_URL`, so local and repository Pages deployments resolve the same asset descriptor correctly.

## Quality gates

`npm run check` runs ESLint, Prettier verification, Vitest, and the TypeScript/Vite production build. Automated camera and composition tests use mocks and never request real hardware.

## Planned feature boundaries

Task 005 results exist only in React memory. Task 006 may add local persistence, gallery behavior, downloads, or Web Share behind separate storage and sharing boundaries. Task 005 deliberately adds none of those features and does not add `idb`, a local album, thumbnails, download controls, system-photo saving, multi-overlay selection, filters, text, multi-layer editing, undo/redo, video recording, flash, Konva, Moveable, html2canvas, dom-to-image, Fabric, or GIF-frame export.

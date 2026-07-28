# Implementation References and Adoption Decisions

## Purpose and scope

This document records the implementation references selected for ClawdCam and the boundaries around their use. It is an architecture decision record, not an implementation task. Task 002 does not add camera access, overlay gestures, Canvas composition, IndexedDB persistence, sharing, or production Clawd assets.

The reference snapshots below were recorded on 2026-07-28. A fixed commit identifies the exact source tree reviewed for design ideas; it does not automatically select the corresponding package as a dependency. Before adding any dependency in a later task, re-check its current release, browser support, maintenance status, bundle impact, and license.

Related foundation documentation: [`architecture.md`](architecture.md).

## Reference summary

### `purple-technology/react-camera-pro`

- Repository: <https://github.com/purple-technology/react-camera-pro>
- Fixed reference: commit [`d0cce40cc444138231b0709539da52c44d183eba`](https://github.com/purple-technology/react-camera-pro/commit/d0cce40cc444138231b0709539da52c44d183eba)
- License: MIT
- Planned dependency: No. Reference only for the MVP camera adapter.
- ClawdCam borrows:
  - the product behavior around switching between front-facing and rear-facing cameras;
  - the distinction between a mirrored selfie preview and an unmirrored camera source;
  - cover-style preview cropping and the need to keep capture geometry explicit;
  - permission, unavailable-device, and runtime camera error states.
- ClawdCam does not adopt or directly copy:
  - the component API or imperative ref API as ClawdCam's camera domain model;
  - repository styling, layout, examples, or error copy;
  - screenshot or data URL behavior as the storage format;
  - source code. The implementation should remain a small native `MediaDevices` adapter owned by ClawdCam.

### `mozmorris/react-webcam`

- Repository: <https://github.com/mozmorris/react-webcam>
- Fixed reference: commit [`7522284fd66f98ff2d846e73881f65d35e840dab`](https://github.com/mozmorris/react-webcam/commit/7522284fd66f98ff2d846e73881f65d35e840dab)
- License: MIT
- Planned dependency: No. Cross-reference only.
- ClawdCam borrows:
  - examples of passing `getUserMedia()` video constraints through a React boundary;
  - device enumeration and camera selection behavior;
  - the relationship between a live `<video>` element, its intrinsic dimensions, and screenshot timing;
  - callback boundaries for permission and media-stream failures.
- ClawdCam does not adopt or directly copy:
  - a generic webcam component as the application's state owner;
  - audio capture, which is outside the still-photo MVP;
  - base64 data URLs as the canonical captured-photo representation;
  - repository examples, source code, or screenshot defaults without ClawdCam-specific review.

### `pmndrs/use-gesture`

- Repository: <https://github.com/pmndrs/use-gesture>
- Fixed reference: commit [`c779631aa05959638dee81b9a25fb1299a7467f6`](https://github.com/pmndrs/use-gesture/commit/c779631aa05959638dee81b9a25fb1299a7467f6)
- License: MIT
- Planned dependency: Yes, provisionally, for the single-overlay interaction task after the camera foundation is stable. It is not added by Task 002 or the recommended Task 003.
- ClawdCam borrows:
  - `drag` for translation;
  - `pinch` for scale;
  - rotation from the pinch gesture state;
  - its normalized event lifecycle and multi-pointer handling instead of building a complete gesture recognizer from scratch.
- ClawdCam does not adopt or directly copy:
  - gesture-library state as persisted application state;
  - inertia, wheel zoom, complex bounds, or other non-MVP behavior;
  - library-specific event payloads outside a small adapter;
  - examples or source code as ClawdCam implementation.

`use-gesture` may calculate deltas and transient gesture state, but the authoritative state remains ClawdCam's `OverlayTransform`. Each gesture update is reduced into that model, and rendering reads from that model. This preserves testability and keeps a future gesture-library replacement possible.

### `daybrush/moveable`

- Repository: <https://github.com/daybrush/moveable>
- Fixed reference: commit [`75069102f30c88cd89ecaaa8ca7e5f7434e54807`](https://github.com/daybrush/moveable/commit/75069102f30c88cd89ecaaa8ca7e5f7434e54807)
- License: MIT
- Planned dependency: No for the MVP.
- ClawdCam may revisit it when the product needs:
  - a visible selection/control box;
  - rotation or resize handles;
  - snapping and alignment guides;
  - multi-selection or group transforms.
- ClawdCam does not adopt or directly copy:
  - desktop-editor controls for the mobile-first single-overlay MVP;
  - DOM transform strings as persisted state;
  - its control-box visual language, examples, or source code.

### `konvajs/react-konva`

- Repository: <https://github.com/konvajs/react-konva>
- Fixed reference: commit [`2e4c34d99a991deca8aa39b9141508e6f1dc34b9`](https://github.com/konvajs/react-konva/commit/2e4c34d99a991deca8aa39b9141508e6f1dc34b9)
- License: MIT
- Planned dependency: No for the MVP.
- ClawdCam borrows only architectural ideas that may become useful later, such as an explicit scene graph, ordered layers, hit testing, and editor-oriented canvas events.
- ClawdCam does not adopt or directly copy:
  - Konva or React Konva as the first-version render tree;
  - Konva serialization as the project data format;
  - a retained-mode canvas scene graph for a composition that initially contains only one camera frame and one overlay;
  - examples or source code.

The first still-photo exporter should use the native Canvas 2D API. React continues to own the live preview UI, while an isolated composition function draws the camera frame and `capture.png` into an export canvas. React Konva can be evaluated later if multi-layer editing, text, undo, selection, or persistent scene editing makes a scene graph worthwhile.

### `jakearchibald/idb`

- Repository: <https://github.com/jakearchibald/idb>
- Fixed reference: commit [`77dd8bebf3669bbce9628e470a021ff63eb4acaf`](https://github.com/jakearchibald/idb/commit/77dd8bebf3669bbce9628e470a021ff63eb4acaf)
- License: ISC
- Planned dependency: Yes, provisionally, in a future gallery and persistence task. It is not added by Task 002 or the recommended Task 003.
- ClawdCam plans to use it for:
  - captured photo `Blob` records;
  - thumbnail `Blob` records;
  - capture timestamps and lightweight metadata;
  - explicit database versions, object-store creation, indexes, and migrations.
- ClawdCam does not adopt or directly copy:
  - demo schemas as the production schema;
  - local storage or base64 strings for photo payloads;
  - a database connection as global mutable application state;
  - repository examples or source code without adapting them behind a ClawdCam storage interface.

A future stored-photo record should be designed in its own task. Likely fields include an ID, full-size `Blob`, thumbnail `Blob`, `capturedAt`, schema or record version, camera-facing metadata, mirror policy, and the asset ID/version used for composition.

## Dependency policy for the MVP

The planned dependency boundary is intentionally small:

- Camera access: native `navigator.mediaDevices` behind a ClawdCam adapter; `react-camera-pro` and `react-webcam` remain references.
- Overlay gestures: provisionally `@use-gesture/react`, with ClawdCam retaining transform state.
- Still composition: native Canvas 2D.
- Local gallery persistence: provisionally `idb` in a later task.
- Advanced editor controls: no `moveable` or `react-konva` dependency in the MVP.

No reference repository code should be copied directly. If later implementation requires a derived or adapted code fragment, the task must preserve its license notice where required and document provenance during review.

## Dynamic Clawd asset strategy

Each approved Clawd overlay should eventually be represented by one versioned asset descriptor with two coordinated files:

- `preview.gif`: animated, transparent asset shown over the live camera preview.
- `capture.png`: deterministic, transparent still asset drawn into the exported photograph.

The pair must share the same asset ID, version, art bounds, aspect ratio, and visual anchor or pivot. The files should be authored so switching from `preview.gif` to `capture.png` does not visibly move or resize the Clawd. Any intentional difference must be represented as asset metadata rather than hidden CSS offsets.

The capture pipeline must not attempt to export the current GIF animation frame. Still output uses `capture.png` so capture is deterministic across browsers and does not depend on GIF decoding timing. Both files should be same-origin build assets, decoded before use, and referenced through Vite-compatible URLs that respect the GitHub Pages project base path.

Task 002 adds no production Clawd files and does not decide the final asset manifest schema.

## Initial overlay transform model

The initial domain model is deliberately independent from React, CSS transform strings, Canvas, and any gesture library:

```ts
export interface OverlayTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

Field semantics:

- `x`: horizontal position of the overlay anchor, expressed in normalized visible-capture coordinates. `0` is the left edge and `1` is the right edge.
- `y`: vertical position of the overlay anchor, expressed in normalized visible-capture coordinates. `0` is the top edge and `1` is the bottom edge.
- `scale`: positive unitless multiplier relative to an asset-specific canonical display size. `1` means the canonical size.
- `rotation`: clockwise degrees around the overlay anchor. Persistence should normalize it to a stable range such as `(-180, 180]`.

The visible range for `x` and `y` is normally `0` through `1`, but the model may allow limited values outside that range so a user can place part of an overlay beyond the photograph edge. Bounds belong to interaction policy, not to the data type.

Intrinsic asset dimensions and anchor metadata do not belong in `OverlayTransform`; they belong to the versioned asset descriptor. Camera facing and mirror state also remain camera/composition settings rather than overlay transform fields.

## Preview-to-export coordinate mapping

The live preview and final image must share one explicit geometry model. The exporter must not infer placement by reading a CSS transform matrix from the DOM.

For a cover-fitted preview, define:

- source dimensions `videoWidth` and `videoHeight` from the ready `<video>` element;
- preview content-box dimensions `previewWidth` and `previewHeight` in CSS pixels;
- cover scale `coverScale = max(previewWidth / videoWidth, previewHeight / videoHeight)`;
- visible source width `visibleWidth = previewWidth / coverScale`;
- visible source height `visibleHeight = previewHeight / coverScale`;
- centered source crop origin `cropX = (videoWidth - visibleWidth) / 2` and `cropY = (videoHeight - visibleHeight) / 2`.

If the UI later uses a non-centered `object-position`, the same geometry object must contain the corresponding crop offsets. The camera frame is exported with the source-crop form of `drawImage()`:

```ts
context.drawImage(
  video,
  cropX,
  cropY,
  visibleWidth,
  visibleHeight,
  0,
  0,
  outputWidth,
  outputHeight,
);
```

`outputWidth / outputHeight` must equal the visible preview aspect ratio. A later capture task may choose native crop dimensions or a capped export resolution, but both axes must use the same crop geometry.

The overlay anchor maps directly from normalized capture space:

```ts
const overlayX = transform.x * outputWidth;
const overlayY = transform.y * outputHeight;
```

Its canonical width is defined as a fraction of the output width or by equivalent asset metadata, then multiplied by `transform.scale`. The Canvas exporter applies translation, rotation, and scale around the asset anchor. This keeps placement stable across CSS size, device pixel ratio, stream resolution, and export resolution.

Mapping tests should cover portrait and landscape sources, centered cover cropping, front-camera mirroring, partially off-canvas overlays, and preview resizing after device rotation.

## Selfie mirror policy

For the MVP, the front-facing camera is mirrored in both the live preview and the exported camera image. The rear-facing camera is never mirrored.

This is a deliberate WYSIWYG decision: the saved composition should match what the user saw while positioning Clawd. The overlay asset itself is not flipped. It is rendered normally on top of the mirrored camera pixels, using the same display-space `x` and `y` coordinates as the preview.

The first MVP has no separate “mirror saved selfie” preference. A later setting may separate preview mirroring from export mirroring, but that task must explicitly remap horizontal coordinates and test text or asymmetric subjects.

## Browser, security, and hosting constraints

### Shared browser constraints

- `getUserMedia()` and `enumerateDevices()` require a secure context. Production must use HTTPS; local development may use `localhost`.
- Camera permission is user-controlled. A request may be denied, unavailable, interrupted, or left unanswered, so the UI needs bounded requesting and retry states rather than assuming immediate resolution.
- Use `ideal` constraints first and degrade gracefully. Hard `exact` constraints can cause `OverconstrainedError` on devices that otherwise have a usable camera.
- Device labels and non-default devices may be unavailable until permission is granted. Enumeration should be treated as progressive enhancement, not a prerequisite for the first permission prompt.
- Stop every old `MediaStreamTrack` before replacing a stream or leaving the camera screen.
- Wait for video metadata and non-zero intrinsic dimensions before calculating crop geometry or capturing.
- Keep camera access in a top-level page. Embedding introduces Permissions Policy and iframe permission requirements that are outside the MVP.

### iOS Safari

- Render the camera stream in a `<video muted playsInline>` element so it remains inline on iPhone and can play without an audio track.
- Begin permission and playback from a clear user action when required; do not assume background or automatic startup will succeed.
- Treat orientation changes, viewport resizing, page visibility changes, and interrupted tracks as normal lifecycle events. Recalculate geometry and provide a restart path.
- Do not assume permission persistence, stable device IDs, or complete labels across browser restarts and installed-PWA sessions.
- Test both browser-tab and standalone-PWA modes on a physical iPhone. Simulator-only validation is insufficient for camera behavior.

### Android Chrome

- Prefer `facingMode: { ideal: 'environment' }` or `'user'` for the first request, then use enumerated `deviceId` values only when a user-facing device picker or reliable switcher requires them.
- Expect phones with multiple rear lenses to expose device lists and labels differently. “Rear camera” is a product intent, not a guarantee of a specific physical lens.
- Stop the active stream before reacquiring another facing mode to avoid camera-busy failures on some devices.
- Recalculate preview and export geometry after orientation changes, viewport resizing, and stream setting changes.
- Test on at least one physical Android phone rather than relying only on desktop device emulation.

### HTTPS and GitHub Pages

- GitHub Pages supports HTTPS and HTTPS enforcement; the deployed camera must never be served through an HTTP or mixed-content path.
- The project site lives below a repository base path. Camera UI routes, Service Worker scope, GIF/PNG asset URLs, and future worker URLs must respect Vite's configured base instead of assuming `/`.
- GitHub Pages is static hosting. The MVP must not depend on a backend, runtime secrets, server-side image processing, or custom response headers.
- Keep camera and generated photos local to the browser. A future gallery should use IndexedDB, not the Service Worker cache, for user-created photo blobs.
- Same-origin assets avoid Canvas tainting. Future remote assets require explicit CORS review before they can be drawn into an export canvas.

Platform references:

- [MDN: `MediaDevices.getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: `MediaDevices.enumerateDevices()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices)
- [MDN: `HTMLVideoElement.videoWidth`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth)
- [MDN: `CanvasRenderingContext2D.drawImage()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)
- [Apple: Delivering video content for Safari](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari)
- [GitHub Docs: Securing a GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

## MVP non-goals

The first ClawdCam MVP is a focused still-photo experience. It does not aim to provide:

- multiple simultaneous Clawd overlays or group selection;
- visible resize boxes, rotation handles, snapping, guides, or alignment tools;
- text, drawing, filters, stickers from arbitrary sources, or background removal;
- undo/redo history or a persistent editable scene graph;
- video recording, animated GIF export, or animated overlays in the final still image;
- cloud sync, user accounts, a backend, collaborative editing, or server-side processing;
- professional color management, RAW capture, or complete EXIF preservation;
- identical access to every physical phone lens across browsers;
- desktop-class editing controls.

These non-goals do not prevent later tasks from adding a small local gallery, platform sharing, or a carefully reviewed advanced editor after the basic camera and single-overlay workflow is stable.

## Recommended Task 003 scope

Task 003 should implement only the native camera preview foundation:

- add a small browser camera adapter around `navigator.mediaDevices`;
- implement explicit camera states such as idle, requesting, ready, denied, unavailable, and recoverable error;
- render a muted, inline video preview;
- request a rear-facing camera by default and support a basic front/rear switch by stopping and reacquiring the stream;
- apply the documented front-camera preview mirror policy;
- handle permission denial, missing APIs, missing devices, unreadable devices, overconstrained requests, and interrupted tracks;
- clean up tracks on unmount and replacement;
- add unit tests with mocked media APIs plus a physical-device smoke-test checklist for iOS Safari and Android Chrome;
- keep the implementation behind the existing camera feature boundary.

Task 003 should not add `@use-gesture/react`, Canvas export, overlay state, Clawd assets, IndexedDB, a gallery, Web Share, or production visual polish. Keeping the task limited to a reliable camera lifecycle will make the later overlay and capture tasks smaller and independently reviewable.

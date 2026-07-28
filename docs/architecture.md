# Architecture

## Current foundation

ClawdCam keeps application composition, camera lifecycle, browser APIs, overlay interaction, styling, PWA behavior, quality tooling, and deployment concerns behind explicit boundaries. Task 004 adds one movable reference Clawd over the ready camera preview without introducing capture, storage, or sharing.

## Directory layout

```text
src/
  app/                       Application composition and app-level tests
  features/
    camera/
      cameraAdapter.ts       Native MediaDevices boundary and error mapping
      cameraTypes.ts         Camera domain types and explicit state model
      useCamera.ts           Request arbitration and stream lifecycle owner
      CameraView.tsx         Mobile-first camera and overlay composition UI
    overlay/
      overlayTypes.ts        Authoritative transform and asset descriptor types
      overlayGeometry.ts     Normalized coordinate and transform pure functions
      overlayAssets.ts       Single reference/test asset descriptor
      useOverlayController.ts ClawdCam-owned transform state
      useOverlayGestures.ts  @use-gesture/react event interpretation adapter
      OverlayPreview.tsx     DOM overlay rendered above the camera preview
  styles/                    Global styles and design tokens
  test/                      Shared test environment setup
public/
  assets/reference/          Derived reference/test Clawd PNG
  ...                        Static PWA placeholder assets
docs/                        Architecture and physical-device checklists
.github/workflows/            CI and GitHub Pages automation
```

## Runtime flow

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` registers the generated Service Worker and mounts React in Strict Mode.
3. `src/app/App.tsx` composes the camera feature UI.
4. `CameraView.tsx` renders camera state and owns the always-mounted overlay controller.
5. `useCamera()` owns request ordering, active-stream replacement, track interruption handling, and cleanup.
6. `cameraAdapter.ts` is the only camera module that calls `navigator.mediaDevices` directly.
7. Once camera state is `ready`, `OverlayPreview.tsx` renders inside the same clipped stage as the cover-fitted `<video>`.
8. `useOverlayGestures.ts` translates drag and pinch lifecycle data into ClawdCam geometry functions; it does not own persisted or authoritative transform state.
9. `vite-plugin-pwa` generates the web app manifest and Workbox Service Worker for production builds.

## Camera state and lifecycle

The camera state is a discriminated union rather than a loading flag plus an error string. It distinguishes `idle`, `requesting`, `ready`, `permission-denied`, `unsupported`, `unavailable`, `interrupted`, and `runtime-error`.

A request becomes `ready` only after all of the following are true:

1. `getUserMedia()` returned a stream.
2. At least one video input is available after permission-aware enumeration.
3. The stream is attached to the muted, inline `<video>` element.
4. Video metadata is available and both intrinsic dimensions are non-zero.

The complete startup sequence has a 20-second default deadline. A timeout invalidates the request, aborts metadata readiness, releases any active stream, enters a recoverable `runtime-error` state, and exposes retry. Because browsers cannot reliably cancel a pending `getUserMedia()` prompt, the original request coroutine remains responsible for stopping any stream that arrives after the deadline.

Each request receives a monotonically increasing request ID and an abort signal. Starting another request or reaching the startup deadline invalidates the old request before stopping its stream. A late result is stopped once and cannot replace newer state.

The lifecycle owner removes track listeners and stops every track before stream replacement, component unmount, or recovery from an error. Unexpected `ended` events move the state to `interrupted` and expose a restart action. This cleanup also makes React Strict Mode teardown safe.

## Overlay domain and gesture boundary

`OverlayTransform` is the authoritative ClawdCam state:

```ts
export interface OverlayTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

`x` and `y` are normalized coordinates in the visible camera stage, `scale` is a positive multiplier relative to the asset's canonical display width, and `rotation` is clockwise degrees normalized to `(-180, 180]`. Interaction policy permits a small bounded range outside `0...1`, allowing part of Clawd to sit beyond an edge.

The transform remains normalized when the CSS preview resizes or the phone rotates. Gesture movement is converted from CSS pixels using the current stage width and height. Device pixel ratio is intentionally absent from the interaction model. Rendering reads directly from `OverlayTransform`; no code reads a CSS matrix back from the DOM.

`@use-gesture/react` is limited to pointer/touch event interpretation. Gesture start captures the current authoritative transform in gesture memo state. Drag updates normalized `x` and `y`. Pinch updates scale and clockwise rotation while mapping pinch-origin movement so the overlay remains visually continuous. Gesture completion or cancellation leaves the latest valid transform in ClawdCam state and never applies spring or inertia behavior.

The single minimal asset descriptor records ID, label, preview URL, intrinsic dimensions, aspect ratio, anchor, and canonical display width. It is deliberately not a complete asset manifest or download/version migration protocol.

## Mirror boundary

The front-facing (`user`) preview receives a CSS mirror transform. The rear-facing (`environment`) preview does not. This is presentation state only: the `MediaStream` is never transformed or rewritten.

The Clawd overlay is a sibling layer above the video and is never placed inside the mirrored video transform. Front camera pixels mirror; Clawd does not. Task 005 must preserve this policy when composing camera pixels and the same `OverlayTransform` into Canvas output.

## Reference/test Clawd asset provenance

`public/assets/reference/clawd-reference-overlay.png` is a deterministic derivative of the project reference image `clawd-base-accurate-card.png`. It is a reference/test asset only and is not claimed to be final production Clawd artwork.

The derivation used exact pixel rules, without generative tools, redrawing, smoothing, proportion changes, or repairs:

1. Read the 620 × 420 reference image as RGBA.
2. Replace pixels with exact RGB `244, 242, 239` (the gray-white outer background) or `255, 255, 255` (white card/cutout regions) with transparent black `0, 0, 0, 0`.
3. Leave every remaining orange or black subject pixel unchanged.
4. Crop the original non-transparent bounds `x=60...559`, `y=47...371` to a 500 × 325 PNG whose alpha bounds are `x=0...499`, `y=0...324`.
5. Encode the RGBA PNG deterministically. The committed file SHA-256 is `0e3072de633ac933f12344f29620caf1f93a9c17d3d70ef4eba5dcb8cec26eb2`.

Automated tests decode the PNG, verify the dimensions, alpha bounds, opaque pixel count, allowed preserved colors, transparent background pixels, and digest.

## GitHub Pages base path

`vite.config.ts` reads `GITHUB_REPOSITORY` only inside GitHub Actions. It derives `/<repository-name>/` as Vite's production base, which makes built asset URLs work in both the WIP fork and the upstream repository. Local development uses `/`.

The reference asset URL is resolved from `import.meta.env.BASE_URL`, so `/assets/...` locally becomes `/clawd-cam-wip/assets/...` or the corresponding upstream Pages path in production.

## Quality gates

The `check` command and CI execute the same four gates:

1. ESLint
2. Prettier check
3. Vitest
4. TypeScript + Vite production build

Keeping the commands identical prevents CI-only validation behavior. Camera tests use a mock adapter and never request a real device.

## Planned feature boundaries

Task 005 will reuse the same normalized `OverlayTransform` and asset geometry for native Canvas 2D composition. It must not infer placement from DOM transforms.

Later tasks may add local gallery persistence and sharing behind small adapters. Task 004 deliberately does not add a shutter, screenshot capture, Canvas composition, Blob output, GIF decoding, production `preview.gif`/`capture.png` pairs, a multi-asset selector, IndexedDB, downloads, Web Share, filters, undo/redo, text, or multiple layers.

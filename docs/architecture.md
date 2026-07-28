# Architecture

## Current foundation

ClawdCam keeps application composition, camera lifecycle, browser APIs, styling, PWA behavior, quality tooling, and deployment concerns behind explicit boundaries. Task 003 adds the first native camera preview without introducing capture, overlays, storage, or sharing.

## Directory layout

```text
src/
  app/                    Application composition and app-level tests
  features/
    camera/
      cameraAdapter.ts    Native MediaDevices boundary and error mapping
      cameraTypes.ts      Camera domain types and explicit state model
      useCamera.ts        Request arbitration and stream lifecycle owner
      CameraView.tsx      Mobile-first camera UI
  styles/                 Global styles and design tokens
  test/                   Shared test environment setup
public/                    Static PWA placeholder assets
docs/                      Architecture and contributor documentation
.github/workflows/         CI and GitHub Pages automation
```

## Runtime flow

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` registers the generated Service Worker and mounts React in Strict Mode.
3. `src/app/App.tsx` composes the camera feature UI.
4. `CameraView.tsx` renders state and sends user actions to `useCamera()`.
5. `useCamera()` owns request ordering, active-stream replacement, track interruption handling, and cleanup.
6. `cameraAdapter.ts` is the only camera module that calls `navigator.mediaDevices` directly.
7. `vite-plugin-pwa` generates the web app manifest and Workbox Service Worker for production builds.

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

## Mirror boundary

The front-facing (`user`) preview receives a CSS mirror transform. The rear-facing (`environment`) preview does not. This is presentation state only: the `MediaStream` is never transformed or rewritten. A later Canvas exporter must implement its own documented export mirror policy.

## GitHub Pages base path

`vite.config.ts` reads `GITHUB_REPOSITORY` only inside GitHub Actions. It derives `/<repository-name>/` as Vite's production base, which makes built asset URLs work in both the WIP fork and the upstream repository. Local development uses `/`.

## Quality gates

The `check` command and CI execute the same four gates:

1. ESLint
2. Prettier check
3. Vitest
4. TypeScript + Vite production build

Keeping the commands identical prevents CI-only validation behavior.

## Planned feature boundaries

Later tasks may add overlay manipulation, capture composition, local gallery persistence, and sharing. Those modules should continue to depend on browser APIs through small adapters.

Task 003 deliberately does not add screenshot capture, Canvas composition, Clawd assets, gesture dependencies, IndexedDB, gallery behavior, downloads, or Web Share.

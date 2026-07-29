# ClawdCam

ClawdCam is a local-first, mobile-oriented Progressive Web App for composing a still photo with a draggable, scalable, and rotatable Clawd overlay. The current `0.1.0` build is a pre-release MVP: it can open a browser camera, capture the composed frame, keep a user-selected photo in a browser-local gallery, and offer user-initiated download or Web Share when the browser supports file sharing.

The overlay bundled with this MVP is clearly marked **reference/test artwork**. It is included to validate the camera and composition flow; it is not final production Clawd artwork. The install icons are separate, project-owned MVP branding and do not reuse the reference overlay.

## Use the MVP

1. Open ClawdCam over HTTPS, or use `localhost` during development.
2. Choose **Start camera** and respond to the browser permission prompt.
3. Switch front/rear cameras when the browser exposes more than one video input.
4. Drag the reference Clawd with one pointer; use two pointers to scale and rotate it.
5. Choose **Take photo**. The result is composed locally in Canvas and initially exists only in memory.
6. Choose **Retake**, **Save to gallery**, **Download**, or **Share**.
7. Open **Gallery** to view, open, download/share, or delete photos saved in this browser.

Camera and Gallery are independent views. A camera error does not delete the local gallery, and an unavailable gallery does not prevent an in-memory capture.

## Storage, privacy, and browser differences

Camera access requires a secure context: HTTPS in production or `localhost` for development. Permission, camera switching, front-camera mirroring, Web Share, download handling, install prompts, private browsing, and storage retention vary by browser and device.

ClawdCam does not upload camera frames or photos. A captured photo remains in memory unless you explicitly choose **Save to gallery**, which writes the full image and a thumbnail to this browser/PWA profile's IndexedDB. Clearing site data, uninstalling the PWA, private-browsing policy, or browser storage eviction may remove that local gallery.

Download and Share run only after a direct user action. ClawdCam does not automatically save to the system photo library, does not upload to cloud storage, and does not collect analytics or telemetry. Deleting a gallery item deletes its local IndexedDB record.

The app shell and static assets are designed to reopen offline after a successful online load. Previously saved IndexedDB gallery entries should remain readable offline. Camera behavior while offline is browser/device-dependent and is not promised as an offline capability. User photos are never copied into Service Worker Cache Storage.

## Installability and updates

The production build provides a manifest, project-owned 192 px and 512 px icons, and a generated Workbox Service Worker with repository-base-path-safe URLs. The app uses `display: standalone`.

The Service Worker uses the plugin's automatic-update policy: a new build can download and activate without a custom update prompt. The current page is not deliberately force-reloaded by application code. Do not begin a release deployment while relying on an in-progress camera/capture/save operation to survive a page or browser lifecycle change.

Real installation, standalone relaunch, storage retention, Share Sheet behavior, and physical camera behavior remain manual-device checks. See [MVP device validation](docs/mvp-device-validation.md).

## Development

Requirements:

- Node.js 22.12 or newer; CI verifies Node 22 and Node 24
- npm with the committed `package-lock.json`

```bash
npm ci
npm run dev
npm run check
npm run build
```

Additional command:

```bash
npm run validate:pwa
```

`npm run check` runs linting, formatting verification, all Vitest tests, a TypeScript/Vite production build, and local plus GitHub Pages PWA artifact validation. Automated tests use mocked camera, storage, sharing, object-URL, and download boundaries; they never request a real camera, open a real Share Sheet, or write to a real download directory.

## GitHub Pages deployment

Repository Pages settings must use **GitHub Actions** as the source. `.github/workflows/deploy-pages.yml` deploys only from `main` or manual dispatch, runs the full release checks, builds with the current repository name as the Vite base path, validates `dist`, uploads only `dist`, and then deploys the Pages artifact.

The production base path is derived from `GITHUB_REPOSITORY`; neither the WIP fork name nor a future upstream repository name is hard-coded into application metadata.

## Release evidence

- [MVP release checklist](docs/mvp-release-checklist.md)
- [MVP device validation matrix](docs/mvp-device-validation.md)
- [Machine-readable MVP status](docs/mvp-release-status.json)
- [Camera device smoke test](docs/camera-device-smoke-test.md)
- [Overlay device smoke test](docs/overlay-device-smoke-test.md)
- [Capture device smoke test](docs/capture-device-smoke-test.md)
- [Gallery device smoke test](docs/gallery-device-smoke-test.md)
- [Sharing/download device smoke test](docs/sharing-device-smoke-test.md)
- [Architecture](docs/architecture.md)

## Current non-goals

The MVP does not include flash, zoom controls, video, filters, text, multiple layers, undo/redo, a production dynamic Clawd asset pack, multiple Clawd selection, cloud sync, accounts, a backend, analytics, telemetry, crash-reporting SDKs, push notifications, Web Share Target, file handlers, automatic system-photo saving, File System Access API integration, npm publishing, a Git tag, or a GitHub Release.

## License

ClawdCam is licensed under the [MIT License](LICENSE). Direct runtime dependencies are React/React DOM (MIT), `@use-gesture/react` (MIT), and `idb` (ISC), as recorded by the committed lockfile. Reference repositories are design/implementation evidence only; their source is not vendored into this repository.

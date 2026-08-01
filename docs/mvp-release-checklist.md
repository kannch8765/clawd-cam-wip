# ClawdCam MVP release checklist

This document defines the release contract for the `0.1.0` pre-release MVP. Automated checks validate source and build artifacts; they do **not** prove real camera hardware, browser permission UI, PWA installation, a platform Share Sheet, download destinations, storage eviction, or operating-system lifecycle behavior.

Release decision: **READY_WITH_MANUAL_DEVICE_CHECKS**

Physical-device validation: **PASS_WITH_NOTES** for the deployed `c684843e619f493d676992ab29eaec13f6b5d13e` IOS-PWA blocker retest on 2026-08-01.

Automated validation for this repair branch: **PASS_GITHUB_CI_NODE_22_24**.

The targeted iPhone 15 Pro installed-PWA retest closed all five release-blocking regressions. Remaining environments and manual scenarios keep their explicit `NOT_RUN` status. The low-height landscape shutter overlay is recorded as non-blocking mobile camera UI/UX debt.

## Repository and CI

- [x] **PASS:** Node 22 and Node 24 each completed `npm ci` and `npm run check`; see `docs/device-validation-ci-evidence.json`.
- [x] `package-lock.json` is committed and `npm ci` is the installation contract.
- [x] CI runs on Node 22 and Node 24.
- [x] `npm run check` covers ESLint, Prettier, Vitest, TypeScript/Vite build, and PWA artifact validation.
- [x] Vite produces a manifest and generated Service Worker.
- [x] Pages deployment uploads only the validated `dist` directory.
- [x] The artifact validator rejects source maps, test files, local absolute paths, token-like secrets, private user-image URLs, and the reference source filename.
- [x] Validation temporary directories are removed; no generated audit output is committed.
- [x] The project is MIT licensed.
- [x] Direct runtime dependencies recorded in the lockfile are React/React DOM (MIT), `@use-gesture/react` (MIT), and `idb` (ISC).
- [x] Reference repositories remain documented evidence; their code and artwork are not vendored.

## Deployment

- [x] GitHub Pages source is **GitHub Actions**.
- [x] Formal deployment runs only from `main` or an explicit manual dispatch.
- [x] The production base path is derived from `GITHUB_REPOSITORY`, not a hard-coded WIP or upstream name.
- [x] Production is served over GitHub Pages HTTPS.
- [x] `manifest.webmanifest`, icon URLs, JavaScript, CSS, and the runtime reference overlay resolve within the repository base path.
- [x] Manifest `start_url` and `scope` equal the configured base path and cannot escape it.
- [x] Direct root navigation and root refresh use Workbox `navigateFallback`.
- [x] Standalone launch begins inside the same scope.
- [x] Both local `/` and Pages `/<repository>/` builds are artifact-validated.
- [x] Old Workbox caches are eligible for cleanup through `cleanupOutdatedCaches`.
- [x] Hashed chunks are precached per build; no custom stale runtime cache is added.
- [x] **PASS:** the repair build was deployed from `c684843e619f493d676992ab29eaec13f6b5d13e` by Pages workflow run [`30536547832`](https://github.com/kannch8765/clawd-cam-wip/actions/runs/30536547832); both the build and deploy jobs succeeded.
- [x] **PASS_WITH_NOTES:** the deployed repair build was installed and reopened as an iPhone 15 Pro standalone PWA.
- [ ] Deploy an update over an installed older build and record activation/relaunch behavior. Status: `NOT_RUN`.

Update policy: `vite-plugin-pwa` uses `registerType: autoUpdate`; the application registers immediately. A new worker may download and activate without a custom prompt. Application code does not force an immediate page reload. A browser lifecycle change or user reload can still interrupt an in-progress camera/capture/save operation, so deployments must not be described as transaction-preserving across page replacement.

## Functional MVP

Automated code tests cover the stated boundaries with injected/mocked browser services. Physical behavior remains grounded only in the device matrix and structured evidence.

- [x] Camera permission is requested only after an explicit Start action.
- [x] Front/rear selection and device switching have bounded failure/retry behavior.
- [x] Front preview mirroring is distinct from final capture composition.
- [x] Reference Clawd drag, pinch-scale, and rotate use normalized transforms.
- [x] Canvas capture freezes camera, crop, output, overlay transform, and timestamp.
- [x] Retake replaces the in-memory result without deleting a saved record.
- [x] Save to gallery is explicit and atomic across full record and summary.
- [x] Gallery list reads thumbnails; detail reads one full-size record; delete is confirmed.
- [x] Download uses the original full-size Blob and a short-lived object URL.
- [x] Web Share file capability is checked before showing Share.
- [x] Unsupported/rejected Web Share leaves Download as the fallback for a valid photo.
- [x] **PASS_WITH_NOTES:** the deployed IOS-PWA retest closed portrait shutter reachability, Gallery thumbnail rendering, Camera → Gallery stream cleanup, permission-denial recovery, and landscape output orientation.
- [ ] iPhone Safari tab full matrix. Status: `NOT_RUN`.
- [ ] Android Chrome tab and installed-PWA matrices. Status: `NOT_RUN`.
- [ ] Desktop Chromium and Firefox matrices. Status: `NOT_RUN`.

## Failure and recovery

- [x] Permission denial, camera unavailable, bounded request timeout, track interruption, and runtime errors expose retry/restart actions.
- [x] Reference-overlay decode failure exposes a retry without requesting a new stream.
- [x] Canvas/context/decode/Blob failures leave the app recoverable and do not report a photo as captured.
- [x] IndexedDB unsupported/unavailable leaves Camera and in-memory capture usable.
- [x] Quota failure leaves the capture visible and permits a later retry.
- [x] Corrupt summaries are skipped; a corrupt detail record reports an explicit error.
- [x] Share cancellation is non-fatal; share errors leave Download available for valid photos.
- [x] Download DOM/object-URL failures are contained and clean up their temporary URL.
- [x] Offline policy keeps the shell/static assets and previously saved IndexedDB gallery readable; Camera is not promised offline.
- [x] Service Worker precache is versioned by generated revisions and outdated caches are cleaned.
- [x] **PASS:** permission denial displayed **Permission denied** without Clawd or a false ready state; restoring permission and retrying recovered to a real preview and successful capture.
- [x] **PASS:** Camera → Gallery released the MediaStream and cleared the iOS camera-use indicator.
- [x] **PASS:** offline cold reopen, Download to Files, Web Share, and share cancellation were previously observed on the same IOS-PWA device baseline.
- [ ] Storage eviction and private-mode behavior. Status: `NOT_RUN`.
- [ ] Service Worker cross-version upgrade recovery. Status: `NOT_RUN`.

## Accessibility

- [x] The document has one main `h1`; Camera, capture result, Gallery, and detail surfaces have named `h2` headings.
- [x] Camera/Gallery navigation exposes `aria-current` and controlled-surface IDs.
- [x] Hidden Camera content uses the HTML `hidden` attribute and is not keyboard-interactive.
- [x] View switches, capture result, gallery detail, back navigation, and successful delete move focus to a meaningful heading/tile.
- [x] The live video has an accessible label; the pointer-only overlay does not create a meaningless tab stop.
- [x] Shutter, Save, Share, Download, Retake, Back, and Delete controls have explicit accessible names.
- [x] Busy/disabled controls expose native disabled state and sharing groups expose `aria-busy`.
- [x] Success, progress, cancellation, and failure feedback use status/alert live regions.
- [x] Gallery tiles are native buttons with descriptive names; decorative thumbnails use empty alt text.
- [x] Delete confirmation names the local-device effect and has a screen-reader description.
- [x] Visible focus applies across navigation, tiles, and all action button styles.
- [x] Touch controls have a minimum target height of approximately 44 CSS px.
- [x] Layout removes the 320 px minimum-width trap, wraps long text/actions, and constrains media to the viewport.
- [x] Safe-area insets, low-height landscape, 200% zoom/narrow layout, and reduced-motion CSS contracts are present.
- [x] Status is not communicated by color alone and no action depends on hover.
- [x] **PASS:** portrait live composition and the shutter were simultaneously visible and usable on the installed iPhone PWA.
- [x] **PASS_WITH_NOTES:** the low-height landscape shutter remained reachable but overlaid a large portion of the live composition; the control did not enter the captured image.
- [ ] Screen reader run. Status: `NOT_RUN`.
- [ ] Contrast tooling. Status: `NOT_RUN`.
- [ ] OS text enlargement, 200% zoom, and 320 CSS px run. Status: `NOT_RUN`.

## Privacy and local data

- [x] Camera streams and captured photos are not uploaded.
- [x] A new capture exists only in memory until the user chooses **Save to gallery**.
- [x] Only explicit Save writes the full Blob and thumbnail to IndexedDB.
- [x] Share and Download begin only from direct user actions.
- [x] The app does not automatically save to the system photo library.
- [x] The app has no cloud upload, accounts, analytics, or telemetry.
- [x] Delete removes the selected local full record and summary.
- [x] README warns that site-data clearing, eviction, uninstall, and private browsing may remove or alter local storage.
- [x] Service Worker precache contains static build assets only.
- [x] User photo Blobs, object URLs, camera streams, and IndexedDB payloads are not placed in Cache Storage.
- [x] Tests use synthetic Blobs; CI/Pages do not upload photo artifacts.
- [x] Console/storage/share code does not log File/Blob/record payloads.

## PWA icons and reference-asset isolation

- [x] The original neutral camera geometry was reviewed and explicitly adopted as simple, non-generative, project-owned MVP branding; it is no longer treated as an unreviewed placeholder.
- [x] 192 px and 512 px PNG dimensions, alpha capability, declarations, and existence are automatically checked.
- [x] The 512 px artwork keeps maskable-safe padding.
- [x] Install branding does not reuse the reference/test Clawd overlay.
- [x] UI and documentation call the bundled overlay reference/test artwork, not production artwork.
- [x] Only `assets/reference/clawd-reference-overlay.png` is required at runtime.
- [x] `clawd-base-accurate-card.png` is rejected from the production artifact.
- [x] No external icon or unrecorded third-party artwork is copied.

## CI and Pages workflow audit

- [x] CI permissions are `contents: read`.
- [x] CI uses lockfile-backed npm cache, `npm ci`, Node 22/24, concurrency cancellation, and a job timeout.
- [x] Fork pull requests receive no repository secrets.
- [x] CI uploads no artifact.
- [x] Pages build and deploy are separate jobs.
- [x] Build has read-only contents permission; deploy alone receives Pages/OIDC write permissions.
- [x] Pages uses Node 24, npm cache, `npm ci`, and `npm run check`.
- [x] A failed check/build prevents artifact upload and deployment.
- [x] Deployment concurrency prefers the newest valid `main` build.
- [x] No custom domain, preview host, environment secret, or third-party deployment service is added.

## Browser smoke automation decision

Playwright is **not introduced**. Existing Vitest injection boundaries already exercise camera, composition, gallery, sharing, focus, and hidden-view DOM behavior without downloading a browser binary. A small static artifact validator supplies the missing manifest, Service Worker, icon, base-path, privacy, release-policy, and structured device-evidence checks. Real camera, install, offline lifecycle, Share Sheet, download destination, and operating-system background/resume behavior remain correctly assigned to physical-device validation instead of being simulated as proof.

## Version and release metadata

- [x] Package version remains `0.1.0`.
- [x] README and status file identify it as a pre-release MVP.
- [x] Manifest/README application name is `ClawdCam`.
- [x] No npm publish, Git tag, GitHub Release, or mutable timestamp is created.

## Release decision

**READY_WITH_MANUAL_DEVICE_CHECKS**

The deployed `c684843e619f493d676992ab29eaec13f6b5d13e` iPhone 15 Pro installed-PWA blocker retest is **PASS_WITH_NOTES**. All five release-blocking regressions are closed:

- portrait preview and shutter are simultaneously visible and usable;
- persisted IOS-PWA Gallery thumbnails render normally;
- Camera → Gallery releases the MediaStream;
- permission denial reports **Permission denied** without Clawd or a false ready state, and retry recovers;
- landscape capture produces landscape pixels (`1439 x 1080`) without EXIF Orientation dependency.

Non-blocking UI/UX debt:

- In low-height landscape, the sticky **Take photo** action overlays a large portion of the live composition. It remains reachable, does not enter the captured image, and should receive separately scoped mobile camera UX research and polish.

Remaining manual coverage keeps its explicit `NOT_RUN` status:

- iPhone Safari tab full matrix;
- Android tab and installed PWA;
- desktop Chromium and Firefox;
- keyboard and screen reader accessibility;
- visible focus, contrast, 200 percent zoom, and text enlargement;
- Service Worker cross-version upgrade.

The release must not be presented as fully device-validated across every matrix row. The reference/test Clawd must not be described as final production artwork. A future release becomes blocked if automated checks fail or if any newly observed release-blocking regression is unresolved.

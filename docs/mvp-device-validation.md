# ClawdCam MVP device validation

Automated tests do not prove real camera hardware, browser permission UI, installed-PWA behavior, persistent storage policy, Web Share, or download destinations. Fill this matrix only from a deployed HTTPS build and preserve evidence links or notes. Do not change a result from `NOT_RUN` without recording device/browser versions, deployment URL, commit SHA, tester, and date.

Allowed result values: `NOT_RUN`, `PASS`, `PASS_WITH_NOTES`, `FAIL`, `BLOCKED`.

## Environment matrix

| ID       | Device        | OS version | Browser version                       | Mode          | Deployment URL                              | Commit SHA                                 | Tester  | Date       | Result          | Evidence / notes                                                                                                                                                    |
| -------- | ------------- | ---------- | ------------------------------------- | ------------- | ------------------------------------------- | ------------------------------------------ | ------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IOS-TAB  | iPhone        | NOT_RUN    | Safari NOT_RUN                        | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN         | A supplemental Chrome iOS observation is recorded below, but it is not an IOS-TAB Safari run.                                                                       |
| IOS-PWA  | iPhone 15 Pro | iOS 26.5.2 | Safari/WebKit bundled with iOS 26.5.2 | installed PWA | https://kannch8765.github.io/clawd-cam-wip/ | `c684843e619f493d676992ab29eaec13f6b5d13e` | ゆう    | 2026-08-01 | PASS_WITH_NOTES | The five release-blocking regressions passed. The reachable landscape shutter overlays a large portion of the live composition and remains non-blocking UI/UX debt. |
| AND-TAB  | Android phone | NOT_RUN    | Chrome NOT_RUN                        | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN         | NOT_RUN                                                                                                                                                             |
| AND-PWA  | Android phone | NOT_RUN    | Chrome/WebView NOT_RUN                | installed PWA | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN         | NOT_RUN                                                                                                                                                             |
| CHROMIUM | Desktop       | NOT_RUN    | Chrome or Edge NOT_RUN                | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN         | NOT_RUN                                                                                                                                                             |
| FIREFOX  | Desktop       | NOT_RUN    | Firefox NOT_RUN                       | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN         | NOT_RUN                                                                                                                                                             |

## Camera and composition matrix

| ID       | Camera  | Switch camera | Front mirror | Overlay drag | Overlay pinch | Overlay rotate | Capture WYSIWYG | Retake  | Orientation change | Background / resume | Camera indicator / track cleanup | Result / notes                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ------- | ------------- | ------------ | ------------ | ------------- | -------------- | --------------- | ------- | ------------------ | ------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IOS-TAB  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN                                                                                                                                                                                                                                                                                                                                                                                   |
| IOS-PWA  | PASS    | PASS          | PASS         | PASS         | PASS          | PASS           | PASS            | PASS    | PASS               | PASS                | PASS                             | PASS_WITH_NOTES. Portrait composition and shutter were simultaneously visible. Permission denial showed `Permission denied` without Clawd or a false ready state; restoring permission and retrying recovered. Camera → Gallery released the stream. Landscape output was 1439 x 1080 without EXIF Orientation dependency. The landscape shutter overlay remains non-blocking UI/UX debt. |
| AND-TAB  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN                                                                                                                                                                                                                                                                                                                                                                                   |
| AND-PWA  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN                                                                                                                                                                                                                                                                                                                                                                                   |
| CHROMIUM | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN                                                                                                                                                                                                                                                                                                                                                                                   |
| FIREFOX  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN                                                                                                                                                                                                                                                                                                                                                                                   |

## Gallery, offline, download, and sharing matrix

| ID       | Gallery save | Persistence after restart | Gallery list/detail | Gallery delete | Offline shell | Offline gallery | Download | Web Share | Share cancellation | Install / reopen | Result / notes                                                                                                                                                                                                                                                                                          |
| -------- | ------------ | ------------------------- | ------------------- | -------------- | ------------- | --------------- | -------- | --------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IOS-TAB  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | N/A              | NOT_RUN                                                                                                                                                                                                                                                                                                 |
| IOS-PWA  | PASS         | PASS                      | PASS                | PASS           | PASS          | PASS            | PASS     | PASS      | PASS               | PASS             | PASS. The targeted retest confirmed newly saved Gallery list thumbnails render normally; the earlier installed-PWA run already covered persistence, full-size detail, delete/non-resurrection, offline cold reopen, Download to Files, Web Share, share cancellation/retry, and Share Sheet Save Image. |
| AND-TAB  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | N/A              | NOT_RUN                                                                                                                                                                                                                                                                                                 |
| AND-PWA  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | NOT_RUN          | NOT_RUN                                                                                                                                                                                                                                                                                                 |
| CHROMIUM | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | optional         | NOT_RUN                                                                                                                                                                                                                                                                                                 |
| FIREFOX  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | optional         | NOT_RUN                                                                                                                                                                                                                                                                                                 |

## Accessibility and responsive matrix

| ID       | Keyboard navigation | Screen reader | Visible focus | Accessible names / live status | 200% zoom | 320 CSS px / text enlargement | Landscape low height | Safe area / home indicator | Contrast | Accessibility notes / result                                                                                                                                                                                    |
| -------- | ------------------- | ------------- | ------------- | ------------------------------ | --------- | ----------------------------- | -------------------- | -------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IOS-TAB  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                                                                                                                                                                                                         |
| IOS-PWA  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | PASS_WITH_NOTES      | PASS                       | NOT_RUN  | Portrait reachability passed. In low-height landscape, the shutter remained reachable but overlaid a large portion of the live composition. This is non-blocking UI/UX debt, not a completed accessibility run. |
| AND-TAB  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                                                                                                                                                                                                         |
| AND-PWA  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | NOT_RUN                    | NOT_RUN  | NOT_RUN                                                                                                                                                                                                         |
| CHROMIUM | NOT_RUN             | optional      | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                                                                                                                                                                                                         |
| FIREFOX  | NOT_RUN             | optional      | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                                                                                                                                                                                                         |

## 2026-08-01 IOS-PWA blocker retest

Deployed build:

- URL: `https://kannch8765.github.io/clawd-cam-wip/`
- Deployed commit: `c684843e619f493d676992ab29eaec13f6b5d13e`
- Source repair commit: `9d4807ef86d383e429759dc22c844c6f2154684e`
- Pages workflow run: [`30536547832`](https://github.com/kannch8765/clawd-cam-wip/actions/runs/30536547832) (build and deploy jobs succeeded)
- Device: iPhone 15 Pro
- OS: iOS 26.5.2
- Mode: installed PWA using Safari/WebKit bundled with iOS 26.5.2
- Tester: ゆう
- Date: 2026-08-01
- Scope: targeted retest of the five release-blocking regressions
- Overall result: **PASS_WITH_NOTES**
- Structured evidence: `docs/device-validation-ios-pwa-evidence.json`

### Five release-blocking regressions

1. **PASS — Portrait preview and shutter reachability.** Live composition and **Take photo** were simultaneously visible and usable without scrolling the preview out of view.
2. **PASS — Gallery thumbnail rendering.** A newly saved capture rendered as a normal Gallery list thumbnail rather than a persistent black block.
3. **PASS — Camera track cleanup.** Camera → Gallery released the MediaStream and the iOS camera-use indicator stopped.
4. **PASS — Permission denial and retry.** Denial displayed **Permission denied** without Clawd or a false ready state. Restoring permission and retrying returned to a real preview and successful capture.
5. **PASS — Landscape output orientation.** The installed PWA produced a 1439 x 1080 landscape image, with width greater than height and no EXIF Orientation correction dependency.

### Non-blocking note

In low-height landscape, the sticky **Take photo** control remains reachable but overlays a large portion of the live composition. It does not enter the captured image. This is recorded as separately scoped mobile camera UI/UX research and polish debt and does not reopen the five release blockers.

## 2026-07-30 IOS-PWA baseline run

Baseline deployed build:

- URL: `https://kannch8765.github.io/clawd-cam-wip/`
- Commit: `33e4e079c6046f9354d29e8a4018c8f9c11f0c1c`
- Device: iPhone 15 Pro
- OS: iOS 26.5.2
- Mode: installed PWA using Safari/WebKit bundled with iOS 26.5.2
- Primary orientation: portrait; an additional landscape capture was performed
- Tester: ゆう
- Date: 2026-07-30
- Overall result: **FAIL**

### Passed observations from the baseline run

- The PWA opened independently from the Home Screen without a Safari address bar.
- The first launch did not request camera permission until **Start camera** was tapped.
- Rear-camera start/capture and front/rear switching worked.
- Front preview and final photo used the same mirrored direction.
- Single-pointer drag, two-pointer scale, and two-pointer rotation worked, including near-inverted placement.
- **Reset Clawd** restored the default size and center.
- Portrait capture preserved the visible Clawd position, scale, and rotation.
- **Retake** restored live preview and a second photo did not retain the first result.
- Moving to another app displayed an interrupted state; returning restored the camera and allowed another capture.
- Save, full-size detail, persistence after full termination, delete, non-resurrection after Reload/relaunch, Download to Files, Web Share, share cancellation/retry, and Share Sheet **Save Image** to Photos worked.
- After one online Gallery visit, airplane mode plus Wi-Fi off and a full PWA termination still allowed an offline cold launch of the shell, Gallery list, and saved full-size detail.
- Installed-PWA close/reopen worked and the Home Indicator area had no abnormal large bottom gap.

### Historical release-blocking failures on the baseline commit

1. Portrait composition and shutter were not simultaneously visible.
2. Gallery list thumbnails were persistent black blocks.
3. Camera → Gallery left the MediaStream active.
4. Cancelled startup could falsely report ready with a black preview and Clawd.
5. Landscape capture produced portrait JPEG pixel dimensions without EXIF correction.

All five failures above were closed by the 2026-08-01 deployed retest. They remain here as historical baseline evidence.

## Supplemental Chrome iOS observation

Chrome `148.0.7778.100` was also observed in an iOS tab. Because every iOS browser uses the platform WebKit engine and this was not the complete Safari IOS-TAB procedure, it is supplemental evidence only and does **not** change `IOS-TAB` from `NOT_RUN`.

## Per-run procedure

1. Confirm the URL is HTTPS and the commit matches the recorded SHA.
2. First load online; inspect the manifest and installability surface.
3. Exercise permission denial/cancellation, retry, camera ready, switch, front mirror, overlay gestures, capture, Retake, Save, Gallery, Delete, Download, Share, and Share cancellation.
4. Close/reopen the tab or installed PWA and verify gallery persistence.
5. Load Gallery once, go offline, fully reload/reopen where the platform permits, and verify the app shell plus saved gallery. Do not mark Camera as an offline pass merely because one browser kept an already-open stream.
6. Change orientation and background/resume during safe checkpoints. Confirm camera tracks/indicators stop after leaving or closing the app.
7. Verify keyboard/focus behavior, screen-reader announcements, 200% zoom, system text enlargement, narrow width, low-height landscape, and safe-area placement.
8. Record actual download filename/location and Share Sheet target behavior without claiming that a resolved share permanently saved the image.
9. Inspect storage/cache: user photos belong only to IndexedDB; Cache Storage must contain no captured photo or object URL.
10. Attach screenshots, screen recordings, browser diagnostics, or concise reproduction notes for every `FAIL`, `BLOCKED`, or `PASS_WITH_NOTES`.

## Service Worker upgrade run

This is a separate required manual scenario and remains `NOT_RUN`.

| Old deployed commit | New deployed commit | Tab / installed PWA | New worker downloaded | Activation point | Forced refresh observed | Camera/capture/save interruption | Old cache cleanup | Result  | Evidence |
| ------------------- | ------------------- | ------------------- | --------------------- | ---------------- | ----------------------- | -------------------------------- | ----------------- | ------- | -------- |
| NOT_RUN             | NOT_RUN             | NOT_RUN             | NOT_RUN               | NOT_RUN          | NOT_RUN                 | NOT_RUN                          | NOT_RUN           | NOT_RUN | NOT_RUN  |

# ClawdCam MVP device validation

Automated tests do not prove real camera hardware, browser permission UI, installed-PWA behavior, persistent storage policy, Web Share, or download destinations. Fill this matrix only from a deployed HTTPS build and preserve evidence links or notes. Do not change a result from `NOT_RUN` without recording device/browser versions, deployment URL, commit SHA, tester, and date.

Allowed result values: `NOT_RUN`, `PASS`, `PASS_WITH_NOTES`, `FAIL`, `BLOCKED`.

## Environment matrix

| ID       | Device        | OS version | Browser version                       | Mode          | Deployment URL                              | Commit SHA                                 | Tester  | Date       | Result  | Evidence / notes                                                                                                                                            |
| -------- | ------------- | ---------- | ------------------------------------- | ------------- | ------------------------------------------- | ------------------------------------------ | ------- | ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IOS-TAB  | iPhone        | NOT_RUN    | Safari NOT_RUN                        | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN | A supplemental Chrome iOS observation is recorded below, but it is not an IOS-TAB Safari run.                                                               |
| IOS-PWA  | iPhone 15 Pro | iOS 26.5.2 | Safari/WebKit bundled with iOS 26.5.2 | installed PWA | https://kannch8765.github.io/clawd-cam-wip/ | `33e4e079c6046f9354d29e8a4018c8f9c11f0c1c` | ゆう    | 2026-07-30 | FAIL    | Portrait capture reachability, gallery thumbnails, camera cleanup, cancelled startup recovery, and landscape output failed. Full reproduction notes follow. |
| AND-TAB  | Android phone | NOT_RUN    | Chrome NOT_RUN                        | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN | NOT_RUN                                                                                                                                                     |
| AND-PWA  | Android phone | NOT_RUN    | Chrome/WebView NOT_RUN                | installed PWA | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN | NOT_RUN                                                                                                                                                     |
| CHROMIUM | Desktop       | NOT_RUN    | Chrome or Edge NOT_RUN                | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN | NOT_RUN                                                                                                                                                     |
| FIREFOX  | Desktop       | NOT_RUN    | Firefox NOT_RUN                       | tab           | NOT_RUN                                     | NOT_RUN                                    | NOT_RUN | NOT_RUN    | NOT_RUN | NOT_RUN                                                                                                                                                     |

## Camera and composition matrix

| ID | Camera | Switch camera | Front mirror | Overlay drag | Overlay pinch | Overlay rotate | Capture WYSIWYG | Retake | Orientation change | Background / resume | Camera indicator / track cleanup | Result / notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IOS-TAB | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| IOS-PWA | PASS_WITH_NOTES | PASS | PASS | PASS | PASS | PASS | PASS_WITH_NOTES | PASS | FAIL | PASS | FAIL | Rear camera, switching, mirrored front preview/result, drag/pinch/near-inverted rotation, reset, portrait WYSIWYG, Retake, and background/resume passed. Cancelling the iOS camera startup surface produced a false ready black preview. Portrait preview and shutter were not simultaneously visible. Landscape capture produced portrait pixel dimensions without an EXIF orientation correction. Camera remained active after switching to Gallery. |
| AND-TAB | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| AND-PWA | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| CHROMIUM | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| FIREFOX | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |

## Gallery, offline, download, and sharing matrix

| ID       | Gallery save | Persistence after restart | Gallery list/detail | Gallery delete | Offline shell | Offline gallery | Download | Web Share | Share cancellation | Install / reopen | Result / notes |
| -------- | ------------ | ------------------------- | ------------------- | -------------- | ------------- | --------------- | -------- | --------- | ------------------ | ---------------- | -------------- |
| IOS-TAB  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | N/A              | NOT_RUN        |
| IOS-PWA  | PASS         | PASS                      | FAIL                | PASS           | PASS          | PASS            | PASS     | PASS      | PASS               | PASS             | FAIL           | Save and persistence passed, including full PWA termination. Full-size detail was correct, but every list thumbnail was a persistent black block across Reload, restart, and offline reopen. Delete did not resurrect after Reload or full restart. Download entered Files. Web Share and cancellation recovery passed; choosing Save Image in the Share Sheet placed the photo in Photos. Offline cold launch loaded the shell, list, and full detail. |
| AND-TAB  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | N/A              | NOT_RUN        |
| AND-PWA  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | NOT_RUN          | NOT_RUN        |
| CHROMIUM | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | optional         | NOT_RUN        |
| FIREFOX  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | optional         | NOT_RUN        |

## Accessibility and responsive matrix

| ID | Keyboard navigation | Screen reader | Visible focus | Accessible names / live status | 200% zoom | 320 CSS px / text enlargement | Landscape low height | Safe area / home indicator | Contrast | Accessibility notes / result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IOS-TAB | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | N/A | NOT_RUN | NOT_RUN |
| IOS-PWA | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | FAIL | PASS | NOT_RUN | The Home Indicator area did not have an abnormal large bottom gap. This was not a full accessibility run. Portrait layout failed the basic requirement that live composition and shutter remain simultaneously visible; landscape capture/layout also requires retest. |
| AND-TAB | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | N/A | NOT_RUN | NOT_RUN |
| AND-PWA | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| CHROMIUM | NOT_RUN | optional | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | N/A | NOT_RUN | NOT_RUN |
| FIREFOX | NOT_RUN | optional | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | N/A | NOT_RUN | NOT_RUN |

## 2026-07-30 IOS-PWA run

Fixed deployed build:

- URL: `https://kannch8765.github.io/clawd-cam-wip/`
- Commit: `33e4e079c6046f9354d29e8a4018c8f9c11f0c1c`
- Device: iPhone 15 Pro
- OS: iOS 26.5.2
- Mode: installed PWA using Safari/WebKit bundled with iOS 26.5.2
- Primary orientation: portrait; an additional landscape capture was performed
- Tester: ゆう
- Date: 2026-07-30
- Overall result: **FAIL**

### Passed observations

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

### Release-blocking failures on the deployed commit

1. **Portrait composition and shutter are not simultaneously visible.** The user must scroll the live preview out of view before pressing the shutter, so the current composition is not visible at activation time.
2. **Gallery list thumbnails are black blocks.** Full-size details are correct. The black thumbnail persists through Reload, full PWA restart, and offline reopen.
3. **Camera hardware remains active in Gallery.** Switching Camera → Gallery does not stop the MediaStream; the iOS green camera indicator remains until the user disables it from the system camera control.
4. **Cancelled startup falsely reports ready.** Cancelling from the iOS system camera startup/permission surface leaves a black preview with Clawd while the app reports **Rear camera ready**, with no visible recovery path.
5. **Landscape capture has portrait pixels.** After rotating the installed PWA and capturing in landscape, the JPEG still has portrait width/height and does not contain an EXIF Orientation tag that could explain or correct the mismatch.

The fixes on `fix/0.1.0-device-validation` are source-level only until a new commit is deployed. None of the five failed items may be changed to PASS before a new iPhone installed-PWA run.

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

| Old deployed commit | New deployed commit | Tab / installed PWA | New worker downloaded | Activation point | Forced refresh observed | Camera/capture/save interruption | Old cache cleanup | Result | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |

# ClawdCam MVP device validation

Automated tests do not prove real camera hardware, browser permission UI, installed-PWA behavior, persistent storage policy, Web Share, or download destinations. Fill this matrix only from a deployed HTTPS build and preserve evidence links or notes. Do not change a result from `NOT_RUN` without recording device/browser versions, deployment URL, commit SHA, tester, and date.

Allowed result values: `NOT_RUN`, `PASS`, `PASS_WITH_NOTES`, `FAIL`, `BLOCKED`.

## Environment matrix

| ID       | Device        | OS version | Browser version        | Mode          | Deployment URL | Commit SHA | Tester  | Date    | Result  | Evidence / notes |
| -------- | ------------- | ---------- | ---------------------- | ------------- | -------------- | ---------- | ------- | ------- | ------- | ---------------- |
| IOS-TAB  | iPhone        | NOT_RUN    | Safari NOT_RUN         | tab           | NOT_RUN        | NOT_RUN    | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN          |
| IOS-PWA  | iPhone        | NOT_RUN    | Safari/WebKit NOT_RUN  | installed PWA | NOT_RUN        | NOT_RUN    | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN          |
| AND-TAB  | Android phone | NOT_RUN    | Chrome NOT_RUN         | tab           | NOT_RUN        | NOT_RUN    | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN          |
| AND-PWA  | Android phone | NOT_RUN    | Chrome/WebView NOT_RUN | installed PWA | NOT_RUN        | NOT_RUN    | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN          |
| CHROMIUM | Desktop       | NOT_RUN    | Chrome or Edge NOT_RUN | tab           | NOT_RUN        | NOT_RUN    | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN          |
| FIREFOX  | Desktop       | NOT_RUN    | Firefox NOT_RUN        | tab           | NOT_RUN        | NOT_RUN    | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN          |

## Camera and composition matrix

| ID       | Camera  | Switch camera | Front mirror | Overlay drag | Overlay pinch | Overlay rotate | Capture WYSIWYG | Retake  | Orientation change | Background / resume | Camera indicator / track cleanup | Result / notes |
| -------- | ------- | ------------- | ------------ | ------------ | ------------- | -------------- | --------------- | ------- | ------------------ | ------------------- | -------------------------------- | -------------- |
| IOS-TAB  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN        |
| IOS-PWA  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN        |
| AND-TAB  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN        |
| AND-PWA  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN        |
| CHROMIUM | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN        |
| FIREFOX  | NOT_RUN | NOT_RUN       | NOT_RUN      | NOT_RUN      | NOT_RUN       | NOT_RUN        | NOT_RUN         | NOT_RUN | NOT_RUN            | NOT_RUN             | NOT_RUN                          | NOT_RUN        |

## Gallery, offline, download, and sharing matrix

| ID       | Gallery save | Persistence after restart | Gallery list/detail | Gallery delete | Offline shell | Offline gallery | Download | Web Share | Share cancellation | Install / reopen | Result / notes |
| -------- | ------------ | ------------------------- | ------------------- | -------------- | ------------- | --------------- | -------- | --------- | ------------------ | ---------------- | -------------- |
| IOS-TAB  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | N/A              | NOT_RUN        |
| IOS-PWA  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | NOT_RUN          | NOT_RUN        |
| AND-TAB  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | N/A              | NOT_RUN        |
| AND-PWA  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | NOT_RUN          | NOT_RUN        |
| CHROMIUM | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | optional         | NOT_RUN        |
| FIREFOX  | NOT_RUN      | NOT_RUN                   | NOT_RUN             | NOT_RUN        | NOT_RUN       | NOT_RUN         | NOT_RUN  | NOT_RUN   | NOT_RUN            | optional         | NOT_RUN        |

## Accessibility and responsive matrix

| ID       | Keyboard navigation | Screen reader | Visible focus | Accessible names / live status | 200% zoom | 320 CSS px / text enlargement | Landscape low height | Safe area / home indicator | Contrast | Accessibility notes / result |
| -------- | ------------------- | ------------- | ------------- | ------------------------------ | --------- | ----------------------------- | -------------------- | -------------------------- | -------- | ---------------------------- |
| IOS-TAB  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                      |
| IOS-PWA  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | NOT_RUN                    | NOT_RUN  | NOT_RUN                      |
| AND-TAB  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                      |
| AND-PWA  | NOT_RUN             | NOT_RUN       | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | NOT_RUN                    | NOT_RUN  | NOT_RUN                      |
| CHROMIUM | NOT_RUN             | optional      | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                      |
| FIREFOX  | NOT_RUN             | optional      | NOT_RUN       | NOT_RUN                        | NOT_RUN   | NOT_RUN                       | NOT_RUN              | N/A                        | NOT_RUN  | NOT_RUN                      |

## Per-run procedure

1. Confirm the URL is HTTPS and the commit matches the recorded SHA.
2. First load online; inspect the manifest and installability surface.
3. Exercise permission denial, retry, camera ready, switch, front mirror, overlay gestures, capture, Retake, Save, Gallery, Delete, Download, Share, and Share cancellation.
4. Close/reopen the tab or installed PWA and verify gallery persistence.
5. Load Gallery once, go offline, fully reload/reopen where the platform permits, and verify the app shell plus saved gallery. Do not mark Camera as an offline pass merely because one browser kept an already-open stream.
6. Change orientation and background/resume during safe checkpoints. Confirm camera tracks/indicators stop after leaving or closing the app.
7. Verify keyboard/focus behavior, screen-reader announcements, 200% zoom, system text enlargement, narrow width, low-height landscape, and safe-area placement.
8. Record actual download filename/location and Share Sheet target behavior without claiming that a resolved share permanently saved the image.
9. Inspect storage/cache: user photos belong only to IndexedDB; Cache Storage must contain no captured photo or object URL.
10. Attach screenshots, screen recordings, browser diagnostics, or concise reproduction notes for every `FAIL`, `BLOCKED`, or `PASS_WITH_NOTES`.

## Service Worker upgrade run

This is a separate required manual scenario and begins `NOT_RUN`.

| Old deployed commit | New deployed commit | Tab / installed PWA | New worker downloaded | Activation point | Forced refresh observed | Camera/capture/save interruption | Old cache cleanup | Result | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |

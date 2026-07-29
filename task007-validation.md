# Task 007 one-shot validation

- source commit: `ba88c056d794529b00307c1d6bcc1c1a2af5877a`
- preparation: `npm run format`
- command: `npm run check`
- result: **PASSED**

```text

> clawd-cam@0.1.0 format
> prettier --write . --ignore-unknown

[90m.github/workflows/ci.yml[39m 29ms (unchanged)
[90m.github/workflows/deploy-pages.yml[39m 6ms (unchanged)
[90m.github/workflows/task007-one-shot.yml[39m 8ms (unchanged)
[90m.prettierrc.json[39m 27ms (unchanged)
[90mdocs/architecture.md[39m 151ms (unchanged)
[90mdocs/camera-device-smoke-test.md[39m 17ms (unchanged)
[90mdocs/capture-device-smoke-test.md[39m 25ms (unchanged)
[90mdocs/gallery-device-smoke-test.md[39m 29ms (unchanged)
[90mdocs/implementation-references.md[39m 99ms (unchanged)
[90mdocs/overlay-device-smoke-test.md[39m 11ms (unchanged)
[90mdocs/sharing-device-smoke-test.md[39m 19ms (unchanged)
[90meslint.config.js[39m 13ms (unchanged)
[90mindex.html[39m 30ms (unchanged)
[90mpackage-lock.json[39m 117ms (unchanged)
[90mpackage.json[39m 1ms (unchanged)
[90mREADME.md[39m 15ms (unchanged)
[90msrc/app/App.test.tsx[39m 8ms (unchanged)
[90msrc/app/App.tsx[39m 18ms (unchanged)
[90msrc/features/camera/cameraAdapter.test.ts[39m 38ms (unchanged)
[90msrc/features/camera/cameraAdapter.ts[39m 37ms (unchanged)
[90msrc/features/camera/cameraTypes.ts[39m 22ms (unchanged)
[90msrc/features/camera/CameraView.test.tsx[39m 68ms (unchanged)
[90msrc/features/camera/CameraView.tsx[39m 39ms (unchanged)
[90msrc/features/camera/useCamera.ts[39m 38ms (unchanged)
[90msrc/features/composition/captureAdapter.test.ts[39m 11ms (unchanged)
[90msrc/features/composition/captureAdapter.ts[39m 19ms (unchanged)
[90msrc/features/composition/captureGeometry.test.ts[39m 19ms (unchanged)
[90msrc/features/composition/captureGeometry.ts[39m 11ms (unchanged)
[90msrc/features/composition/captureLifecycle.regression.test.tsx[39m 64ms (unchanged)
[90msrc/features/composition/CaptureResult.tsx[39m 10ms (unchanged)
[90msrc/features/composition/composePhoto.test.ts[39m 24ms (unchanged)
[90msrc/features/composition/composePhoto.ts[39m 9ms (unchanged)
[90msrc/features/composition/compositionTypes.ts[39m 5ms (unchanged)
[90msrc/features/composition/PhotoCapture.integration.test.tsx[39m 53ms (unchanged)
[90msrc/features/composition/usePhotoCapture.ts[39m 19ms (unchanged)
[90msrc/features/gallery/CaptureSave.integration.test.tsx[39m 34ms (unchanged)
[90msrc/features/gallery/galleryDatabase.test.ts[39m 57ms (unchanged)
[90msrc/features/gallery/galleryDatabase.ts[39m 20ms (unchanged)
[90msrc/features/gallery/GalleryDetail.tsx[39m 23ms (unchanged)
[90msrc/features/gallery/GalleryFlow.integration.test.tsx[39m 50ms (unchanged)
[90msrc/features/gallery/galleryRepository.ts[39m 14ms (unchanged)
[90msrc/features/gallery/GalleryRepositoryContext.tsx[39m 3ms (unchanged)
[90msrc/features/gallery/galleryServices.ts[39m 7ms (unchanged)
[90msrc/features/gallery/galleryTypes.ts[39m 21ms (unchanged)
[90msrc/features/gallery/GalleryView.test.tsx[39m 56ms (unchanged)
[90msrc/features/gallery/GalleryView.tsx[39m 14ms (unchanged)
[90msrc/features/gallery/thumbnail.test.ts[39m 16ms (unchanged)
[90msrc/features/gallery/thumbnail.ts[39m 23ms (unchanged)
[90msrc/features/gallery/useGallery.ts[39m 27ms (unchanged)
[90msrc/features/overlay/CameraOverlay.test.tsx[39m 21ms (unchanged)
[90msrc/features/overlay/overlayAssets.test.ts[39m 3ms (unchanged)
[90msrc/features/overlay/overlayAssets.ts[39m 4ms (unchanged)
[90msrc/features/overlay/overlayGeometry.test.ts[39m 14ms (unchanged)
[90msrc/features/overlay/overlayGeometry.ts[39m 14ms (unchanged)
[90msrc/features/overlay/OverlayPreview.tsx[39m 6ms (unchanged)
[90msrc/features/overlay/overlayTypes.ts[39m 3ms (unchanged)
[90msrc/features/overlay/PinchDragCoordination.test.tsx[39m 17ms (unchanged)
[90msrc/features/overlay/referenceAsset.node.test.ts[39m 27ms (unchanged)
[90msrc/features/overlay/useOverlayController.test.tsx[39m 6ms (unchanged)
[90msrc/features/overlay/useOverlayController.ts[39m 3ms (unchanged)
[90msrc/features/overlay/useOverlayGestures.ts[39m 10ms (unchanged)
[90msrc/features/sharing/PhotoActions.tsx[39m 7ms (unchanged)
[90msrc/features/sharing/photoFile.test.ts[39m 18ms (unchanged)
[90msrc/features/sharing/photoFile.ts[39m 12ms (unchanged)
[90msrc/features/sharing/sharingAdapter.test.ts[39m 20ms (unchanged)
[90msrc/features/sharing/sharingAdapter.ts[39m 7ms (unchanged)
[90msrc/features/sharing/SharingFlow.integration.test.tsx[39m 40ms (unchanged)
[90msrc/features/sharing/sharingServices.ts[39m 2ms (unchanged)
[90msrc/features/sharing/SharingServicesContext.tsx[39m 2ms (unchanged)
[90msrc/features/sharing/sharingTypes.ts[39m 4ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.test.tsx[39m 37ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.ts[39m 19ms (unchanged)
[90msrc/main.tsx[39m 3ms (unchanged)
[90msrc/styles/gallery.css[39m 54ms (unchanged)
[90msrc/styles/index.css[39m 30ms (unchanged)
[90msrc/styles/sharing.css[39m 4ms (unchanged)
[90msrc/test/setup.ts[39m 3ms (unchanged)
[90msrc/vite-env.d.ts[39m 1ms (unchanged)
[90mtask007-validation.md[39m 17ms (unchanged)
[90mtsconfig.app.json[39m 2ms (unchanged)
[90mtsconfig.json[39m 1ms (unchanged)
[90mtsconfig.node.json[39m 1ms (unchanged)
[90mvite.config.ts[39m 4ms (unchanged)
[90mvitest.config.ts[39m 2ms (unchanged)

> clawd-cam@0.1.0 check
> npm run lint && npm run format:check && npm run test && npm run build


> clawd-cam@0.1.0 lint
> eslint . --max-warnings=0


> clawd-cam@0.1.0 format:check
> prettier --check . --ignore-unknown

Checking formatting...
All matched files use Prettier code style!

> clawd-cam@0.1.0 test
> vitest run


[1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90m/home/runner/work/clawd-cam-wip/clawd-cam-wip[39m

 [32m✓[39m src/features/gallery/galleryDatabase.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 73[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1208[2mms[22m[39m
 [32m✓[39m src/features/composition/PhotoCapture.integration.test.tsx [2m([22m[2m10 tests[22m[2m)[22m[33m 1421[2mms[22m[39m
     [33m[2m✓[22m[39m shows the shutter only after camera and decoded asset are ready [33m 499[2mms[22m[39m
 [32m✓[39m src/features/camera/CameraView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1020[2mms[22m[39m
     [33m[2m✓[22m[39m requests the rear camera and enters ready after video readiness [33m 403[2mms[22m[39m
 [32m✓[39m src/features/composition/captureLifecycle.regression.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[33m 718[2mms[22m[39m
     [33m[2m✓[22m[39m recovers after an asset decode failure and retry [33m 488[2mms[22m[39m
 [32m✓[39m src/features/sharing/SharingFlow.integration.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[33m 915[2mms[22m[39m
     [33m[2m✓[22m[39m captures once, then shares, downloads, and independently saves the original Blob [33m 718[2mms[22m[39m
 [32m✓[39m src/features/sharing/usePhotoSharing.test.tsx [2m([22m[2m17 tests[22m[2m)[22m[33m 842[2mms[22m[39m
 [32m✓[39m src/features/composition/composePhoto.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 25[2mms[22m[39m
[90mstderr[2m | src/features/gallery/CaptureSave.integration.test.tsx[2m > [22m[2mcapture result gallery save[2m > [22m[2mshows an explicit Save to gallery action without auto-saving
[22m[39mAn update to CaptureResult inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/gallery/CaptureSave.integration.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[33m 772[2mms[22m[39m
     [33m[2m✓[22m[39m shows an explicit Save to gallery action without auto-saving [33m 309[2mms[22m[39m
[90mstderr[2m | src/features/overlay/CameraOverlay.test.tsx[2m > [22m[2mcamera overlay integration[2m > [22m[2mdoes not show an interactive overlay before the camera is ready
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/overlay/CameraOverlay.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[33m 835[2mms[22m[39m
 [32m✓[39m src/features/composition/captureGeometry.test.ts [2m([22m[2m25 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryFlow.integration.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 763[2mms[22m[39m
     [33m[2m✓[22m[39m captures, saves, reloads, opens detail, and deletes one photo [33m 756[2mms[22m[39m
 [32m✓[39m src/features/overlay/referenceAsset.node.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 40[2mms[22m[39m
 [32m✓[39m src/features/sharing/photoFile.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/features/gallery/thumbnail.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/features/overlay/PinchDragCoordination.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 398[2mms[22m[39m
     [33m[2m✓[22m[39m suppresses the original drag until it fully ends after a two-pointer pinch [33m 391[2mms[22m[39m
 [32m✓[39m src/features/camera/cameraAdapter.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/features/sharing/sharingAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayGeometry.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/features/composition/captureAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/features/overlay/useOverlayController.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[33m 311[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayAssets.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
[90mstderr[2m | src/app/App.test.tsx[2m > [22m[2mApp[2m > [22m[2mrenders the camera foundation without requesting permission
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/app/App.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 197[2mms[22m[39m

[2m Test Files [22m [1m[32m23 passed[39m[22m[90m (23)[39m
[2m      Tests [22m [1m[32m183 passed[39m[22m[90m (183)[39m
[2m   Start at [22m 08:01:48
[2m   Duration [22m 12.45s[2m (transform 1.30s, setup 2.01s, import 3.71s, tests 9.68s, environment 16.75s)[22m


> clawd-cam@0.1.0 build
> tsc -b && vite build

[36mvite v7.3.6 [32mbuilding client environment for production...[36m[39m
transforming...
[32m✓[39m 73 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mmanifest.webmanifest                        [39m[1m[2m  0.37 kB[22m[1m[22m
[2mdist/[22m[32mindex.html                                  [39m[1m[2m  0.61 kB[22m[1m[22m[2m │ gzip:  0.34 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-Cm9-lv2R.css                   [39m[1m[2m  7.29 kB[22m[1m[22m[2m │ gzip:  2.26 kB[22m
[2mdist/[22m[2massets/[22m[36mworkbox-window.prod.es5-BBnX5xw4.js  [39m[1m[2m  5.75 kB[22m[1m[22m[2m │ gzip:  2.36 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-NEPceI-g.js                    [39m[1m[2m277.99 kB[22m[1m[22m[2m │ gzip: 86.31 kB[22m
[32m✓ built in 1.21s[39m

[36mPWA v1.3.0[39m
mode      [35mgenerateSW[39m
precache  [32m12 entries[39m [2m(290.28 KiB)[22m
files generated
  [2mdist/sw.js[22m
  [2mdist/workbox-9c191d2f.js[22m
```

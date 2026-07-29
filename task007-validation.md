# Task 007 one-shot validation

- source commit: `d449ffa67cb6a4bca95521a2833be0241b26d7b7`
- preparation: `npm run format`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 format
> prettier --write . --ignore-unknown

[90m.github/workflows/ci.yml[39m 31ms (unchanged)
[90m.github/workflows/deploy-pages.yml[39m 7ms (unchanged)
[90m.github/workflows/task007-one-shot.yml[39m 9ms (unchanged)
[90m.prettierrc.json[39m 28ms (unchanged)
[90mdocs/architecture.md[39m 144ms (unchanged)
[90mdocs/camera-device-smoke-test.md[39m 19ms (unchanged)
[90mdocs/capture-device-smoke-test.md[39m 25ms (unchanged)
[90mdocs/gallery-device-smoke-test.md[39m 24ms (unchanged)
[90mdocs/implementation-references.md[39m 103ms (unchanged)
[90mdocs/overlay-device-smoke-test.md[39m 11ms (unchanged)
[90mdocs/sharing-device-smoke-test.md[39m 18ms (unchanged)
[90meslint.config.js[39m 13ms (unchanged)
[90mindex.html[39m 30ms (unchanged)
[90mpackage-lock.json[39m 117ms (unchanged)
[90mpackage.json[39m 1ms (unchanged)
[90mREADME.md[39m 14ms (unchanged)
[90msrc/app/App.test.tsx[39m 8ms (unchanged)
[90msrc/app/App.tsx[39m 17ms (unchanged)
[90msrc/features/camera/cameraAdapter.test.ts[39m 32ms (unchanged)
[90msrc/features/camera/cameraAdapter.ts[39m 29ms (unchanged)
[90msrc/features/camera/cameraTypes.ts[39m 17ms (unchanged)
[90msrc/features/camera/CameraView.test.tsx[39m 71ms (unchanged)
[90msrc/features/camera/CameraView.tsx[39m 40ms (unchanged)
[90msrc/features/camera/useCamera.ts[39m 39ms (unchanged)
[90msrc/features/composition/captureAdapter.test.ts[39m 12ms (unchanged)
[90msrc/features/composition/captureAdapter.ts[39m 20ms (unchanged)
[90msrc/features/composition/captureGeometry.test.ts[39m 20ms (unchanged)
[90msrc/features/composition/captureGeometry.ts[39m 11ms (unchanged)
[90msrc/features/composition/captureLifecycle.regression.test.tsx[39m 56ms (unchanged)
[90msrc/features/composition/CaptureResult.tsx[39m 8ms (unchanged)
[90msrc/features/composition/composePhoto.test.ts[39m 18ms (unchanged)
[90msrc/features/composition/composePhoto.ts[39m 8ms (unchanged)
[90msrc/features/composition/compositionTypes.ts[39m 5ms (unchanged)
[90msrc/features/composition/PhotoCapture.integration.test.tsx[39m 44ms (unchanged)
[90msrc/features/composition/usePhotoCapture.ts[39m 20ms (unchanged)
[90msrc/features/gallery/CaptureSave.integration.test.tsx[39m 28ms (unchanged)
[90msrc/features/gallery/galleryDatabase.test.ts[39m 55ms (unchanged)
[90msrc/features/gallery/galleryDatabase.ts[39m 16ms (unchanged)
[90msrc/features/gallery/GalleryDetail.tsx[39m 21ms (unchanged)
[90msrc/features/gallery/GalleryFlow.integration.test.tsx[39m 29ms (unchanged)
[90msrc/features/gallery/galleryRepository.ts[39m 11ms (unchanged)
[90msrc/features/gallery/GalleryRepositoryContext.tsx[39m 3ms (unchanged)
[90msrc/features/gallery/galleryServices.ts[39m 3ms (unchanged)
[90msrc/features/gallery/galleryTypes.ts[39m 19ms (unchanged)
[90msrc/features/gallery/GalleryView.test.tsx[39m 50ms (unchanged)
[90msrc/features/gallery/GalleryView.tsx[39m 8ms (unchanged)
[90msrc/features/gallery/thumbnail.test.ts[39m 16ms (unchanged)
[90msrc/features/gallery/thumbnail.ts[39m 19ms (unchanged)
[90msrc/features/gallery/useGallery.ts[39m 24ms (unchanged)
[90msrc/features/overlay/CameraOverlay.test.tsx[39m 21ms (unchanged)
[90msrc/features/overlay/overlayAssets.test.ts[39m 3ms (unchanged)
[90msrc/features/overlay/overlayAssets.ts[39m 4ms (unchanged)
[90msrc/features/overlay/overlayGeometry.test.ts[39m 14ms (unchanged)
[90msrc/features/overlay/overlayGeometry.ts[39m 7ms (unchanged)
[90msrc/features/overlay/OverlayPreview.tsx[39m 4ms (unchanged)
[90msrc/features/overlay/overlayTypes.ts[39m 2ms (unchanged)
[90msrc/features/overlay/PinchDragCoordination.test.tsx[39m 16ms (unchanged)
[90msrc/features/overlay/referenceAsset.node.test.ts[39m 21ms (unchanged)
[90msrc/features/overlay/useOverlayController.test.tsx[39m 6ms (unchanged)
[90msrc/features/overlay/useOverlayController.ts[39m 3ms (unchanged)
[90msrc/features/overlay/useOverlayGestures.ts[39m 8ms (unchanged)
[90msrc/features/sharing/PhotoActions.tsx[39m 5ms (unchanged)
[90msrc/features/sharing/photoFile.test.ts[39m 21ms (unchanged)
[90msrc/features/sharing/photoFile.ts[39m 13ms (unchanged)
[90msrc/features/sharing/sharingAdapter.test.ts[39m 13ms (unchanged)
[90msrc/features/sharing/sharingAdapter.ts[39m 8ms (unchanged)
[90msrc/features/sharing/SharingFlow.integration.test.tsx[39m 35ms (unchanged)
[90msrc/features/sharing/sharingServices.ts[39m 1ms (unchanged)
[90msrc/features/sharing/SharingServicesContext.tsx[39m 2ms (unchanged)
[90msrc/features/sharing/sharingTypes.ts[39m 4ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.test.tsx[39m 21ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.ts[39m 17ms (unchanged)
[90msrc/main.tsx[39m 2ms (unchanged)
[90msrc/styles/gallery.css[39m 51ms (unchanged)
[90msrc/styles/index.css[39m 31ms (unchanged)
[90msrc/styles/sharing.css[39m 4ms (unchanged)
[90msrc/test/setup.ts[39m 3ms (unchanged)
[90msrc/vite-env.d.ts[39m 1ms (unchanged)
[90mtask007-validation.md[39m 13ms (unchanged)
[90mtsconfig.app.json[39m 2ms (unchanged)
[90mtsconfig.json[39m 1ms (unchanged)
[90mtsconfig.node.json[39m 1ms (unchanged)
[90mvite.config.ts[39m 3ms (unchanged)
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

 [32m✓[39m src/features/gallery/galleryDatabase.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 68[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1304[2mms[22m[39m
     [33m[2m✓[22m[39m shows loading and then the empty gallery action [33m 313[2mms[22m[39m
 [32m✓[39m src/features/composition/PhotoCapture.integration.test.tsx [2m([22m[2m10 tests[22m[2m)[22m[33m 1435[2mms[22m[39m
     [33m[2m✓[22m[39m shows the shutter only after camera and decoded asset are ready [33m 501[2mms[22m[39m
 [32m✓[39m src/features/camera/CameraView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1092[2mms[22m[39m
     [33m[2m✓[22m[39m requests the rear camera and enters ready after video readiness [33m 402[2mms[22m[39m
 [32m✓[39m src/features/composition/captureLifecycle.regression.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[33m 787[2mms[22m[39m
     [33m[2m✓[22m[39m recovers after an asset decode failure and retry [33m 538[2mms[22m[39m
 [32m✓[39m src/features/sharing/SharingFlow.integration.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[33m 874[2mms[22m[39m
     [33m[2m✓[22m[39m captures once, then shares, downloads, and independently saves the original Blob [33m 674[2mms[22m[39m
 [32m✓[39m src/features/sharing/usePhotoSharing.test.tsx [2m([22m[2m17 tests[22m[2m)[22m[33m 792[2mms[22m[39m
 [32m✓[39m src/features/composition/composePhoto.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 48[2mms[22m[39m
[90mstderr[2m | src/features/gallery/CaptureSave.integration.test.tsx[2m > [22m[2mcapture result gallery save[2m > [22m[2mshows an explicit Save to gallery action without auto-saving
[22m[39mAn update to CaptureResult inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/gallery/CaptureSave.integration.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[33m 737[2mms[22m[39m
[90mstderr[2m | src/features/overlay/CameraOverlay.test.tsx[2m > [22m[2mcamera overlay integration[2m > [22m[2mdoes not show an interactive overlay before the camera is ready
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/overlay/CameraOverlay.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[33m 761[2mms[22m[39m
 [32m✓[39m src/features/composition/captureGeometry.test.ts [2m([22m[2m25 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m src/features/overlay/referenceAsset.node.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 39[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryFlow.integration.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 869[2mms[22m[39m
     [33m[2m✓[22m[39m captures, saves, reloads, opens detail, and deletes one photo [33m 865[2mms[22m[39m
 [32m✓[39m src/features/sharing/photoFile.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/features/gallery/thumbnail.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/features/camera/cameraAdapter.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/features/overlay/PinchDragCoordination.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 367[2mms[22m[39m
     [33m[2m✓[22m[39m suppresses the original drag until it fully ends after a two-pointer pinch [33m 363[2mms[22m[39m
 [32m✓[39m src/features/sharing/sharingAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayGeometry.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/features/composition/captureAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/features/overlay/useOverlayController.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 255[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayAssets.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 8[2mms[22m[39m
[90mstderr[2m | src/app/App.test.tsx[2m > [22m[2mApp[2m > [22m[2mrenders the camera foundation without requesting permission
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/app/App.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 205[2mms[22m[39m

[2m Test Files [22m [1m[32m23 passed[39m[22m[90m (23)[39m
[2m      Tests [22m [1m[32m183 passed[39m[22m[90m (183)[39m
[2m   Start at [22m 07:57:08
[2m   Duration [22m 12.80s[2m (transform 1.15s, setup 2.03s, import 3.72s, tests 9.77s, environment 17.34s)[22m


> clawd-cam@0.1.0 build
> tsc -b && vite build

src/features/sharing/SharingFlow.integration.test.tsx(189,48): error TS2493: Tuple type '[]' of length '0' has no element at index '0'.
src/features/sharing/SharingFlow.integration.test.tsx(198,12): error TS18048: 'sharedFile' is possibly 'undefined'.
src/features/sharing/SharingFlow.integration.test.tsx(199,12): error TS18048: 'sharedFile' is possibly 'undefined'.
src/features/sharing/usePhotoSharing.test.tsx(135,42): error TS2493: Tuple type '[]' of length '0' has no element at index '0'.
src/features/sharing/usePhotoSharing.test.tsx(137,12): error TS18048: 'file' is possibly 'undefined'.
src/features/sharing/usePhotoSharing.test.tsx(138,12): error TS18048: 'file' is possibly 'undefined'.
src/features/sharing/usePhotoSharing.test.tsx(139,12): error TS18048: 'file' is possibly 'undefined'.
```

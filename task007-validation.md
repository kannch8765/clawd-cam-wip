# Task 007 one-shot validation

- source commit: `4b906c945d6b795fb15c188906c495b2df3ce199`
- preparation: `npm run format`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 format
> prettier --write . --ignore-unknown

[90m.github/workflows/ci.yml[39m 30ms (unchanged)
[90m.github/workflows/deploy-pages.yml[39m 6ms (unchanged)
[90m.github/workflows/task007-one-shot.yml[39m 8ms (unchanged)
[90m.prettierrc.json[39m 28ms (unchanged)
[90mdocs/architecture.md[39m 139ms (unchanged)
[90mdocs/camera-device-smoke-test.md[39m 19ms (unchanged)
[90mdocs/capture-device-smoke-test.md[39m 26ms (unchanged)
[90mdocs/gallery-device-smoke-test.md[39m 29ms (unchanged)
[90mdocs/implementation-references.md[39m 120ms (unchanged)
[90mdocs/overlay-device-smoke-test.md[39m 16ms (unchanged)
[90mdocs/sharing-device-smoke-test.md[39m 14ms (unchanged)
[90meslint.config.js[39m 13ms (unchanged)
[90mindex.html[39m 30ms (unchanged)
[90mpackage-lock.json[39m 116ms (unchanged)
[90mpackage.json[39m 1ms (unchanged)
[90mREADME.md[39m 14ms (unchanged)
[90msrc/app/App.test.tsx[39m 8ms (unchanged)
[90msrc/app/App.tsx[39m 18ms (unchanged)
[90msrc/features/camera/cameraAdapter.test.ts[39m 36ms (unchanged)
[90msrc/features/camera/cameraAdapter.ts[39m 30ms (unchanged)
[90msrc/features/camera/cameraTypes.ts[39m 16ms (unchanged)
[90msrc/features/camera/CameraView.test.tsx[39m 76ms (unchanged)
[90msrc/features/camera/CameraView.tsx[39m 49ms (unchanged)
[90msrc/features/camera/useCamera.ts[39m 38ms (unchanged)
[90msrc/features/composition/captureAdapter.test.ts[39m 11ms (unchanged)
[90msrc/features/composition/captureAdapter.ts[39m 25ms (unchanged)
[90msrc/features/composition/captureGeometry.test.ts[39m 16ms (unchanged)
[90msrc/features/composition/captureGeometry.ts[39m 11ms (unchanged)
[90msrc/features/composition/captureLifecycle.regression.test.tsx[39m 55ms (unchanged)
[90msrc/features/composition/CaptureResult.tsx[39m 7ms (unchanged)
[90msrc/features/composition/composePhoto.test.ts[39m 20ms (unchanged)
[90msrc/features/composition/composePhoto.ts[39m 8ms (unchanged)
[90msrc/features/composition/compositionTypes.ts[39m 4ms (unchanged)
[90msrc/features/composition/PhotoCapture.integration.test.tsx[39m 49ms (unchanged)
[90msrc/features/composition/usePhotoCapture.ts[39m 18ms (unchanged)
[90msrc/features/gallery/CaptureSave.integration.test.tsx[39m 25ms (unchanged)
[90msrc/features/gallery/galleryDatabase.test.ts[39m 50ms (unchanged)
[90msrc/features/gallery/galleryDatabase.ts[39m 17ms (unchanged)
[90msrc/features/gallery/GalleryDetail.tsx[39m 21ms (unchanged)
[90msrc/features/gallery/GalleryFlow.integration.test.tsx[39m 26ms (unchanged)
[90msrc/features/gallery/galleryRepository.ts[39m 13ms (unchanged)
[90msrc/features/gallery/GalleryRepositoryContext.tsx[39m 3ms (unchanged)
[90msrc/features/gallery/galleryServices.ts[39m 3ms (unchanged)
[90msrc/features/gallery/galleryTypes.ts[39m 23ms (unchanged)
[90msrc/features/gallery/GalleryView.test.tsx[39m 43ms (unchanged)
[90msrc/features/gallery/GalleryView.tsx[39m 8ms (unchanged)
[90msrc/features/gallery/thumbnail.test.ts[39m 13ms (unchanged)
[90msrc/features/gallery/thumbnail.ts[39m 19ms (unchanged)
[90msrc/features/gallery/useGallery.ts[39m 19ms (unchanged)
[90msrc/features/overlay/CameraOverlay.test.tsx[39m 21ms (unchanged)
[90msrc/features/overlay/overlayAssets.test.ts[39m 3ms (unchanged)
[90msrc/features/overlay/overlayAssets.ts[39m 4ms (unchanged)
[90msrc/features/overlay/overlayGeometry.test.ts[39m 13ms (unchanged)
[90msrc/features/overlay/overlayGeometry.ts[39m 8ms (unchanged)
[90msrc/features/overlay/OverlayPreview.tsx[39m 4ms (unchanged)
[90msrc/features/overlay/overlayTypes.ts[39m 2ms (unchanged)
[90msrc/features/overlay/PinchDragCoordination.test.tsx[39m 19ms (unchanged)
[90msrc/features/overlay/referenceAsset.node.test.ts[39m 24ms (unchanged)
[90msrc/features/overlay/useOverlayController.test.tsx[39m 7ms (unchanged)
[90msrc/features/overlay/useOverlayController.ts[39m 4ms (unchanged)
[90msrc/features/overlay/useOverlayGestures.ts[39m 7ms (unchanged)
[90msrc/features/sharing/PhotoActions.tsx[39m 6ms (unchanged)
[90msrc/features/sharing/photoFile.test.ts[39m 13ms (unchanged)
[90msrc/features/sharing/photoFile.ts[39m 12ms (unchanged)
[90msrc/features/sharing/sharingAdapter.test.ts[39m 15ms (unchanged)
[90msrc/features/sharing/sharingAdapter.ts[39m 10ms (unchanged)
src/features/sharing/SharingFlow.integration.test.tsx 38ms
[90msrc/features/sharing/sharingServices.ts[39m 1ms (unchanged)
[90msrc/features/sharing/SharingServicesContext.tsx[39m 1ms (unchanged)
[90msrc/features/sharing/sharingTypes.ts[39m 3ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.test.tsx[39m 21ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.ts[39m 14ms (unchanged)
[90msrc/main.tsx[39m 2ms (unchanged)
[90msrc/styles/gallery.css[39m 50ms (unchanged)
[90msrc/styles/index.css[39m 30ms (unchanged)
[90msrc/styles/sharing.css[39m 5ms (unchanged)
[90msrc/test/setup.ts[39m 3ms (unchanged)
[90msrc/vite-env.d.ts[39m 1ms (unchanged)
[90mtask007-validation.md[39m 13ms (unchanged)
[90mtsconfig.app.json[39m 2ms (unchanged)
[90mtsconfig.json[39m 1ms (unchanged)
[90mtsconfig.node.json[39m 1ms (unchanged)
[90mvite.config.ts[39m 3ms (unchanged)
[90mvitest.config.ts[39m 1ms (unchanged)

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

 [32m✓[39m src/features/gallery/galleryDatabase.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 70[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1209[2mms[22m[39m
     [33m[2m✓[22m[39m shows loading and then the empty gallery action [33m 325[2mms[22m[39m
 [32m✓[39m src/features/composition/PhotoCapture.integration.test.tsx [2m([22m[2m10 tests[22m[2m)[22m[33m 1463[2mms[22m[39m
     [33m[2m✓[22m[39m shows the shutter only after camera and decoded asset are ready [33m 455[2mms[22m[39m
 [32m✓[39m src/features/camera/CameraView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1013[2mms[22m[39m
     [33m[2m✓[22m[39m requests the rear camera and enters ready after video readiness [33m 369[2mms[22m[39m
 [32m✓[39m src/features/composition/captureLifecycle.regression.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[33m 745[2mms[22m[39m
     [33m[2m✓[22m[39m recovers after an asset decode failure and retry [33m 513[2mms[22m[39m
 [31m❯[39m src/features/sharing/SharingFlow.integration.test.tsx [2m([22m[2m2 tests[22m[2m | [22m[31m1 failed[39m[2m)[22m[33m 861[2mms[22m[39m
     [33m[2m✓[22m[39m captures once, then shares, downloads, and independently saves the original Blob [33m 653[2mms[22m[39m
[31m     [31m×[31m shares and downloads the full record Blob while protecting Delete[39m[32m 204[2mms[22m[39m
 [32m✓[39m src/features/sharing/usePhotoSharing.test.tsx [2m([22m[2m17 tests[22m[2m)[22m[33m 824[2mms[22m[39m
 [32m✓[39m src/features/composition/composePhoto.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 19[2mms[22m[39m
[90mstderr[2m | src/features/gallery/CaptureSave.integration.test.tsx[2m > [22m[2mcapture result gallery save[2m > [22m[2mshows an explicit Save to gallery action without auto-saving
[22m[39mAn update to CaptureResult inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/gallery/CaptureSave.integration.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[33m 679[2mms[22m[39m
[90mstderr[2m | src/features/overlay/CameraOverlay.test.tsx[2m > [22m[2mcamera overlay integration[2m > [22m[2mdoes not show an interactive overlay before the camera is ready
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/overlay/CameraOverlay.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[33m 767[2mms[22m[39m
 [32m✓[39m src/features/composition/captureGeometry.test.ts [2m([22m[2m25 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/features/overlay/referenceAsset.node.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 63[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryFlow.integration.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 857[2mms[22m[39m
     [33m[2m✓[22m[39m captures, saves, reloads, opens detail, and deletes one photo [33m 851[2mms[22m[39m
 [32m✓[39m src/features/sharing/photoFile.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/features/gallery/thumbnail.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m src/features/overlay/PinchDragCoordination.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 363[2mms[22m[39m
     [33m[2m✓[22m[39m suppresses the original drag until it fully ends after a two-pointer pinch [33m 359[2mms[22m[39m
 [32m✓[39m src/features/camera/cameraAdapter.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/features/sharing/sharingAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 38[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayGeometry.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/features/composition/captureAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayAssets.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m src/features/overlay/useOverlayController.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[33m 306[2mms[22m[39m
[90mstderr[2m | src/app/App.test.tsx[2m > [22m[2mApp[2m > [22m[2mrenders the camera foundation without requesting permission
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/app/App.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 199[2mms[22m[39m

[31m⎯⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Tests 1 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m src/features/sharing/SharingFlow.integration.test.tsx[2m > [22mgallery detail sharing integration[2m > [22mshares and downloads the full record Blob while protecting Delete
[31m[1mAssertionError[22m: expected "vi.fn()" to not be called with arguments: [ Blob{ …(1) }, Any<String>, …(1) ][90m

Received:

[1m  1st vi.fn() call:

[22m[2m  [[22m
[2m    Blob {},[22m
[32m-   Any<String>,[90m
[32m-   Any<Object>,[90m
[31m+   "clawdcam-20260729-080910.jpg",[90m
[31m+   {[90m
[31m+     "lastModified": 1785312550000,[90m
[31m+     "type": "image/jpeg",[90m
[31m+   },[90m
[2m  ][22m
[31m[90m

Number of calls: [1m1[22m
[31m[39m
[36m [2m❯[22m src/features/sharing/SharingFlow.integration.test.tsx:[2m273:28[22m[39m
    [90m271|[39m       { type[33m:[39m [32m'image/jpeg'[39m[33m,[39m lastModified[33m:[39m capturedAt }[33m,[39m
    [90m272|[39m     )[33m;[39m
    [90m273|[39m     [34mexpect[39m(createFile)[33m.[39mnot[33m.[39m[34mtoHaveBeenCalledWith[39m(
    [90m   |[39m                            [31m^[39m
    [90m274|[39m       thumbnail[33m,[39m
    [90m275|[39m       expect[33m.[39m[34many[39m([33mString[39m)[33m,[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯[22m[39m


[2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m22 passed[39m[22m[90m (23)[39m
[2m      Tests [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m182 passed[39m[22m[90m (183)[39m
[2m   Start at [22m 07:53:01
[2m   Duration [22m 12.49s[2m (transform 1.25s, setup 2.04s, import 3.80s, tests 9.60s, environment 16.75s)[22m


::error file=/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/SharingFlow.integration.test.tsx,title=src/features/sharing/SharingFlow.integration.test.tsx > gallery detail sharing integration > shares and downloads the full record Blob while protecting Delete,line=273,column=28::AssertionError: expected "vi.fn()" to not be called with arguments: [ Blob{ …(1) }, Any<String>, …(1) ]%0A%0AReceived:%0A%0A  1st vi.fn() call:%0A%0A  [%0A    Blob {},%0A-   Any<String>,%0A-   Any<Object>,%0A+   "clawdcam-20260729-080910.jpg",%0A+   {%0A+     "lastModified": 1785312550000,%0A+     "type": "image/jpeg",%0A+   },%0A  ]%0A%0A%0ANumber of calls: 1%0A%0A ❯ src/features/sharing/SharingFlow.integration.test.tsx:273:28%0A%0A
```

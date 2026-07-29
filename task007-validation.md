# Task 007 one-shot validation

- source commit: `7431659c44943f55c9af0584b13e7f88957e33f9`
- preparation: `npm run format`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 format
> prettier --write . --ignore-unknown

[90m.github/workflows/ci.yml[39m 29ms (unchanged)
[90m.github/workflows/deploy-pages.yml[39m 6ms (unchanged)
[90m.github/workflows/task007-one-shot.yml[39m 8ms (unchanged)
[90m.prettierrc.json[39m 28ms (unchanged)
[90mdocs/architecture.md[39m 134ms (unchanged)
[90mdocs/camera-device-smoke-test.md[39m 18ms (unchanged)
[90mdocs/capture-device-smoke-test.md[39m 21ms (unchanged)
[90mdocs/gallery-device-smoke-test.md[39m 24ms (unchanged)
[90mdocs/implementation-references.md[39m 91ms (unchanged)
[90mdocs/overlay-device-smoke-test.md[39m 10ms (unchanged)
[90mdocs/sharing-device-smoke-test.md[39m 17ms (unchanged)
[90meslint.config.js[39m 12ms (unchanged)
[90mindex.html[39m 29ms (unchanged)
[90mpackage-lock.json[39m 121ms (unchanged)
[90mpackage.json[39m 1ms (unchanged)
[90mREADME.md[39m 16ms (unchanged)
[90msrc/app/App.test.tsx[39m 8ms (unchanged)
[90msrc/app/App.tsx[39m 17ms (unchanged)
[90msrc/features/camera/cameraAdapter.test.ts[39m 29ms (unchanged)
[90msrc/features/camera/cameraAdapter.ts[39m 28ms (unchanged)
[90msrc/features/camera/cameraTypes.ts[39m 15ms (unchanged)
[90msrc/features/camera/CameraView.test.tsx[39m 68ms (unchanged)
[90msrc/features/camera/CameraView.tsx[39m 37ms (unchanged)
[90msrc/features/camera/useCamera.ts[39m 40ms (unchanged)
[90msrc/features/composition/captureAdapter.test.ts[39m 13ms (unchanged)
[90msrc/features/composition/captureAdapter.ts[39m 18ms (unchanged)
[90msrc/features/composition/captureGeometry.test.ts[39m 22ms (unchanged)
[90msrc/features/composition/captureGeometry.ts[39m 11ms (unchanged)
[90msrc/features/composition/captureLifecycle.regression.test.tsx[39m 61ms (unchanged)
[90msrc/features/composition/CaptureResult.tsx[39m 8ms (unchanged)
[90msrc/features/composition/composePhoto.test.ts[39m 18ms (unchanged)
[90msrc/features/composition/composePhoto.ts[39m 8ms (unchanged)
[90msrc/features/composition/compositionTypes.ts[39m 4ms (unchanged)
[90msrc/features/composition/PhotoCapture.integration.test.tsx[39m 46ms (unchanged)
[90msrc/features/composition/usePhotoCapture.ts[39m 26ms (unchanged)
[90msrc/features/gallery/CaptureSave.integration.test.tsx[39m 29ms (unchanged)
[90msrc/features/gallery/galleryDatabase.test.ts[39m 47ms (unchanged)
[90msrc/features/gallery/galleryDatabase.ts[39m 15ms (unchanged)
[90msrc/features/gallery/GalleryDetail.tsx[39m 17ms (unchanged)
[90msrc/features/gallery/GalleryFlow.integration.test.tsx[39m 23ms (unchanged)
[90msrc/features/gallery/galleryRepository.ts[39m 14ms (unchanged)
[90msrc/features/gallery/GalleryRepositoryContext.tsx[39m 3ms (unchanged)
[90msrc/features/gallery/galleryServices.ts[39m 4ms (unchanged)
[90msrc/features/gallery/galleryTypes.ts[39m 19ms (unchanged)
[90msrc/features/gallery/GalleryView.test.tsx[39m 63ms (unchanged)
[90msrc/features/gallery/GalleryView.tsx[39m 11ms (unchanged)
[90msrc/features/gallery/thumbnail.test.ts[39m 12ms (unchanged)
[90msrc/features/gallery/thumbnail.ts[39m 20ms (unchanged)
[90msrc/features/gallery/useGallery.ts[39m 19ms (unchanged)
[90msrc/features/overlay/CameraOverlay.test.tsx[39m 17ms (unchanged)
[90msrc/features/overlay/overlayAssets.test.ts[39m 2ms (unchanged)
[90msrc/features/overlay/overlayAssets.ts[39m 3ms (unchanged)
[90msrc/features/overlay/overlayGeometry.test.ts[39m 11ms (unchanged)
[90msrc/features/overlay/overlayGeometry.ts[39m 9ms (unchanged)
[90msrc/features/overlay/OverlayPreview.tsx[39m 4ms (unchanged)
[90msrc/features/overlay/overlayTypes.ts[39m 3ms (unchanged)
[90msrc/features/overlay/PinchDragCoordination.test.tsx[39m 15ms (unchanged)
[90msrc/features/overlay/referenceAsset.node.test.ts[39m 22ms (unchanged)
[90msrc/features/overlay/useOverlayController.test.tsx[39m 6ms (unchanged)
[90msrc/features/overlay/useOverlayController.ts[39m 3ms (unchanged)
[90msrc/features/overlay/useOverlayGestures.ts[39m 7ms (unchanged)
[90msrc/features/sharing/PhotoActions.tsx[39m 5ms (unchanged)
[90msrc/features/sharing/photoFile.test.ts[39m 13ms (unchanged)
[90msrc/features/sharing/photoFile.ts[39m 12ms (unchanged)
[90msrc/features/sharing/sharingAdapter.test.ts[39m 16ms (unchanged)
[90msrc/features/sharing/sharingAdapter.ts[39m 7ms (unchanged)
[90msrc/features/sharing/SharingFlow.integration.test.tsx[39m 47ms (unchanged)
[90msrc/features/sharing/sharingServices.ts[39m 2ms (unchanged)
[90msrc/features/sharing/SharingServicesContext.tsx[39m 3ms (unchanged)
[90msrc/features/sharing/sharingTypes.ts[39m 3ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.test.tsx[39m 19ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.ts[39m 16ms (unchanged)
[90msrc/main.tsx[39m 3ms (unchanged)
[90msrc/styles/gallery.css[39m 50ms (unchanged)
[90msrc/styles/index.css[39m 22ms (unchanged)
[90msrc/styles/sharing.css[39m 5ms (unchanged)
[90msrc/test/setup.ts[39m 3ms (unchanged)
[90msrc/vite-env.d.ts[39m 1ms (unchanged)
[90mtask007-validation.md[39m 16ms (unchanged)
[90mtsconfig.app.json[39m 2ms (unchanged)
[90mtsconfig.json[39m 1ms (unchanged)
[90mtsconfig.node.json[39m 1ms (unchanged)
[90mvite.config.ts[39m 4ms (unchanged)
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

 [32m✓[39m src/features/gallery/galleryDatabase.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 77[2mms[22m[39m
 [32m✓[39m src/features/composition/PhotoCapture.integration.test.tsx [2m([22m[2m10 tests[22m[2m)[22m[33m 1293[2mms[22m[39m
     [33m[2m✓[22m[39m shows the shutter only after camera and decoded asset are ready [33m 459[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1605[2mms[22m[39m
     [33m[2m✓[22m[39m prevents an older overlapping list request from replacing the newer one [33m 315[2mms[22m[39m
 [32m✓[39m src/features/camera/CameraView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1154[2mms[22m[39m
     [33m[2m✓[22m[39m requests the rear camera and enters ready after video readiness [33m 423[2mms[22m[39m
 [31m❯[39m src/features/sharing/SharingFlow.integration.test.tsx [2m([22m[2m4 tests[22m[2m | [22m[31m2 failed[39m[2m)[22m[33m 1016[2mms[22m[39m
[31m     [31m×[31m captures once, then shares and downloads the original result Blob[39m[33m 565[2mms[22m[39m
     [32m✓[39m keeps the capture result after the user cancels sharing[32m 212[2mms[22m[39m
[31m     [31m×[31m loads the full record once and shares and downloads its full-size Blob[39m[32m 124[2mms[22m[39m
     [32m✓[39m disables Delete during sharing and keeps detail after cancellation[32m 111[2mms[22m[39m
 [32m✓[39m src/features/composition/captureLifecycle.regression.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[33m 810[2mms[22m[39m
     [33m[2m✓[22m[39m recovers after an asset decode failure and retry [33m 561[2mms[22m[39m
 [32m✓[39m src/features/sharing/usePhotoSharing.test.tsx [2m([22m[2m17 tests[22m[2m)[22m[33m 989[2mms[22m[39m
     [33m[2m✓[22m[39m keeps Download when navigator.share is unavailable [33m 314[2mms[22m[39m
 [32m✓[39m src/features/composition/composePhoto.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 19[2mms[22m[39m
[90mstderr[2m | src/features/gallery/CaptureSave.integration.test.tsx[2m > [22m[2mcapture result gallery save[2m > [22m[2mshows an explicit Save to gallery action without auto-saving
[22m[39mAn update to CaptureResult inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/gallery/CaptureSave.integration.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[33m 774[2mms[22m[39m
     [33m[2m✓[22m[39m shows an explicit Save to gallery action without auto-saving [33m 333[2mms[22m[39m
[90mstderr[2m | src/features/overlay/CameraOverlay.test.tsx[2m > [22m[2mcamera overlay integration[2m > [22m[2mdoes not show an interactive overlay before the camera is ready
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/overlay/CameraOverlay.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[33m 796[2mms[22m[39m
 [32m✓[39m src/features/composition/captureGeometry.test.ts [2m([22m[2m25 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryFlow.integration.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 958[2mms[22m[39m
     [33m[2m✓[22m[39m captures, saves, reloads, opens detail, and deletes one photo [33m 954[2mms[22m[39m
 [32m✓[39m src/features/overlay/referenceAsset.node.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 61[2mms[22m[39m
 [32m✓[39m src/features/sharing/photoFile.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/features/gallery/thumbnail.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m src/features/overlay/PinchDragCoordination.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 380[2mms[22m[39m
     [33m[2m✓[22m[39m suppresses the original drag until it fully ends after a two-pointer pinch [33m 377[2mms[22m[39m
 [32m✓[39m src/features/camera/cameraAdapter.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/features/sharing/sharingAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 38[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayGeometry.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 11[2mms[22m[39m
 [32m✓[39m src/features/composition/captureAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayAssets.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/features/overlay/useOverlayController.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[33m 322[2mms[22m[39m
[90mstderr[2m | src/app/App.test.tsx[2m > [22m[2mApp[2m > [22m[2mrenders the camera foundation without requesting permission
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/app/App.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 201[2mms[22m[39m

[31m⎯⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Tests 2 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m src/features/sharing/SharingFlow.integration.test.tsx[2m > [22mcapture result sharing integration[2m > [22mcaptures once, then shares and downloads the original result Blob
[31m[1mTypeError[22m: sharedFile.arrayBuffer is not a function[39m
[36m [2m❯[22m src/features/sharing/SharingFlow.integration.test.tsx:[2m182:54[22m[39m
    [90m180|[39m     [35mawait[39m screen[33m.[39m[34mfindByText[39m([32m'Share sheet closed.'[39m)[33m;[39m
    [90m181|[39m     [35mconst[39m sharedFile [33m=[39m shareFile[33m.[39mmock[33m.[39mcalls[[34m0[39m][[34m0[39m][33m;[39m
    [90m182|[39m     expect(new TextDecoder().decode(await sharedFile.arrayBuffer())).t…
    [90m   |[39m                                                      [31m^[39m
    [90m183|[39m       [32m'full-size-capture'[39m[33m,[39m
    [90m184|[39m     )[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯[22m[39m

[41m[1m FAIL [22m[49m src/features/sharing/SharingFlow.integration.test.tsx[2m > [22mgallery detail sharing integration[2m > [22mloads the full record once and shares and downloads its full-size Blob
[31m[1mTypeError[22m: shareFile.mock.calls[0][0].arrayBuffer is not a function[39m
[36m [2m❯[22m src/features/sharing/SharingFlow.integration.test.tsx:[2m284:65[22m[39m
    [90m282|[39m     [35mawait[39m screen[33m.[39m[34mfindByText[39m([32m'Share sheet closed.'[39m)[33m;[39m
    [90m283|[39m     [34mexpect[39m(
    [90m284|[39m       new TextDecoder().decode(await shareFile.mock.calls[0][0].arrayB…
    [90m   |[39m                                                                 [31m^[39m
    [90m285|[39m     )[33m.[39m[34mtoBe[39m([32m'full-size-gallery'[39m)[33m;[39m
    [90m286|[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯[22m[39m


[2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m22 passed[39m[22m[90m (23)[39m
[2m      Tests [22m [1m[31m2 failed[39m[22m[2m | [22m[1m[32m183 passed[39m[22m[90m (185)[39m
[2m   Start at [22m 07:52:07
[2m   Duration [22m 13.37s[2m (transform 1.21s, setup 2.15s, import 4.07s, tests 10.59s, environment 17.94s)[22m


::error file=/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/SharingFlow.integration.test.tsx,title=src/features/sharing/SharingFlow.integration.test.tsx > capture result sharing integration > captures once%2C then shares and downloads the original result Blob,line=182,column=54::TypeError: sharedFile.arrayBuffer is not a function%0A ❯ src/features/sharing/SharingFlow.integration.test.tsx:182:54%0A%0A

::error file=/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/SharingFlow.integration.test.tsx,title=src/features/sharing/SharingFlow.integration.test.tsx > gallery detail sharing integration > loads the full record once and shares and downloads its full-size Blob,line=284,column=65::TypeError: shareFile.mock.calls[0][0].arrayBuffer is not a function%0A ❯ src/features/sharing/SharingFlow.integration.test.tsx:284:65%0A%0A
```

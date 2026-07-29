# Task 007 one-shot validation

- source commit: `24670c3f69b00f4f710ed8b348c4d5f143ec71f2`
- preparation: `npm run format`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 format
> prettier --write . --ignore-unknown

[90m.github/workflows/ci.yml[39m 33ms (unchanged)
[90m.github/workflows/deploy-pages.yml[39m 7ms (unchanged)
[90m.github/workflows/task007-one-shot.yml[39m 11ms (unchanged)
[90m.prettierrc.json[39m 31ms (unchanged)
[90mdocs/architecture.md[39m 172ms (unchanged)
[90mdocs/camera-device-smoke-test.md[39m 36ms (unchanged)
[90mdocs/capture-device-smoke-test.md[39m 41ms (unchanged)
[90mdocs/gallery-device-smoke-test.md[39m 25ms (unchanged)
[90mdocs/implementation-references.md[39m 117ms (unchanged)
[90mdocs/overlay-device-smoke-test.md[39m 13ms (unchanged)
[90mdocs/sharing-device-smoke-test.md[39m 27ms (unchanged)
[90meslint.config.js[39m 13ms (unchanged)
[90mindex.html[39m 27ms (unchanged)
[90mpackage-lock.json[39m 159ms (unchanged)
[90mpackage.json[39m 1ms (unchanged)
[90mREADME.md[39m 15ms (unchanged)
[90msrc/app/App.test.tsx[39m 9ms (unchanged)
[90msrc/app/App.tsx[39m 19ms (unchanged)
[90msrc/features/camera/cameraAdapter.test.ts[39m 37ms (unchanged)
[90msrc/features/camera/cameraAdapter.ts[39m 36ms (unchanged)
[90msrc/features/camera/cameraTypes.ts[39m 16ms (unchanged)
[90msrc/features/camera/CameraView.test.tsx[39m 84ms (unchanged)
[90msrc/features/camera/CameraView.tsx[39m 46ms (unchanged)
[90msrc/features/camera/useCamera.ts[39m 43ms (unchanged)
[90msrc/features/composition/captureAdapter.test.ts[39m 15ms (unchanged)
[90msrc/features/composition/captureAdapter.ts[39m 33ms (unchanged)
[90msrc/features/composition/captureGeometry.test.ts[39m 22ms (unchanged)
[90msrc/features/composition/captureGeometry.ts[39m 12ms (unchanged)
[90msrc/features/composition/captureLifecycle.regression.test.tsx[39m 57ms (unchanged)
[90msrc/features/composition/CaptureResult.tsx[39m 11ms (unchanged)
[90msrc/features/composition/composePhoto.test.ts[39m 24ms (unchanged)
[90msrc/features/composition/composePhoto.ts[39m 9ms (unchanged)
[90msrc/features/composition/compositionTypes.ts[39m 5ms (unchanged)
[90msrc/features/composition/PhotoCapture.integration.test.tsx[39m 60ms (unchanged)
[90msrc/features/composition/usePhotoCapture.ts[39m 26ms (unchanged)
[90msrc/features/gallery/CaptureSave.integration.test.tsx[39m 41ms (unchanged)
[90msrc/features/gallery/galleryDatabase.test.ts[39m 59ms (unchanged)
[90msrc/features/gallery/galleryDatabase.ts[39m 20ms (unchanged)
[90msrc/features/gallery/GalleryDetail.tsx[39m 23ms (unchanged)
[90msrc/features/gallery/GalleryFlow.integration.test.tsx[39m 40ms (unchanged)
[90msrc/features/gallery/galleryRepository.ts[39m 15ms (unchanged)
[90msrc/features/gallery/GalleryRepositoryContext.tsx[39m 3ms (unchanged)
[90msrc/features/gallery/galleryServices.ts[39m 2ms (unchanged)
[90msrc/features/gallery/galleryTypes.ts[39m 27ms (unchanged)
[90msrc/features/gallery/GalleryView.test.tsx[39m 56ms (unchanged)
[90msrc/features/gallery/GalleryView.tsx[39m 9ms (unchanged)
[90msrc/features/gallery/thumbnail.test.ts[39m 14ms (unchanged)
[90msrc/features/gallery/thumbnail.ts[39m 22ms (unchanged)
[90msrc/features/gallery/useGallery.ts[39m 26ms (unchanged)
[90msrc/features/overlay/CameraOverlay.test.tsx[39m 27ms (unchanged)
[90msrc/features/overlay/overlayAssets.test.ts[39m 3ms (unchanged)
[90msrc/features/overlay/overlayAssets.ts[39m 5ms (unchanged)
[90msrc/features/overlay/overlayGeometry.test.ts[39m 16ms (unchanged)
[90msrc/features/overlay/overlayGeometry.ts[39m 12ms (unchanged)
[90msrc/features/overlay/OverlayPreview.tsx[39m 4ms (unchanged)
[90msrc/features/overlay/overlayTypes.ts[39m 2ms (unchanged)
[90msrc/features/overlay/PinchDragCoordination.test.tsx[39m 17ms (unchanged)
[90msrc/features/overlay/referenceAsset.node.test.ts[39m 28ms (unchanged)
[90msrc/features/overlay/useOverlayController.test.tsx[39m 6ms (unchanged)
[90msrc/features/overlay/useOverlayController.ts[39m 4ms (unchanged)
[90msrc/features/overlay/useOverlayGestures.ts[39m 11ms (unchanged)
[90msrc/features/sharing/PhotoActions.tsx[39m 7ms (unchanged)
[90msrc/features/sharing/photoFile.test.ts[39m 18ms (unchanged)
[90msrc/features/sharing/photoFile.ts[39m 13ms (unchanged)
[90msrc/features/sharing/sharingAdapter.test.ts[39m 18ms (unchanged)
[90msrc/features/sharing/sharingAdapter.ts[39m 7ms (unchanged)
[90msrc/features/sharing/SharingFlow.integration.test.tsx[39m 44ms (unchanged)
[90msrc/features/sharing/sharingServices.ts[39m 2ms (unchanged)
[90msrc/features/sharing/SharingServicesContext.tsx[39m 2ms (unchanged)
[90msrc/features/sharing/sharingTypes.ts[39m 4ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.test.tsx[39m 24ms (unchanged)
[90msrc/features/sharing/usePhotoSharing.ts[39m 15ms (unchanged)
[90msrc/main.tsx[39m 3ms (unchanged)
[90msrc/styles/gallery.css[39m 59ms (unchanged)
[90msrc/styles/index.css[39m 31ms (unchanged)
[90msrc/styles/sharing.css[39m 5ms (unchanged)
[90msrc/test/setup.ts[39m 3ms (unchanged)
[90msrc/vite-env.d.ts[39m 1ms (unchanged)
[90mtask007-validation.md[39m 15ms (unchanged)
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

 [32m✓[39m src/features/gallery/galleryDatabase.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [31m❯[39m src/features/gallery/GalleryView.test.tsx [2m([22m[2m13 tests[22m[2m | [22m[31m1 failed[39m[2m)[22m[33m 1333[2mms[22m[39m
     [33m[2m✓[22m[39m shows loading and then the empty gallery action [33m 303[2mms[22m[39m
     [32m✓[39m shows a storage error and uses a new generation for retry[32m 75[2mms[22m[39m
     [32m✓[39m prevents an older overlapping list request from replacing the newer one[32m 55[2mms[22m[39m
     [32m✓[39m renders a defensive label for an injected invalid summary timestamp[32m 12[2mms[22m[39m
     [32m✓[39m renders repository order and creates URLs only for thumbnail Blobs[32m 15[2mms[22m[39m
     [32m✓[39m loads the full-size Blob only after opening detail[32m 121[2mms[22m[39m
[31m     [31m×[31m renders a defensive label for an injected invalid detail timestamp[39m[32m 61[2mms[22m[39m
     [32m✓[39m requires confirmation, coalesces repeated delete clicks, and refreshes list[32m 87[2mms[22m[39m
     [32m✓[39m does not let a late deletion close a different selected photo[32m 231[2mms[22m[39m
     [32m✓[39m keeps detail visible and allows retry after delete failure[32m 109[2mms[22m[39m
     [32m✓[39m ignores a late detail result after returning to the gallery[32m 56[2mms[22m[39m
     [32m✓[39m revokes thumbnail and detail object URLs on view exit[32m 94[2mms[22m[39m
     [32m✓[39m keeps Camera available when IndexedDB gallery loading fails[32m 104[2mms[22m[39m
 [32m✓[39m src/features/composition/PhotoCapture.integration.test.tsx [2m([22m[2m10 tests[22m[2m)[22m[33m 1418[2mms[22m[39m
     [33m[2m✓[22m[39m shows the shutter only after camera and decoded asset are ready [33m 481[2mms[22m[39m
 [32m✓[39m src/features/camera/CameraView.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 1008[2mms[22m[39m
     [33m[2m✓[22m[39m requests the rear camera and enters ready after video readiness [33m 369[2mms[22m[39m
 [32m✓[39m src/features/composition/captureLifecycle.regression.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[33m 821[2mms[22m[39m
     [33m[2m✓[22m[39m recovers after an asset decode failure and retry [33m 554[2mms[22m[39m
 [32m✓[39m src/features/sharing/SharingFlow.integration.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[33m 915[2mms[22m[39m
     [33m[2m✓[22m[39m captures once, then shares, downloads, and independently saves the original Blob [33m 701[2mms[22m[39m
 [32m✓[39m src/features/sharing/usePhotoSharing.test.tsx [2m([22m[2m17 tests[22m[2m)[22m[33m 903[2mms[22m[39m
 [32m✓[39m src/features/composition/composePhoto.test.ts [2m([22m[2m10 tests[22m[2m)[22m[32m 24[2mms[22m[39m
[90mstderr[2m | src/features/gallery/CaptureSave.integration.test.tsx[2m > [22m[2mcapture result gallery save[2m > [22m[2mshows an explicit Save to gallery action without auto-saving
[22m[39mAn update to CaptureResult inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/gallery/CaptureSave.integration.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[33m 785[2mms[22m[39m
     [33m[2m✓[22m[39m shows an explicit Save to gallery action without auto-saving [33m 348[2mms[22m[39m
[90mstderr[2m | src/features/overlay/CameraOverlay.test.tsx[2m > [22m[2mcamera overlay integration[2m > [22m[2mdoes not show an interactive overlay before the camera is ready
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/features/overlay/CameraOverlay.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[33m 768[2mms[22m[39m
 [32m✓[39m src/features/composition/captureGeometry.test.ts [2m([22m[2m25 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/features/gallery/GalleryFlow.integration.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 718[2mms[22m[39m
     [33m[2m✓[22m[39m captures, saves, reloads, opens detail, and deletes one photo [33m 712[2mms[22m[39m
 [32m✓[39m src/features/overlay/referenceAsset.node.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 39[2mms[22m[39m
 [32m✓[39m src/features/sharing/photoFile.test.ts [2m([22m[2m15 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/features/gallery/thumbnail.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/features/overlay/PinchDragCoordination.test.tsx [2m([22m[2m1 test[22m[2m)[22m[33m 435[2mms[22m[39m
     [33m[2m✓[22m[39m suppresses the original drag until it fully ends after a two-pointer pinch [33m 431[2mms[22m[39m
 [32m✓[39m src/features/camera/cameraAdapter.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/features/sharing/sharingAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 38[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayGeometry.test.ts [2m([22m[2m11 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/features/composition/captureAdapter.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 37[2mms[22m[39m
 [32m✓[39m src/features/overlay/overlayAssets.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/features/overlay/useOverlayController.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 223[2mms[22m[39m
[90mstderr[2m | src/app/App.test.tsx[2m > [22m[2mApp[2m > [22m[2mrenders the camera foundation without requesting permission
[22m[39mAn update to CameraView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 [32m✓[39m src/app/App.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 204[2mms[22m[39m

[31m⎯⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Tests 1 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m src/features/gallery/GalleryView.test.tsx[2m > [22mGalleryView detail and deletion[2m > [22mrenders a defensive label for an injected invalid detail timestamp
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the alt text: Saved Clawd composition

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<section[31m
      [33maria-labelledby[31m=[32m"gallery-detail-heading"[31m
      [33mclass[31m=[32m"gallery-card"[31m
    [36m>[31m
      [36m<button[31m
        [33mclass[31m=[32m"secondary-action"[31m
        [33mtype[31m=[32m"button"[31m
      [36m>[31m
        [0mBack to gallery[0m
      [36m</button>[31m
      [36m<h2[31m
        [33mid[31m=[32m"gallery-detail-heading"[31m
      [36m>[31m
        [0mSaved Clawd photo[0m
      [36m</h2>[31m
      [36m<p[31m
        [33mrole[31m=[32m"status"[31m
      [36m>[31m
        [0mPreparing saved photo…[0m
      [36m</p>[31m
      [36m<dl[31m
        [33mclass[31m=[32m"capture-metadata gallery-detail-metadata"[31m
      [36m>[31m
        [36m<div>[31m
          [36m<dt>[31m
            [0mCaptured[0m
          [36m</dt>[31m
          [36m<dd>[31m
            [36m<time>[31m
              [0mUnknown capture time[0m
            [36m</time>[31m
          [36m</dd>[31m
        [36m</div>[31m
        [36m<div>[31m
          [36m<dt>[31m
            [0mSize[0m
          [36m</dt>[31m
          [36m<dd>[31m
            [0m1200[0m
            [0m × [0m
            [0m900[0m
          [36m</dd>[31m
        [36m</div>[31m
        [36m<div>[31m
          [36m<dt>[31m
            [0mCamera[0m
          [36m</dt>[31m
          [36m<dd>[31m
            [0mRear[0m
          [36m</dd>[31m
        [36m</div>[31m
        [36m<div>[31m
          [36m<dt>[31m
            [0mClawd[0m
          [36m</dt>[31m
          [36m<dd>[31m
            [0mreference-clawd[0m
          [36m</dd>[31m
        [36m</div>[31m
      [36m</dl>[31m
      [36m<div[31m
        [33mclass[31m=[32m"photo-action-panel"[31m
      [36m>[31m
        [36m<div[31m
          [33maria-busy[31m=[32m"false"[31m
          [33maria-label[31m=[32m"Photo sharing and download actions"[31m
          [33mclass[31m=[32m"photo-actions"[31m
        [36m>[31m
          [36m<button[31m
            [33mclass[31m=[32m"primary-action"[31m
            [33mdisabled[31m=[32m""[31m
            [33mtype[31m=[32m"button"[31m
          [36m>[31m
            [0mDownload[0m
          [36m</button>[31m
        [36m</div>[31m
        [36m<p[31m
          [33mclass[31m=[32m"photo-action-hint"[31m
        [36m>[31m
          [0mSystem file sharing is unavailable in this browser. Download remains available.[0m
        [36m</p>[31m
      [36m</div>[31m
      [36m<button[31m
        [33mclass[31m=[32m"danger-action"[31m
        [33mtype[31m=[32m"button"[31m
      [36m>[31m
        [0mDelete photo[0m
      [36m</button>[31m
    [36m</section>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/features/gallery/GalleryView.test.tsx:[2m217:19[22m[39m
    [90m215|[39m     [35mconst[39m label [33m=[39m [35mawait[39m screen[33m.[39m[34mfindByText[39m([32m'Unknown capture time'[39m)[33m;[39m
    [90m216|[39m     [34mexpect[39m(label[33m.[39m[34mclosest[39m([32m'time'[39m))[33m.[39mnot[33m.[39m[34mtoHaveAttribute[39m([32m'datetime'[39m)[33m;[39m
    [90m217|[39m     expect(screen.getByAltText('Saved Clawd composition')).toBeInTheDo…
    [90m   |[39m                   [31m^[39m
    [90m218|[39m   })[33m;[39m
    [90m219|[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯[22m[39m


[2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m22 passed[39m[22m[90m (23)[39m
[2m      Tests [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m182 passed[39m[22m[90m (183)[39m
[2m   Start at [22m 08:00:47
[2m   Duration [22m 12.86s[2m (transform 1.18s, setup 2.15s, import 3.79s, tests 9.85s, environment 17.24s)[22m


::error file=/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/gallery/GalleryView.test.tsx,title=src/features/gallery/GalleryView.test.tsx > GalleryView detail and deletion > renders a defensive label for an injected invalid detail timestamp,line=217,column=19::TestingLibraryElementError: Unable to find an element with the alt text: Saved Clawd composition%0A%0AIgnored nodes: comments, script, style%0A<body>%0A  <div>%0A    <section%0A      aria-labelledby="gallery-detail-heading"%0A      class="gallery-card"%0A    >%0A      <button%0A        class="secondary-action"%0A        type="button"%0A      >%0A        Back to gallery%0A      </button>%0A      <h2%0A        id="gallery-detail-heading"%0A      >%0A        Saved Clawd photo%0A      </h2>%0A      <p%0A        role="status"%0A      >%0A        Preparing saved photo…%0A      </p>%0A      <dl%0A        class="capture-metadata gallery-detail-metadata"%0A      >%0A        <div>%0A          <dt>%0A            Captured%0A          </dt>%0A          <dd>%0A            <time>%0A              Unknown capture time%0A            </time>%0A          </dd>%0A        </div>%0A        <div>%0A          <dt>%0A            Size%0A          </dt>%0A          <dd>%0A            1200%0A             × %0A            900%0A          </dd>%0A        </div>%0A        <div>%0A          <dt>%0A            Camera%0A          </dt>%0A          <dd>%0A            Rear%0A          </dd>%0A        </div>%0A        <div>%0A          <dt>%0A            Clawd%0A          </dt>%0A          <dd>%0A            reference-clawd%0A          </dd>%0A        </div>%0A      </dl>%0A      <div%0A        class="photo-action-panel"%0A      >%0A        <div%0A          aria-busy="false"%0A          aria-label="Photo sharing and download actions"%0A          class="photo-actions"%0A        >%0A          <button%0A            class="primary-action"%0A            disabled=""%0A            type="button"%0A          >%0A            Download%0A          </button>%0A        </div>%0A        <p%0A          class="photo-action-hint"%0A        >%0A          System file sharing is unavailable in this browser. Download remains available.%0A        </p>%0A      </div>%0A      <button%0A        class="danger-action"%0A        type="button"%0A      >%0A        Delete photo%0A      </button>%0A    </section>%0A  </div>%0A</body>%0A ❯ Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19%0A ❯ node_modules/@testing-library/dom/dist/query-helpers.js:76:38%0A ❯ node_modules/@testing-library/dom/dist/query-helpers.js:52:17%0A ❯ node_modules/@testing-library/dom/dist/query-helpers.js:95:19%0A ❯ src/features/gallery/GalleryView.test.tsx:217:19%0A%0A
```

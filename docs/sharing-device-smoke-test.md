# Sharing and download device smoke test

Task 007 automated tests mock Web Share, File construction, object URLs, temporary anchors, and user-cancellation/error paths. A real Share Sheet, browser download destination, installed-PWA user activation, and target-app behavior still require physical-device validation.

Record the device, OS version, browser version, tab or installed-PWA mode, source photo type, resulting filename, and observed target behavior. Do not interpret a completed Share Sheet as proof that the target app permanently saved the file.

## iPhone Safari tab

1. Capture a photo and confirm `Share`, `Download`, `Save to gallery`, and `Retake` have distinct labels.
2. Tap `Share` directly and confirm the Share Sheet opens with one image preview whose crop, orientation, and Clawd overlay match the capture result.
3. Cancel the Share Sheet. Confirm the capture remains visible, the UI does not show a red failure, and another Share attempt works.
4. Share to Messages and Files when available. Confirm the attachment is an image with the expected MIME type and `clawdcam-YYYYMMDD-HHmmss.ext` local-time filename where the target exposes it.
5. Save the capture to the local gallery, open its detail, and repeat Share. Confirm the full-size photo is used rather than the thumbnail.
6. Tap Download from capture and detail. Record whether Safari downloads, previews, opens a new surface, ignores the filename, or offers Files. Confirm ClawdCam says only `Download started` and never claims the image was saved to Photos.
7. Repeat Share and Download several times, then Retake and navigate through Gallery. Watch for stale status messages, missing images, or memory growth.

## iPhone installed PWA

1. Repeat capture-result and gallery-detail Share checks from the installed standalone PWA.
2. Confirm Share is initiated only by a direct button tap and opens the Share Sheet.
3. Cancel and return to the PWA. Confirm controls recover and the photo remains intact.
4. Complete a share, return to the PWA, and confirm the UI does not claim that the target app saved the photo.
5. Perform consecutive Share operations and consecutive Download operations.
6. Start Share and return to the PWA, then use Retake or Gallery navigation. Confirm no old status appears on a replacement photo.
7. Background and restore the PWA before sharing and after closing the Share Sheet. Record any lifecycle difference from Safari tab mode.

## Android Chrome tab

1. Capture with rear and front cameras and share each result.
2. Confirm `navigator.canShare({ files })` capability corresponds to whether the Share button is shown.
3. Verify the Share Sheet receives one full-size image with the expected MIME type and deterministic filename.
4. Share to at least two common targets available on the device. Confirm image preview and orientation are correct without assuming the target saved it.
5. Cancel the Share Sheet and confirm the result/detail remains, no failure banner appears, and Share can be retried.
6. Download capture and gallery photos. Inspect the Downloads surface when available and record the actual filename and location.
7. Repeat with JPEG, PNG, or WebP output if those formats become available from existing captures; do not add re-encoding solely for this test.

## Android installed PWA

1. Compare Share and Download behavior with Chrome tab mode.
2. Confirm the user gesture opens the Share Sheet from both capture and gallery detail.
3. Background and restore during or after the Share Sheet, then verify controls and status remain attached to the correct photo.
4. Run consecutive download/share cycles and confirm no duplicate Share Sheet opens from a rapid double tap.
5. Confirm Delete is disabled while sharing a gallery detail and becomes available again after completion or cancellation.

## Desktop browsers

### Chrome and Edge

1. Confirm Download is always available for a valid full-size Blob.
2. When file sharing is supported and `canShare({ files })` returns true, validate Share with one image File.
3. When Web Share is absent or text-only, confirm Share is hidden and a clear Download fallback remains.
4. Inspect the downloaded filename, MIME type, and dimensions.
5. Repeat capture and gallery detail downloads and confirm neither changes the local gallery record.

### Firefox

1. Confirm the expected Download fallback works even when Web Share is unavailable.
2. Verify no Share button appears unless file capability detection genuinely succeeds.
3. Download repeatedly and watch for object-URL or memory growth.

## Failure and lifecycle checks

- Deny or block sharing through browser or OS policy when possible and confirm a real failure is understandable while Download remains usable.
- Trigger a user cancellation and confirm it is distinct from failure.
- Navigate away from gallery detail while a mocked or slow share target is returning, where the platform allows it, and confirm no stale status appears after navigation.
- Start sharing a capture and confirm Retake is disabled until the operation settles.
- Start sharing a gallery detail and confirm Delete is disabled until the operation settles.
- Confirm sharing or downloading never creates, updates, or deletes an IndexedDB record.
- Confirm no action automatically saves to Photos, Android Gallery, cloud storage, or a social platform.
- Confirm no UI copy promises a browser download location or claims a share target permanently saved the image.

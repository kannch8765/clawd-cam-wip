# Gallery device smoke test

Run this checklist only on a disposable test gallery. Task 006 automated tests cover schema and UI logic, but browser retention, installed-PWA behavior, private mode, eviction, and memory pressure require physical devices.

## Test matrix

Record browser and OS versions for each available target:

- iPhone Safari tab
- iPhone installed PWA
- Android Chrome tab
- Android installed PWA, when installation is available

## Basic save and persistence

1. Open ClawdCam and start the rear camera.
2. Capture one photo and confirm that it remains visible before saving.
3. Tap `Save to gallery` once and confirm the button enters a disabled saving state and then reports success.
4. Open Gallery and confirm a real thumbnail appears without visible stretching.
5. Open the tile and confirm the full-size composed photo, capture time, dimensions, Rear camera label, and Clawd asset ID.
6. Return to Gallery and confirm the thumbnail remains.
7. Refresh the browser tab. Confirm the photo remains in Gallery.
8. Fully close the tab or installed PWA, reopen it, and confirm the photo remains.
9. Turn on airplane mode after one successful online load, reopen the installed PWA or cached page, and confirm the local gallery can be opened offline.

## Multiple records and ordering

1. Capture and save at least three photos several seconds apart.
2. Save one photo with the front camera and confirm its detail says Front camera.
3. Confirm the newest capture appears first.
4. Reload Gallery repeatedly and confirm order remains stable.
5. Rapidly double-tap `Save to gallery` on a new capture and confirm only one tile is added.
6. Save, tap Retake, and confirm the stored tile remains.

## Detail and deletion

1. Open a photo detail and navigate back repeatedly.
2. Confirm memory use does not grow continuously after several list/detail cycles.
3. Tap Delete photo and cancel the confirmation. Confirm the photo remains.
4. Confirm deletion, verify the app returns to Gallery, and verify the thumbnail disappears.
5. Refresh and reopen the PWA. Confirm the deleted photo does not return.
6. Delete one item while other photos remain and confirm no unrelated record changes.

## Failure and recovery

1. Deny or disable browser storage where the platform permits it. Confirm Gallery shows an understandable error while Camera still starts and captures in memory.
2. Fill or constrain browser storage until a save reports insufficient space, when practical. Confirm the app does not claim success, does not delete older photos, and keeps the capture result available for retry.
3. Clear this site's storage externally while Gallery is open, then reload. Confirm the app shows empty or a recoverable storage error rather than crashing.
4. Test a private-browsing session. Record whether IndexedDB opens, whether records survive a refresh, and whether they disappear when the private session closes.
5. On platforms with automatic website-data eviction, document any observed cleanup behavior. Task 006 does not promise protection from browser eviction.

## Object URL and memory behavior

1. Save enough photos to fill several grid rows.
2. Move repeatedly between Camera, Gallery, and several detail pages.
3. Use browser developer tools when available to watch Blob/object URL and memory behavior.
4. Confirm leaving detail releases the full-size temporary URL and that reloading/removing grid entries releases old thumbnail URLs.
5. Confirm opening Gallery does not eagerly decode every full-size photo.
6. Leave the PWA open for several minutes after navigation and confirm memory stabilizes rather than increasing after every cycle.

## Results to record

For every target, record:

- save success and failure messages;
- refresh persistence;
- close/reopen persistence;
- offline gallery availability;
- private-mode behavior;
- installed-PWA behavior;
- thumbnail orientation and aspect ratio;
- newest-first ordering;
- confirmed deletion persistence;
- storage-pressure behavior;
- any visible memory or object URL regression.

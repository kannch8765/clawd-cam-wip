# Capture Physical-Device Smoke-Test Checklist

Task 005 has mocked camera, video-dimension, image-decode, Canvas, Blob, and object-URL tests. The following checks still require physical devices because automated tests cannot prove camera frame timing, mobile orientation behavior, installed-PWA lifecycle, visual crop parity, or memory behavior.

## iPhone Safari tab

- start the rear camera, move/scale/rotate Clawd, and take a photo;
- confirm the generated result matches the visible preview composition and centered cover crop;
- switch to the front camera and confirm camera pixels are mirrored in the result while Clawd is not flipped;
- verify negative rotation and angles near `180`/`-180` match the preview;
- place Clawd partly outside each edge and confirm the result preserves that placement;
- rotate between portrait and landscape, wait for a ready preview, and capture in each orientation;
- use **Retake** repeatedly and confirm no new permission prompt appears;
- interrupt or stop the camera after a successful capture and confirm the existing result remains viewable;
- return from a result after interruption and confirm the existing restart path appears.

## iPhone installed PWA

Repeat the Safari-tab checks in the installed standalone PWA. Also background and restore the PWA before capture, capture after a long-running camera session, and confirm Retake resumes the existing usable preview without duplicate gesture listeners.

## Android Chrome tab

- repeat rear/front capture and preview-to-result composition checks;
- confirm centered cover crop matches the visible `object-fit: cover` preview on portrait and landscape phones;
- verify front-camera pixels mirror but the transparent Clawd asset remains unmirrored;
- capture after drag, minimum/maximum scale, negative rotation, near-180 rotation, and partial off-frame placement;
- perform rapid shutter taps and confirm only one result is produced;
- perform several Capture → Retake cycles without camera restart or accumulated listeners.

## Android installed PWA

When installable, repeat the Chrome-tab checks in standalone mode. Background/restore the PWA, rotate the device, and capture after a long camera session.

## 0.1.0 orientation regression retest

After deploying `fix/0.1.0-device-validation`, repeat portrait → landscape → portrait captures on the installed iPhone PWA. Wait until the shutter is enabled after each rotation, confirm landscape JPEG pixels satisfy `width > height`, confirm the returned portrait JPEG satisfies `height > width`, and verify the normalized Clawd transform remains visually unchanged. The 2026-07-30 deployed-base run failed this check and must not be treated as passing from automated tests alone.

## Result quality and memory

- inspect output dimensions and verify the long edge follows the 960–2048 pixel policy without using device pixel ratio;
- inspect fine camera detail and Clawd edges for acceptable JPEG quality;
- confirm transparent PNG regions reveal camera pixels rather than a white or gray card;
- capture and Retake repeatedly while watching browser memory, ensuring old Blob object URLs are released;
- verify a failed asset decode, missing Canvas context, or failed Blob encode shows a recoverable capture error without stopping the camera;
- verify no IndexedDB record, download, automatic system-gallery save, or Web Share action is created by Task 005.

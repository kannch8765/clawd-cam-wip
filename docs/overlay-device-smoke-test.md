# Overlay Physical-Device Smoke-Test Checklist

Task 004 uses mocked camera adapters and synthetic gesture inputs in automated tests. The checks below still require real touch hardware and both browser-tab and installed-PWA environments.

## iPhone and iOS Safari

Test in a normal Safari tab and the installed standalone PWA:

- start the camera and confirm the reference Clawd appears only after a usable preview is ready;
- drag Clawd with one finger without scrolling the page or starting native image drag;
- pinch with two fingers to scale, including reaching the minimum and maximum without a jump;
- rotate with two fingers in both directions and confirm the final angle remains after release;
- move the pinch center while scaling and confirm Clawd follows continuously rather than returning to its default position;
- switch between portrait and landscape and confirm relative placement remains stable;
- switch to the front camera and confirm only camera pixels mirror while Clawd remains unmirrored;
- switch back to the rear camera and confirm neither camera nor Clawd is mirrored;
- use **Reset Clawd** and confirm the centered default transform returns;
- background and restore the tab/PWA, restart an interrupted camera, and confirm gestures work once without duplicate listeners.

## Android and Chrome

Test in a normal Chrome tab and the installed standalone PWA when available:

- repeat single-finger drag, two-finger scale, two-finger rotation, and moving-pinch-center checks;
- confirm browser page zoom, pull-to-refresh, scrolling, and image drag are not triggered on the overlay surface;
- rotate the phone after placing Clawd near each edge and confirm normalized placement stays stable;
- verify partial off-frame placement is possible but bounded;
- verify front/rear mirror behavior matches the iPhone checklist;
- restart or switch cameras several times and confirm each gesture produces one update rather than accumulated listener behavior.

## Deployment checks

- verify the reference PNG loads under the repository GitHub Pages base path;
- inspect the PNG over live video and confirm the gray-white background and white card/cutout areas are transparent;
- confirm the committed asset is treated as reference/test artwork, not a final production Clawd package;
- confirm no real camera request occurs during automated tests or build steps.

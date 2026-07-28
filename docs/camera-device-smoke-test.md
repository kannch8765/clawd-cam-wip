# Camera Device Smoke-Test Checklist

Task 003 is covered by mocked browser API tests. The following checks still require physical devices because desktop emulation cannot prove mobile camera, permission, installed-PWA, or interruption behavior.

## iPhone and iOS Safari

Test both a normal Safari tab and the installed standalone PWA:

- camera access starts only after tapping **Start camera**;
- accepting permission reaches a non-black, inline preview;
- denying permission shows the recovery guidance and retry action;
- front and rear switching works when multiple inputs are exposed;
- the front preview is mirrored and the rear preview is not;
- switching stops the old camera before the new preview opens;
- portrait/landscape rotation recovers with valid intrinsic dimensions;
- backgrounding, locking the phone, or another camera app interrupting the track produces a restartable state;
- leaving the page releases the camera indicator and all tracks.

## Android and Chrome

Test in a normal Chrome tab and, when installable, the standalone PWA:

- the initial request prefers a rear-facing camera without requiring an exact lens;
- permission acceptance, denial, browser-setting recovery, and retry behave clearly;
- front/rear switching works on a phone with multiple camera inputs;
- the front preview is mirrored and the rear preview is not;
- phones exposing several rear lenses still select a usable camera after fallback;
- orientation changes preserve a cover-fitted live preview with non-zero intrinsic dimensions;
- camera-busy and interrupted-track cases enter a recoverable state;
- leaving or replacing the camera screen releases the active hardware indicator.

## Deployment checks

- verify the GitHub Pages site is served over HTTPS;
- verify the generated PWA uses the repository base path correctly;
- confirm no real camera request occurs during automated tests or build steps.

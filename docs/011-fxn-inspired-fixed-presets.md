# ClawdCam Task 011 — FXN-Inspired Fixed Filter Preset Experiment

Status: **DOCS-ONLY PRODUCT DIRECTION — NO IMPLEMENTATION AUTHORIZATION**  
Frozen base: `6f1f349e6be97b5378a7b99e2cd343b6d09aeb4b`  
Branch: `docs/011-fxn-inspired-filter-presets`  
Date: 2026-08-06

## Purpose

Define the first ClawdCam photo-filter experiment around a soft, clear, Fuji-adjacent digital look inspired by the product feel of Dazz Camera's `FXN R` camera.

This document does not claim to reproduce Dazz's proprietary rendering, does not adopt the `FXN R` name for ClawdCam, and does not authorize reverse engineering or copying proprietary assets. The target is the owner's preferred visual character:

- clear cyan-leaning greens and blues;
- creamy, gently compressed highlights;
- warm but not orange-heavy skin tones;
- slightly lifted blacks;
- reduced local harshness;
- soft highlight diffusion rather than strong vintage grain.

The governing implementation reference remains `docs/0.2.0-feature-references.md`, especially its photo-filter pipeline boundary.

## Product decision

The first filter version should be **fixed-preset only**.

ClawdCam should expose named, curated presets that can be selected with one tap. It should not expose a general color editor or individual sliders for contrast, saturation, temperature, tint, bloom, grain, or other rendering parameters.

The implementation may remain data-driven internally so presets can be tuned in source without rebuilding the UI architecture. The user-facing surface should still behave like choosing a camera or film profile, not operating Lightroom.

```text
internal implementation
  parameterized preset data

user experience
  one-tap named presets
  no manual tuning controls
```

## First comparison set

The first experimental build should contain the unfiltered camera plus seven fixed candidates. The candidates deliberately isolate color, highlight handling, and diffusion before combining them.

| Preset ID | Working label | Purpose | Color treatment | Highlight / softness treatment |
| --- | --- | --- | --- | --- |
| `none` | Original | Control image | None | None |
| `soft-cyan-mild` | Soft Cyan I | Test the color family at low strength | Slight cyan shift in greens and blues, mild black lift, restrained saturation | None beyond gentle tone shaping |
| `soft-cyan-strong` | Soft Cyan II | Test whether the preferred look depends on stronger color separation | Stronger cyan-green and pale-blue bias, more visible black lift | None beyond gentle tone shaping |
| `cream-highlight-mild` | Cream I | Isolate creamy whites and warm skin | Nearly neutral shadows, subtly warm highlights and skin | Mild highlight compression |
| `cream-highlight-strong` | Cream II | Test a more obvious creamy digital look | Warmer highlights without orange-heavy mids | Stronger highlight roll-off and slight midtone lift |
| `bloom-r-mild` | Bloom R I | Isolate softness from color | Near-neutral color | Mild highlight diffusion and reduced local harshness |
| `bloom-r-strong` | Bloom R II | Find the upper useful softness boundary | Near-neutral color | Clearly visible but controlled highlight diffusion |
| `neko-r-balanced` | Neko R | Combined candidate | Balanced cyan-green, pale blue, warm skin, slightly lifted blacks | Creamy highlight compression plus moderate diffusion |

These names are working labels. The diagnostic `I` and `II` variants are not intended to remain as permanent product presets.

## Why the candidates are separated

A single imitation preset would make a failed result ambiguous. The comparison set should answer three independent questions:

1. Does the preferred character mainly come from the cyan / clear color palette?
2. Does it mainly come from creamy highlight handling and lifted midtones?
3. Does it mainly come from soft highlight diffusion and lower local contrast?

`Neko R` then tests whether the selected strengths remain attractive when combined.

## Rendering boundary

Filters affect **camera pixels only**.

They must not recolor, blur, bloom, or otherwise alter the Clawd sticker or a future uploaded sticker. The live preview and exported photo should consume the same selected preset identity, while preserving the existing separation between camera composition and overlay composition.

At shutter time, the capture snapshot should freeze at least:

```text
selected filter preset ID
camera framing preset and source crop
camera source identity and dimensions
overlay asset and transform
output dimensions
```

Changing filters after the shutter begins must not alter an in-flight capture.

## Internal preset shape

The implementation should use a small static preset table rather than branching on display labels. One possible boundary is:

```ts
interface FixedFilterPreset {
  id: FilterPresetId;
  label: string;
  description: string;
  colorProfile: ColorProfileId;
  toneProfile: ToneProfileId;
  bloomProfile?: BloomProfileId;
}
```

The exact renderer fields belong to the implementation task. The important product constraint is that they remain curated internal values rather than user-facing sliders.

The earlier `cssFilter` / `canvasFilter` preset model may be extended narrowly if highlight diffusion requires more than a single filter string. It must not grow into a general renderer graph, layer editor, or third-party image-editor dependency.

## First-slice non-goals

The first experiment must not add:

- manual adjustment sliders;
- user-created presets;
- Nikon Picture Control import;
- `.cube` LUT import;
- Lightroom / XMP import;
- post-capture editing;
- undo / redo history;
- crop or layer editing;
- date stamps, light leaks, dust, scratches, or heavy grain;
- a generic shader or node editor;
- direct use of the `FXN R` product name in shipped ClawdCam UI.

Subtle grain and vignette should remain off during the comparison because they would make it harder to identify whether color, tone, or bloom produced the preferred result.

## Test scenes

Each candidate should be compared against the original using the same iPhone and the same scene. A useful minimum set is:

1. daylight skin tone;
2. blue sky with green plants;
3. white or light-gray wall;
4. indoor warm lighting;
5. night lights or bright signage;
6. a dark scene containing small bright highlights.

The test should preserve the same camera, focal preset, framing, and approximate exposure for the comparison set.

## Owner evaluation questions

The experiment should be judged by direct visual preference rather than a numerical color target.

For each scene, record:

- which candidate has the most comfortable overall color;
- which candidate renders whites best;
- which candidate renders skin best;
- which softness strength feels closest to the desired camera character;
- which candidate the owner would actually leave selected for everyday use.

No candidate needs to win every scene. The result may combine the preferred color candidate with the preferred bloom strength in a correction pass.

## Acceptance boundary for a later implementation task

A later Task 011 implementation may be accepted only when:

- the UI exposes `Original` plus the fixed comparison presets without manual sliders;
- filter selection changes the live camera preview;
- the selected preset is frozen into the shutter-time capture snapshot;
- exported camera pixels visibly correspond to the selected preview preset;
- overlays remain unfiltered;
- camera restart, front / rear switching, focal-preset switching, retake, gallery, and sharing remain operational;
- stale filter or capture completion cannot overwrite a newer session;
- installed-iPhone-PWA validation records any material preview / export mismatch;
- unsupported rendering behavior fails explicitly rather than silently saving an unfiltered image under a selected filtered preview.

Pixel equality between preview and export is not required. Grossly different color, highlight behavior, or diffusion is a blocker.

## Post-experiment decision

After owner comparison:

1. select the preferred color strength;
2. select the preferred highlight / bloom strength;
3. tune one combined `Neko R` correction candidate;
4. remove diagnostic duplicates from the product build;
5. retain only approximately two to four distinct presets that the owner would genuinely use.

A likely final family, subject to the comparison result, is:

```text
Original
Soft Cyan
Cream R
Neko R
```

`Bloom R` should remain as a standalone product preset only if it is useful beyond diagnosing the combined look.

## Decision

```text
ADOPT fixed one-tap presets
ADOPT internal data-driven tuning
ADOPT controlled comparison variants
ADAPT the existing preview / Canvas capture boundary
DEFER manual controls and imported filter formats
REJECT a general image editor for this slice
```

# ClawdCam Task 011T — Owner-Guided Filter Tuning Loop

Status: **DOCS-ONLY TUNING TASK — NO PRODUCT MERGE AUTHORIZATION**  
Base direction: `docs/011-fxn-inspired-fixed-presets.md`  
Branch: `docs/011-fxn-inspired-filter-presets`

## Goal

Tune one or more fixed ClawdCam filter presets together with the owner through a small number of visual comparison rounds, then write the final accepted parameter values to GitHub.

This is not a one-shot implementation task and it is not a request to guess a finished FXN-like recipe in advance. The tuning worker should act as an interactive visual collaborator:

```text
collect references
→ build a plausible starting candidate
→ render a small comparison set
→ ask the owner what feels right or wrong
→ revise the candidate
→ repeat only while another round is useful
→ record the accepted values in GitHub
```

The number of rounds is intentionally not fixed. One round may be enough for a narrow correction; several rounds are allowed when color, highlight handling, and softness need to be separated before they can be recombined.

## Product target

The target is an original ClawdCam preset family inspired by the owner's preferred visual qualities in Dazz Camera's `FXN R` camera:

- soft, clear digital rendering rather than heavy vintage damage;
- cyan-leaning greens and pale blues;
- creamy, gently compressed highlights;
- warm skin that does not become strongly orange;
- slightly lifted blacks and reduced local harshness;
- controlled highlight diffusion or bloom;
- little or no visible grain during tuning.

The task must not claim exact reproduction of Dazz's proprietary renderer and must not ship the `FXN R` name or proprietary Dazz assets.

## Starting material

The tuning worker may begin with public visual references found online. These references are useful for estimating the general direction, but they are not calibration truth because their original exposure, white balance, camera model, editing history, and compression are usually unknown.

Later rounds should give higher weight to owner-provided images, especially when the owner supplies:

- examples they personally like;
- several different lighting conditions;
- an unfiltered image and an FXN R result from the same or nearly the same scene;
- notes such as “this color is right but this softness is too strong.”

The worker should preserve the distinction between:

```text
public references
  useful for initial direction

owner-provided examples
  useful for preference and correction

paired original / filtered examples
  useful for image analysis and closer parameter estimation
```

## Allowed working methods

The worker may combine visual judgment and lightweight analysis. Useful methods include:

- inspecting public and owner-provided reference images;
- using a browser or development Filter Lab to compare Original and candidate renders;
- rendering several deliberately different candidates rather than many nearly identical ones;
- checking RGB, luminance, hue, saturation, and highlight distributions;
- estimating tone-curve changes from paired images;
- comparing edge and highlight neighborhoods to estimate bloom strength and radius;
- using small scripts to generate contact sheets or batch candidate renders;
- adjusting preset source values directly when a temporary tuning UI would add unnecessary work.

No single metric decides the result. Numerical similarity may narrow the search, but the owner's visual preference remains authoritative.

## Flexible tuning loop

Each round should stay small enough for the owner to compare comfortably.

A normal round may contain approximately two to six candidates, but this is guidance rather than a hard requirement. Each candidate should test a meaningful question, for example:

```text
A: current balanced candidate
B: same color with weaker bloom
C: same bloom with cooler highlights
D: stronger cyan separation but unchanged tone curve
```

The worker should briefly explain what changed, then ask for direct reactions such as:

- which overall color feels best;
- whether whites are too yellow, gray, or cyan;
- whether skin is too orange, pink, pale, or dull;
- whether greens and blues feel clear or artificial;
- whether blacks are pleasantly lifted or washed out;
- whether bloom feels soft, foggy, or distracting;
- which candidate the owner would actually leave selected.

The owner does not need to describe changes in technical vocabulary. Reactions such as “this one is prettier,” “too yellow,” “the other one is softer,” or “combine this color with that bloom” are sufficient input for the next round.

The worker may abandon an early parameter family when the owner consistently dislikes it. The task does not require preserving the original seven diagnostic candidates or forcing all planned variants through every round.

## Parameter handling

Internal parameters may remain implementation-specific. The tuning worker should use the narrowest model that can reproduce the intended result and avoid creating a general image editor.

Possible parameter groups include:

```text
exposure and midtone lift
tone curve and black lift
highlight compression
white-balance temperature and tint
selective green and blue hue / saturation changes
skin-tone protection
local contrast or clarity reduction
bloom threshold, intensity, and radius
subtle sharpening compensation
```

Do not add user-facing sliders as part of this task. Temporary development controls are allowed only when they make comparison faster; they are not a product requirement and should not become shipped UI by default.

## Stop condition

The tuning loop ends when the owner explicitly accepts a candidate or says the result is good enough to keep.

It may also stop with a documented best candidate when additional rounds no longer produce a meaningful improvement. The worker should not continue indefinitely in pursuit of an unverifiable pixel-perfect match.

Before finalizing, confirm at least:

- the accepted candidate looks intentional across more than one scene;
- skin, whites, greens, blues, dark areas, and bright highlights have no obvious severe failure;
- the chosen softness is useful outside a single reference photo;
- preview and final capture use the same canonical preset values if the renderer is already implemented.

## Required GitHub result

The only mandatory final delivery is that the accepted parameter set is written to GitHub in a stable, reviewable form.

When the filter renderer and preset table already exist, update the canonical preset source values and add a short result note identifying:

- the final preset name and ID;
- the exact accepted parameter values;
- the main visual intent;
- any deliberately unsupported or approximate behavior;
- the owner acceptance date or tuning round identifier.

When tuning occurs before the renderer exists, record the same information in:

```text
docs/011t-filter-tuning-result.md
```

using a structured table or code block that a later implementation worker can transfer without reinterpreting the values.

Temporary screenshots, contact sheets, generated candidates, browser state, local scripts, and intermediate parameter sweeps do not need to be committed unless they are necessary to understand the final decision.

## Repository boundaries

This tuning task must not by itself:

- merge or modify `main`;
- open or merge a pull request;
- rename or publish the final preset without owner acceptance;
- add Nikon Picture Control, `.cube`, XMP, or other import formats;
- add a general-purpose editor, layer graph, or plugin system;
- apply filtering to Clawd or uploaded sticker pixels;
- claim visual identity with Dazz, Fujifilm, or another vendor;
- preserve every experimental candidate in the shipped product.

A separate implementation or publication authorization is required before the accepted preset reaches `main`.

## Completion report

The final report should be compact. It should state:

```text
references used
rounds completed
owner-selected candidate
final canonical parameter location
final exact branch and commit
known approximation notes
```

The task is complete when the final values are committed and remotely readable from the stated exact Git identity.

## Decision

```text
ADOPT owner-guided iterative tuning
ADOPT public references as a starting point only
ADOPT owner-provided images as higher-value preference evidence
ADOPT browser comparison and lightweight image analysis when useful
ALLOW multiple conversational tuning rounds without a fixed count
REQUIRE only the final accepted parameters to be written to GitHub
DEFER product merge and publication to a separate authorization
```

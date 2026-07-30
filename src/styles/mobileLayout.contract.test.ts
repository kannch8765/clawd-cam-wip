import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');

describe('mobile camera layout contract', () => {
  it('keeps the shutter reachable over the visible stage and applies safe area once', () => {
    expect(css).toMatch(
      /\.camera-copy \.shutter-action\s*\{[\s\S]*position: sticky/,
    );
    expect(css).toMatch(
      /\.camera-copy \.shutter-action\s*\{[\s\S]*bottom: max\(0\.5rem, env\(safe-area-inset-bottom\)\)/,
    );
    expect(css).not.toMatch(
      /\.camera-copy \.shutter-action\s*\{[\s\S]*padding-bottom:[^;]*safe-area-inset-bottom/,
    );
  });

  it('routes wide phone landscape through a coarse-pointer low-height layout', () => {
    expect(css).toMatch(/\.camera-stage\s*\{[\s\S]*aspect-ratio: 3 \/ 4/);
    expect(css).toMatch(
      /@media \(orientation: landscape\) and \(max-height: 720px\) and \(pointer: coarse\)[\s\S]*aspect-ratio: 4 \/ 3/,
    );
    expect(css).not.toMatch(
      /@media \(max-width: 720px\) and \(orientation: landscape\)/,
    );
    expect(css).toMatch(
      /@media \(min-width: 721px\)[\s\S]*grid-template-columns: minmax\(0, 1\.35fr\)/,
    );
  });
});

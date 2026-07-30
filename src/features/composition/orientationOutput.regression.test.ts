import { describe, expect, it } from 'vitest';
import { calculateOutputSize } from './captureGeometry';

describe('capture output follows current stage orientation', () => {
  it('produces landscape pixels from landscape geometry', () => {
    const output = calculateOutputSize({
      visibleSourceWidth: 844,
      visibleSourceHeight: 633,
    });
    expect(output.width).toBeGreaterThan(output.height);
  });

  it('returns to portrait pixels after portrait geometry is restored', () => {
    const output = calculateOutputSize({
      visibleSourceWidth: 390,
      visibleSourceHeight: 520,
    });
    expect(output.height).toBeGreaterThan(output.width);
  });
});

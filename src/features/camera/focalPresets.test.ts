import {
  createCameraFraming,
  DEFAULT_FOCAL_PRESET_ID,
  FOCAL_PRESET_IDS,
  FOCAL_PRESETS,
  getFocalPreset,
} from './focalPresets';

describe('digital focal preset model', () => {
  it('keeps the declared IDs and default stable', () => {
    expect(FOCAL_PRESET_IDS).toEqual(['24', '35', '50', '77', '120']);
    expect(FOCAL_PRESETS.map((preset) => preset.id)).toEqual([
      '24',
      '35',
      '50',
      '77',
      '120',
    ]);
    expect(DEFAULT_FOCAL_PRESET_ID).toBe('24');
  });

  it('uses the single 24-equivalent ratio mapping', () => {
    expect(getFocalPreset('24').zoomRatio).toBe(1);
    expect(getFocalPreset('35').zoomRatio).toBe(35 / 24);
    expect(getFocalPreset('50').zoomRatio).toBe(50 / 24);
    expect(getFocalPreset('77').zoomRatio).toBe(77 / 24);
    expect(getFocalPreset('120').zoomRatio).toBe(5);
  });

  it('creates finite positive centered camera framing independently', () => {
    for (const preset of FOCAL_PRESETS) {
      const framing = createCameraFraming(preset.id);
      expect(Number.isFinite(framing.zoomRatio)).toBe(true);
      expect(framing.zoomRatio).toBeGreaterThan(0);
      expect(framing).toEqual({
        presetId: preset.id,
        zoomRatio: preset.zoomRatio,
        centerX: 0.5,
        centerY: 0.5,
      });
    }
  });
});

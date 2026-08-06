export const FOCAL_PRESET_IDS = ['24', '35', '50', '77', '120'] as const;

export type FocalPresetId = (typeof FOCAL_PRESET_IDS)[number];

export interface FocalPreset {
  id: FocalPresetId;
  label: string;
  equivalent: number;
  zoomRatio: number;
}

export interface CameraFraming {
  presetId: FocalPresetId;
  zoomRatio: number;
  centerX: number;
  centerY: number;
}

export const FOCAL_PRESETS = [
  { id: '24', label: '24 eq.', equivalent: 24, zoomRatio: 1 },
  { id: '35', label: '35 eq.', equivalent: 35, zoomRatio: 35 / 24 },
  { id: '50', label: '50 eq.', equivalent: 50, zoomRatio: 50 / 24 },
  { id: '77', label: '77 eq.', equivalent: 77, zoomRatio: 77 / 24 },
  { id: '120', label: '120 eq.', equivalent: 120, zoomRatio: 120 / 24 },
] as const satisfies readonly FocalPreset[];

export const DEFAULT_FOCAL_PRESET_ID: FocalPresetId = '24';

const FOCAL_PRESET_BY_ID: Readonly<Record<FocalPresetId, FocalPreset>> = {
  '24': FOCAL_PRESETS[0],
  '35': FOCAL_PRESETS[1],
  '50': FOCAL_PRESETS[2],
  '77': FOCAL_PRESETS[3],
  '120': FOCAL_PRESETS[4],
};

export function getFocalPreset(id: FocalPresetId): FocalPreset {
  return FOCAL_PRESET_BY_ID[id];
}

export function createCameraFraming(presetId: FocalPresetId): CameraFraming {
  return {
    presetId,
    zoomRatio: getFocalPreset(presetId).zoomRatio,
    centerX: 0.5,
    centerY: 0.5,
  };
}

export const DEFAULT_CAMERA_FRAMING: Readonly<CameraFraming> =
  createCameraFraming(DEFAULT_FOCAL_PRESET_ID);

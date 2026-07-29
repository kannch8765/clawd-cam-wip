import type { PhotoFileFactory } from './photoFile';

export interface SharingAdapter extends PhotoFileFactory {
  hasShare(): boolean;
  hasCanShare(): boolean;
  canShareFile(file: File): boolean;
  shareFile(file: File): Promise<void>;
  downloadBlob(blob: Blob, filename: string): void;
}

function getShareFunction(): Navigator['share'] | null {
  return typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
    ? navigator.share.bind(navigator)
    : null;
}

function getCanShareFunction(): Navigator['canShare'] | null {
  return typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function'
    ? navigator.canShare.bind(navigator)
    : null;
}

export const browserSharingAdapter: SharingAdapter = {
  supportsFile() {
    return typeof File === 'function';
  },

  createFile(blob, filename, options) {
    return new File([blob], filename, options);
  },

  hasShare() {
    return getShareFunction() !== null;
  },

  hasCanShare() {
    return getCanShareFunction() !== null;
  },

  canShareFile(file) {
    const canShare = getCanShareFunction();
    return canShare ? canShare({ files: [file] }) : false;
  },

  async shareFile(file) {
    const share = getShareFunction();
    if (!share) {
      throw new DOMException('Web Share is unavailable.', 'NotSupportedError');
    }

    await share({
      files: [file],
      title: 'ClawdCam photo',
      text: 'A ClawdCam photo',
    });
  },

  downloadBlob(blob, filename) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    try {
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.hidden = true;
      document.body.append(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }
  },
};

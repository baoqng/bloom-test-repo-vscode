// bloom-deps: @tauri-apps/api@^1

import { shell } from '@tauri-apps/api';

export async function openExternalUrl(url: string): Promise<void> {
  if (typeof url !== 'string' || url.length === 0) {
    throw new TypeError('url must be a non-empty string');
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new TypeError('url must start with http:// or https://');
  }

  await shell.open(url);
}
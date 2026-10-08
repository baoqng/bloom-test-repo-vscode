// bloom-deps: @capacitor/core@^5

import { Capacitor } from '@capacitor/core';

export function getPlatformInfo(): { platform: string; isNative: boolean } {
  if (typeof Capacitor.getPlatform !== 'function') {
    throw new TypeError('Capacitor.getPlatform is not a function');
  }

  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  return { platform, isNative };
}
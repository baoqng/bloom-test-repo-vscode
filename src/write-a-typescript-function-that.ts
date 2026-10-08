// bloom-deps: @capacitor/core@^5

import { Device } from "@capacitor/core";

async function getDeviceInfo(): Promise<{ platform: string; model: string }> {
  const info = await Device.getInfo();
  return { platform: info.platform, model: info.model };
}

export { getDeviceInfo };
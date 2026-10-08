// bloom-deps: node-hid@^3

import HID from 'node-hid';

export function listGamepads(): Array<{ vendor: number; product: number; path: string }> {
  try {
    const devices = HID.devices();
    return devices
      .filter(device => device.usagePage === 1 && device.usage === 5)
      .map(device => ({
        vendor: (device as any).vendor ?? (device as any).vendorId,
        product: (device as any).product ?? (device as any).productId,
        path: device.path ?? '',
      }));
  } catch {
    return [];
  }
}
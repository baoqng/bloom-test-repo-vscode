// bloom-deps:

async function getDeviceInfo(): Promise<string> {
  return Promise.resolve(process.platform);
}

export { getDeviceInfo };
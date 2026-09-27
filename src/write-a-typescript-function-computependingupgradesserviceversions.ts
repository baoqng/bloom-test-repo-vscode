// bloom-deps:

interface PendingUpgrade {
  service: string;
  label: string;
  current: string;
  required: string;
  hint: string;
}

interface ServiceRequirement {
  service: string;
  label: string;
  minSession: number;
}

const SERVICE_REQUIREMENTS: ServiceRequirement[] = [
  { service: 'auth', label: 'services/auth', minSession: 313 },
  { service: 'dim3', label: 'services/dim3', minSession: 310 },
  { service: 'generation', label: '@bloom/generation', minSession: 304 },
];

export function computePendingUpgrades(
  serviceVersions: Record<string, string> | undefined
): PendingUpgrade[] {
  if (serviceVersions === undefined) {
    return [];
  }

  const result: PendingUpgrade[] = [];

  for (const req of SERVICE_REQUIREMENTS) {
    if (!(req.service in serviceVersions)) {
      continue;
    }

    const stamp = serviceVersions[req.service];
    const stripped = stamp.startsWith('S-') ? stamp.slice(2) : stamp;
    const parsed = parseInt(stripped, 10);

    if (isNaN(parsed) || parsed < req.minSession) {
      result.push({
        service: req.service,
        label: req.label,
        current: stamp,
        required: `S-${req.minSession}`,
        hint: 'setup-bloom.ps1 UPGRADE',
      });
    }
  }

  return result;
}
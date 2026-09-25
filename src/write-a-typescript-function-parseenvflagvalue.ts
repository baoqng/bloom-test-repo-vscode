// bloom-deps:

export function parseEnvFlag(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value === '') {
        return defaultValue;
    }

    const normalized = value.toLowerCase();

    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
        return true;
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
        return false;
    }

    throw new TypeError(`Unrecognized boolean flag value: ${value}`);
}
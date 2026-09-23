// bloom-deps:

export function splitIntoChunks<T>(array: T[], chunkSize: number): T[][] {
    if (chunkSize < 1) {
        throw new Error('Invalid chunk size');
    }
    if (array.length === 0) {
        return [];
    }
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}
// bloom-deps:

export function buildLearningMessage(count: number): string {
	if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
		throw new TypeError(`count must be a non-negative integer, got ${typeof count === 'number' ? count : typeof count}`);
	}

	const patternWord = count === 1 ? 'pattern' : 'patterns';
	const learnedWord = count === 1 ? 'learned' : 'learned';

	return `${count} new ${patternWord} ${learnedWord} from your team\u2019s codebase`;
}
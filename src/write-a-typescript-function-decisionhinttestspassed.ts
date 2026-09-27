// bloom-deps:

export function decisionHint(testsPassed: number, testsGenerated: number): string {
	if (typeof testsPassed !== 'number' || typeof testsGenerated !== 'number') {
		throw new TypeError('testsPassed and testsGenerated must be numbers');
	}

	if (!Number.isInteger(testsPassed) || !Number.isInteger(testsGenerated)) {
		throw new TypeError('testsPassed and testsGenerated must be integers');
	}

	if (testsPassed < 0 || testsGenerated < 0) {
		throw new TypeError('testsPassed and testsGenerated must be non-negative');
	}

	if (testsPassed > testsGenerated) {
		throw new Error('testsPassed cannot exceed testsGenerated');
	}

	const failedTests = testsGenerated - testsPassed;

	if (failedTests === 0) {
		return 'Approving opens a pull request. Regenerate discards this attempt and rebuilds.';
	}

	const testWord = failedTests === 1 ? 'test' : 'tests';
	return `${failedTests} ${testWord} didn\u2019t pass \u2014 BLOOM repaired them. Review the changed tests before approving.`;
}
// bloom-deps:

export function decisionHint(testsPassed: number, testsGenerated: number): string {
	// Input validation: throw TypeError for invalid numeric input
	if (typeof testsPassed !== 'number' || !Number.isInteger(testsPassed) || testsPassed < 0) {
		throw new TypeError(`testsPassed must be a non-negative integer, got ${typeof testsPassed}`);
	}
	if (typeof testsGenerated !== 'number' || !Number.isInteger(testsGenerated) || testsGenerated < 0) {
		throw new TypeError(`testsGenerated must be a non-negative integer, got ${typeof testsGenerated}`);
	}

	const failedTests = testsGenerated - testsPassed;

	// All tests passed
	if (failedTests === 0) {
		return 'Approving opens a pull request. Regenerate discards this attempt and rebuilds.';
	}

	// One or more tests failed
	const testWord = failedTests === 1 ? 'test' : 'tests';
	return `${failedTests} ${testWord} didn\u2019t pass \u2014 BLOOM repaired them. Review the changed tests before approving.`;
}
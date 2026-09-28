// bloom-deps:

export function isRetryableFailure(failureReason: string): boolean {
	if (typeof failureReason !== 'string') {
		throw new TypeError('failureReason must be a string');
	}

	const retryableCodes = new Set([
		'ai_api_failure',
		'flaky_test',
		'sandbox_environment_broken',
		'schema_timeout',
		'urdf_timeout',
	]);

	const permanentCodes = new Set([
		'repair_verification_failed',
		'cerberus_zero_tests',
		'cerberus_invalid_test',
		'cost_cap_exceeded',
		'INFRASTRUCTURE_CHANGE',
		'secret_detected',
		'safety_flagged',
		'insufficient_credits',
		'missing_dependency',
	]);

	if (retryableCodes.has(failureReason)) {
		return true;
	}

	if (permanentCodes.has(failureReason)) {
		return false;
	}

	return false;
}
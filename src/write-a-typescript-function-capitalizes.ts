// bloom-deps:
function capitalize(s: string): string {
	if (s.length === 0) {
		return '';
	}
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export { capitalize };
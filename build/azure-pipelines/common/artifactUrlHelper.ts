// bloom-deps:

import { checkForArtifact } from './checkForArtifact';

export async function getArtifactDownloadUrl(buildId: number, artifactName: string): Promise<string | undefined> {
	const artifact = await checkForArtifact(buildId, artifactName);
	
	if (!artifact) {
		return undefined;
	}
	
	return artifact.resource.downloadUrl;
}
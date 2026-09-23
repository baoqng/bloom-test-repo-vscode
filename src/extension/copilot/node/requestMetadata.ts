// bloom-deps:

export abstract class PromptMetadata {
	readonly _marker: undefined;
	toString(): string {
		return Object.getPrototypeOf(this).constructor.name;
	}
}

export class CopilotRequestMetadata extends PromptMetadata {
	constructor(
		public readonly sessionId: string,
		public readonly requestId: string
	) {
		super();
	}

	toJSON(): Record<string, string> {
		return { sessionId: this.sessionId, requestId: this.requestId };
	}
}
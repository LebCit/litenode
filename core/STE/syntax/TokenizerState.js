export class TokenizerState {
	constructor(source) {
		this.source = source
		this.tokens = []
		this.start = 0
		this.current = 0
		this.position = 0
		this.isInExpression = false
		this.braceCount = 0
	}
}

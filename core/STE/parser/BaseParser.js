import { TokenType } from "../syntax/TokenTypes.js"

export class BaseParser {
	constructor(state) {
		this.state = state // Shared state object
	}

	match(...types) {
		for (const type of types) {
			if (this.check(type)) {
				this.advance()
				return true
			}
		}
		return false
	}

	check(type) {
		if (this.isAtEnd()) return false
		return this.peek().type === type
	}

	advance() {
		if (!this.isAtEnd()) this.state.current++
		return this.previous()
	}

	isAtEnd() {
		return this.peek().type === TokenType.EOF
	}

	peek() {
		return this.state.tokens[this.state.current]
	}

	previous() {
		return this.state.tokens[this.state.current - 1]
	}

	consume(type, message) {
		if (this.check(type)) return this.advance()
		throw new Error(`${message} at position ${this.peek().position}`)
	}
}

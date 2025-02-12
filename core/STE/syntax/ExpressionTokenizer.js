import { TokenType } from "./TokenTypes.js"
import { BaseTokenizer } from "./BaseTokenizer.js"

export class ExpressionTokenizer extends BaseTokenizer {
	constructor(state) {
		super(state) // Shared state
	}

	string(quote) {
		while (this.peek() !== quote && !this.isAtEnd()) {
			this.advance()
		}

		if (this.isAtEnd()) {
			throw new Error(`Unterminated string at position ${this.state.position}`)
		}

		// Consume the closing quote
		this.advance()

		// Get the string value without quotes
		const value = this.state.source.substring(this.state.start + 1, this.state.current - 1)
		this.addToken(TokenType.STRING, value)
	}

	identifier() {
		while (this.isAlphaNumeric(this.peek())) this.advance()

		const text = this.state.source.substring(this.state.start, this.state.current)
		let type = TokenType.IDENTIFIER

		switch (text) {
			case "true":
				type = TokenType.TRUE
				break
			case "false":
				type = TokenType.FALSE
				break
			case "this":
				type = TokenType.THIS
				break
		}

		this.addToken(type)
	}

	number() {
		while (this.isDigit(this.peek())) this.advance()

		if (this.peek() === "." && this.isDigit(this.peekNext())) {
			this.advance()
			while (this.isDigit(this.peek())) this.advance()
		}

		this.addToken(TokenType.NUMBER, Number(this.state.source.substring(this.state.start, this.state.current)))
	}
}

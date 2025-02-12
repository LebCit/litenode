import { Token } from "./Token.js";

export class BaseTokenizer {
	constructor(state) {
		this.state = state // Shared state object
	}

	isAtEnd() {
		return this.state.current >= this.state.source.length
	}

	advance() {
		this.state.position++
		return this.state.source.charAt(this.state.current++)
	}

	match(expected) {
		if (this.isAtEnd()) return false
		if (this.state.source.charAt(this.state.current) !== expected) return false

		this.state.current++
		this.state.position++
		return true
	}

	peek() {
		// If we're at the end, return null character indicating that there is no more data to process
		if (this.isAtEnd()) return "\0"
		// Otherwise, return the character at the current position
		return this.state.source.charAt(this.state.current)
	}

	peekNext() {
		if (this.state.current + 1 >= this.state.source.length) return "\0" // If no next character, return null character
		return this.state.source.charAt(this.state.current + 1) // Otherwise, return the next character
	}

	isDigit(c) {
		return c >= "0" && c <= "9"
	}

	isAlpha(c) {
		return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_"
	}

	isAlphaNumeric(c) {
		return this.isAlpha(c) || this.isDigit(c)
	}

	addToken(type, literal = null) {
		const text = this.state.source.substring(this.state.start, this.state.current)
		this.state.tokens.push(new Token(type, text, literal, this.state.position - text.length))
	}
}

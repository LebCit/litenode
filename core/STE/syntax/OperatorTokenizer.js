import { TokenType } from "./TokenTypes.js"
import { BaseTokenizer } from "./BaseTokenizer.js"

export class OperatorTokenizer extends BaseTokenizer {
	constructor(state) {
		super(state) // Shared state
	}

	handleAndOperator() {
		if (this.match("&")) {
			this.addToken(TokenType.AND)
		}
	}

	handleOrOperator() {
		if (this.match("|")) {
			this.addToken(TokenType.OR)
		} else {
			this.addToken(TokenType.PIPE_FILTER)
		}
	}

	handleEqualityOperator() {
		if (this.match("=")) {
			if (this.match("=")) {
				this.addToken(TokenType.STRICT_EQUAL)
			} else {
				this.addToken(TokenType.EQUAL)
			}
		} else {
			this.addToken(TokenType.EQUAL) // Single equals
		}
	}

	handleNotOperator() {
		if (this.match("=")) {
			if (this.match("=")) {
				this.addToken(TokenType.STRICT_NOT_EQUAL)
			} else {
				this.addToken(TokenType.NOT_EQUAL)
			}
		} else {
			this.addToken(TokenType.NOT)
		}
	}

	handleGreaterThan() {
		if (this.match("=")) {
			this.addToken(TokenType.GREATER_EQUAL)
		} else {
			this.addToken(TokenType.GREATER)
		}
	}

	handleLessThan() {
		if (this.match("=")) {
			this.addToken(TokenType.LESS_EQUAL)
		} else {
			this.addToken(TokenType.LESS)
		}
	}
}

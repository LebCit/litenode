import { TokenType } from "./TokenTypes.js"
import { BaseTokenizer } from "./BaseTokenizer.js"

export class TagTokenizer extends BaseTokenizer {
	constructor(state) {
		super(state) // Shared state
	}

	handleTag() {
		let tag = ""
		// Read the base tag name first
		while (this.isAlpha(this.peek()) || (tag.startsWith("html_") && this.isAlphaNumeric(this.peek()))) {
			tag += this.advance()
		}

		// For 'each', also read any following digits
		if (tag === "each") {
			let digits = ""
			while (this.isDigit(this.peek())) {
				digits += this.advance()
			}
			tag += digits // Append any digits to the tag
		}

		// Handle different tag types
		if (tag === "set") {
			this.addToken(TokenType.TAG_SET)
		} else if (["if", "elseif", "else", "not"].includes(tag)) {
			this.addToken(TokenType.TAG_CONDITIONAL, tag)
		} else if (tag === "each" || tag.match(/^each\d+$/)) {
			this.addToken(TokenType.TAG_EACH, tag)
		} else if (tag === "include") {
			this.addToken(TokenType.TAG_INCLUDE)
		} else if (tag.startsWith("html_")) {
			this.addToken(TokenType.RAW_HTML, tag)
		} else {
			throw new Error(`Unexpected tag: #${tag} at position ${this.state.position}`)
		}
	}

	handleSlash() {
		if (this.isAlpha(this.peekNext())) {
			let tag = ""
			while (this.isAlpha(this.peek())) {
				tag += this.advance()
			}

			// For 'each', also read any following digits
			if (tag === "each") {
				while (this.isDigit(this.peek())) {
					tag += this.advance()
				}
			}

			if (tag === "each" || tag.match(/^each\d+$/) || tag === "if" || tag === "not") {
				if (tag === "each" || tag.match(/^each\d+$/)) {
					this.addToken(TokenType.TAG_EACH_CLOSE, tag)
				} else {
					this.addToken(TokenType.TAG_CONDITIONAL_CLOSE, tag)
				}
			} else {
				throw new Error(`Unexpected closing tag: /${tag} at position ${this.state.position}`)
			}
		} else {
			this.addToken(TokenType.DIVIDE)
		}
	}

	handleAtSymbol() {
		// Check if it's @index
		if (this.match("i") && this.match("n") && this.match("d") && this.match("e") && this.match("x")) {
			this.addToken(TokenType.AT_INDEX)
		} else {
			throw new Error(`Unexpected @ syntax at position ${this.state.position}`)
		}
	}
}

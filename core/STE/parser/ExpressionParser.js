import { TokenType } from "../syntax/TokenTypes.js"
import { BaseParser } from "./BaseParser.js"

export class ExpressionParser extends BaseParser {
	constructor(state) {
		super(state) // Shared state
	}

	parseExpression() {
		return this.ternary()
	}

	ternary() {
		let expr = this.logical()

		if (this.match(TokenType.QUESTION)) {
			const trueExpr = this.parseExpression()
			this.consume(TokenType.COLON, "Expect ':' after true branch in ternary operator.")

			// Recursively parse the false expression as potentially another ternary
			const falseExpr = this.ternary()

			expr = {
				type: "ternary",
				condition: expr,
				trueExpr,
				falseExpr,
			}
		}

		return expr
	}

	logical() {
		let expr = this.comparison()

		while (this.match(TokenType.AND, TokenType.OR)) {
			const operator = this.previous().type
			const right = this.comparison()
			expr = {
				type: "logical",
				operator,
				left: expr,
				right,
			}
		}

		return expr
	}

	comparison() {
		let expr = this.addition()

		while (
			this.match(
				TokenType.GREATER,
				TokenType.GREATER_EQUAL,
				TokenType.LESS,
				TokenType.LESS_EQUAL,
				TokenType.EQUAL,
				TokenType.NOT_EQUAL,
				TokenType.STRICT_EQUAL,
				TokenType.STRICT_NOT_EQUAL
			)
		) {
			const operator = this.previous().type
			const right = this.addition()
			expr = {
				type: "comparison",
				operator,
				left: expr,
				right,
			}
		}

		return expr
	}

	addition() {
		let expr = this.multiplication()

		while (this.match(TokenType.PLUS, TokenType.MINUS)) {
			const operator = this.previous().type
			const right = this.multiplication()
			expr = {
				type: "binary",
				operator,
				left: expr,
				right,
			}
		}

		return expr
	}

	multiplication() {
		let expr = this.unary()

		while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO, TokenType.POWER)) {
			const operator = this.previous().type
			const right = this.unary()
			expr = {
				type: "binary",
				operator,
				left: expr,
				right,
			}
		}

		return expr
	}

	unary() {
		if (this.match(TokenType.MINUS, TokenType.NOT)) {
			const operator = this.previous().type
			const right = this.unary()
			return {
				type: "unary",
				operator,
				right,
			}
		}

		return this.primary()
	}

	primary() {
		if (this.match(TokenType.STRING)) {
			const previousToken = this.previous()
			const value = previousToken.literal
			const lexeme = previousToken.lexeme
			const wasQuoted = lexeme.startsWith('"') || lexeme.startsWith("'")

			// Handle filters first if the next token is a pipe (|), allowing dots in the STRING before the pipe
			// Otherwise "example.com" will be treated as a variable in this: {{"example.com" | toLink("Link")}}
			if (this.match(TokenType.PIPE_FILTER)) {
				return this.parseFilter({ type: "literal", value })
			}

			// Handle quoted strings in specific contexts
			if (wasQuoted) {
				// Case 1: Quoted strings in set value context
				if (this.state.parsingSetValue) {
					return { type: "literal", value }
				}

				// Case 2: Quoted strings in object literal context
				if (this.state.isInObjectLiteral) {
					return { type: "literal", value }
				}

				// Case 3: Quoted strings with dots, treated as variable names (outside include context)
				if (!this.state.parsingInclude && value.includes(".")) {
					return { type: "variable", name: value }
				}
			}

			// Default case: Treat as a regular string literal
			return { type: "literal", value }
		}

		if (this.match(TokenType.NUMBER)) {
			return {
				type: "literal",
				value: this.previous().literal,
			}
		}

		if (this.match(TokenType.TRUE)) {
			return { type: "literal", value: true }
		}
		if (this.match(TokenType.FALSE)) {
			return { type: "literal", value: false }
		}

		if (this.match(TokenType.LBRACKET)) {
			return this.array()
		}

		if (this.match(TokenType.LBRACE)) {
			return this.object()
		}

		if (this.match(TokenType.LPAREN)) {
			const expr = this.parseExpression()
			this.consume(TokenType.RPAREN, "Expect ')' after expression.")
			return {
				type: "grouping",
				expression: expr,
			}
		}

		// Handle RAW_HTML tokens (terminal values)
		if (this.match(TokenType.RAW_HTML)) {
			return {
				type: "raw_html",
				name: this.previous().lexeme,
			}
		}

		// Handle regular IDENTIFIER tokens
		if (this.match(TokenType.IDENTIFIER)) {
			let expr = {
				type: "variable",
				name: this.previous().lexeme,
			}

			while (this.match(TokenType.DOT, TokenType.LBRACKET)) {
				const access = this.previous().type

				if (access === TokenType.DOT) {
					const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'").lexeme
					expr = {
						type: "property",
						object: expr,
						property: name,
					}
				} else {
					// Handle both numeric indices and string literals in brackets
					let index
					if (this.match(TokenType.STRING)) {
						// String literal access
						index = {
							type: "literal",
							value: this.previous().literal,
						}
					} else {
						// Regular numeric or expression access
						index = this.parseExpression()
					}

					this.consume(TokenType.RBRACKET, "Expect ']' after property access")
					expr = {
						type: "computed_property", // Node type for computed property access
						object: expr,
						property: index,
					}
				}
			}

			// Check for filter
			if (this.match(TokenType.PIPE_FILTER)) {
				return this.parseFilter(expr)
			}

			return expr
		}

		throw new Error(`Unexpected token: ${this.peek().lexeme} at position ${this.peek().position}`)
	}

	// Collections: array - object
	array() {
		const elements = []

		if (!this.check(TokenType.RBRACKET)) {
			do {
				elements.push(this.parseExpression())
			} while (this.match(TokenType.COMMA))
		}

		this.consume(TokenType.RBRACKET, "Expect ']' after array elements.")

		return {
			type: "array",
			elements,
		}
	}

	object() {
		const properties = new Map()
		this.state.isInObjectLiteral = true // Set flag when entering object

		if (!this.check(TokenType.RBRACE)) {
			do {
				// Parse key
				let key
				if (this.match(TokenType.STRING)) {
					key = this.previous().literal
				} else {
					key = this.consume(TokenType.IDENTIFIER, "Expect property name").lexeme
				}

				this.consume(TokenType.COLON, "Expect ':' after property name")
				const value = this.parseExpression()

				properties.set(key, value)
			} while (this.match(TokenType.COMMA))
		}

		this.state.isInObjectLiteral = false // Reset flag when exiting object
		this.consume(TokenType.RBRACE, "Expect '}' after object literal")

		return {
			type: "object",
			properties,
		}
	}

	// Filter
	parseFilter(expression) {
		// Get the filter name
		const filterName = this.consume(TokenType.IDENTIFIER, "Expect filter name after '|'").lexeme

		// Check for filter arguments
		let args = []
		if (this.match(TokenType.LPAREN)) {
			if (!this.check(TokenType.RPAREN)) {
				do {
					// If next token is a string, treat it as a literal
					if (this.check(TokenType.STRING)) {
						this.advance()
						args.push({
							type: "literal",
							value: this.previous().literal,
						})
					} else {
						args.push(this.parseExpression())
					}
				} while (this.match(TokenType.COMMA))
			}
			this.consume(TokenType.RPAREN, "Expect ')' after filter arguments")
		}

		// Create filter node
		let filterNode = {
			type: "filter",
			expression: expression,
			filter: filterName,
			arguments: args,
		}

		// Check for chained filters
		if (this.match(TokenType.PIPE_FILTER)) {
			return this.parseFilter(filterNode)
		}

		return filterNode
	}
}

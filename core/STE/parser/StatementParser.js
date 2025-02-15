import { TokenType } from "../syntax/TokenTypes.js"
import { BaseParser } from "./BaseParser.js"

export class StatementParser extends BaseParser {
	constructor(state, expressionParser) {
		super(state) // Shared state
		this.expressionParser = expressionParser // Store reference to the ExpressionParser as a dependency
	}

	parseSet() {
		const name = this.consume(TokenType.IDENTIFIER, "Expect variable name after #set").lexeme

		// Build chain of property accesses
		let chain = []

		while (this.match(TokenType.DOT, TokenType.LBRACKET)) {
			const accessType = this.previous().type

			if (accessType === TokenType.DOT) {
				// Handle dot notation (e.g., .country)
				const property = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'").lexeme
				chain.push({
					type: "property",
					property: {
						type: "literal",
						value: property,
					},
				})
			} else {
				// Handle bracket notation (e.g., ["country"])
				const property = this.expressionParser.parseExpression()
				this.consume(TokenType.RBRACKET, "Expect ']' after property access")
				chain.push({
					type: "computed_property",
					property,
				})
			}
		}

		this.consume(TokenType.EQUAL, "Expect '=' after variable name in set")

		this.state.parsingSetValue = true // Set flag when parsing set value
		let value = this.expressionParser.parseExpression()
		this.state.parsingSetValue = false // Reset flag after parsing set value

		if (this.match(TokenType.PIPE_FILTER)) {
			value = this.expressionParser.parseFilter(value)
		}

		this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after set expression")

		return {
			type: "set",
			name,
			propertyChain: chain.length > 0 ? chain : null,
			value,
		}
	}

	parseConditional() {
		const startConditionType = this.previous().literal

		if (!["if", "not"].includes(startConditionType)) {
			throw new Error(`Unexpected conditional type: ${startConditionType}. Expected 'if' or 'not'`)
		}

		let condition = this.expressionParser.parseExpression()

		// Check for filter after the condition expression
		if (this.match(TokenType.PIPE_FILTER)) {
			condition = this.expressionParser.parseFilter(condition)
		}

		this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after condition.")

		const body = this.parseConditionalBody()

		// For 'not' we don't process alternates
		if (startConditionType === "not") {
			// Match closing not tag
			this.match(TokenType.DOUBLE_BRACE_OPEN)
			if (this.peek().type === TokenType.TAG_CONDITIONAL_CLOSE && this.peek().literal === "not") {
				this.advance() // consume the TAG_CONDITIONAL_CLOSE
				this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after closing not tag")
				return {
					type: "conditional",
					conditionType: "not",
					condition,
					body,
				}
			}
			throw new Error("Expected closing not tag")
		}

		// Parse alternate branches (elseif/else)
		const alternates = []

		while (this.match(TokenType.DOUBLE_BRACE_OPEN)) {
			if (this.peek().type === TokenType.TAG_CONDITIONAL_CLOSE) {
				this.advance() // consume the TAG_CONDITIONAL_CLOSE
				this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after closing tag")
				break
			}

			if (this.match(TokenType.TAG_CONDITIONAL)) {
				const alternateType = this.previous().literal

				if (alternateType === "elseif") {
					const elseifCondition = this.expressionParser.parseExpression()
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after elseif condition.")
					const elseifBody = this.parseConditionalBody()

					alternates.push({
						type: "conditional",
						conditionType: "elseif",
						condition: elseifCondition,
						body: elseifBody,
					})
				} else if (alternateType === "else") {
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after else.")
					const elseBody = this.parseConditionalBody()

					alternates.push({
						type: "conditional",
						conditionType: "else",
						body: elseBody,
					})

					// After else, expect the closing if
					this.match(TokenType.DOUBLE_BRACE_OPEN)
					if (this.peek().type === TokenType.TAG_CONDITIONAL_CLOSE) {
						this.advance() // consume the TAG_CONDITIONAL_CLOSE
						this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after closing tag")
						break
					}
					throw new Error("Expected closing tag after else block")
				}
			}
		}

		return {
			type: "conditional",
			conditionType: "if",
			condition,
			body,
			alternates,
		}
	}

	parseConditionalBody() {
		const body = []

		while (!this.checkConditionalEnd()) {
			if (this.isAtEnd()) {
				throw new Error("Unterminated conditional statement")
			}

			if (this.match(TokenType.STRING)) {
				body.push({
					type: "literal",
					value: this.previous().literal,
				})
			} else if (this.match(TokenType.DOUBLE_BRACE_OPEN)) {
				if (this.match(TokenType.TAG_EACH)) {
					body.push(this.parseEach())
				} else if (this.match(TokenType.TAG_SET)) {
					body.push(this.parseSet())
				} else if (this.match(TokenType.TAG_INCLUDE)) {
					body.push(this.parseInclude())
				} else if (this.match(TokenType.RAW_HTML)) {
					body.push({
						type: "raw_html",
						name: this.previous().literal.replace("#", ""), // Remove the # prefix
					})
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after html variable")
				} else if (
					this.check(TokenType.TAG_CONDITIONAL) &&
					!["elseif", "else", "/if"].includes(this.peek().literal)
				) {
					this.advance()
					body.push(this.parseConditional())
				} else {
					const expr = this.expressionParser.parseExpression()
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after expression.")
					body.push({ type: "expression", expression: expr })
				}
			}
		}
		return body
	}

	checkConditionalEnd() {
		if (!this.check(TokenType.DOUBLE_BRACE_OPEN)) return false

		const nextToken = this.state.tokens[this.state.current + 1]
		return (
			nextToken &&
			(nextToken.type === TokenType.TAG_CONDITIONAL_CLOSE ||
				(nextToken.type === TokenType.TAG_CONDITIONAL && ["elseif", "else"].includes(nextToken.literal)))
		)
	}

	parseEach() {
		const eachType = this.previous().literal // Will be "each", "each1", or "each2"
		const iterableExpr = this.expressionParser.parseExpression()
		this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after each expression.")

		const body = this.parseEachBody(eachType)

		return {
			type: "each",
			eachType,
			iterable: iterableExpr,
			body,
		}
	}

	parseEachBody(eachType) {
		const body = []
		while (!this.checkEachEnd(eachType)) {
			if (this.isAtEnd()) {
				throw new Error(`Unterminated each loop. Expected {{/${eachType}}}`)
			}

			if (this.match(TokenType.STRING)) {
				body.push({
					type: "literal",
					value: this.previous().literal,
				})
			} else if (this.match(TokenType.DOUBLE_BRACE_OPEN)) {
				if (this.match(TokenType.AT_INDEX)) {
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after @index")
					body.push({
						type: "index_ref",
					})
				} else if (this.match(TokenType.AT_KEY)) {
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after @key")
					body.push({
						type: "key_ref",
					})
				} else if (this.match(TokenType.THIS)) {
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after this")
					body.push({
						type: "this_ref",
					})
				} else if (this.match(TokenType.TAG_EACH)) {
					body.push(this.parseEach())
				} else {
					const expr = this.expressionParser.parseExpression()
					this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after expression.")
					body.push({
						type: "expression",
						expression: expr,
					})
				}
			}
		}

		// Consume the closing each tag
		this.match(TokenType.DOUBLE_BRACE_OPEN)
		this.consume(TokenType.TAG_EACH_CLOSE, `Expect closing tag for ${eachType}`)
		this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after closing each tag")

		return body
	}

	checkEachEnd(eachType) {
		if (!this.check(TokenType.DOUBLE_BRACE_OPEN)) return false
		const nextToken = this.state.tokens[this.state.current + 1]
		return nextToken && nextToken.type === TokenType.TAG_EACH_CLOSE && nextToken.literal === eachType
	}

	parseInclude() {
		this.consume(TokenType.LPAREN, "Expect '(' after #include")

		this.state.parsingInclude = true // Set parsingInclude context flag
		const path = this.expressionParser.parseExpression()
		this.state.parsingInclude = false // Reset parsingInclude context flag

		this.consume(TokenType.RPAREN, "Expect ')' after include path")
		this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after include expression")

		return {
			type: "include",
			path: path,
		}
	}
}

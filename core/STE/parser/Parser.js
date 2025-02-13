import { TokenType } from "../syntax/TokenTypes.js"
import { BaseParser } from "./BaseParser.js"
import { ExpressionParser } from "./ExpressionParser.js"
import { StatementParser } from "./StatementParser.js"

class ParserState {
	constructor(tokens) {
		this.tokens = tokens
		this.current = 0
		this.parsingInclude = false
		this.parsingSetValue = false
		this.isInObjectLiteral = false
	}
}

export class Parser extends BaseParser {
	constructor(tokens) {
		// Initialize shared state
		const state = new ParserState(tokens)
		super(state) // Pass state to BaseParser

		// Inject the SAME state into child parsers
		this.expressionParser = new ExpressionParser(this.state)
		this.statementParser = new StatementParser(this.state, this.expressionParser)
	}

	parse() {
		const statements = []

		while (!this.isAtEnd()) {
			if (this.match(TokenType.STRING)) {
				statements.push({
					type: "literal",
					value: this.previous().literal,
				})
			} else if (this.match(TokenType.RAW_HTML)) {
				statements.push({
					type: "raw_html",
					name: this.previous().literal,
				})
			} else if (this.match(TokenType.DOUBLE_BRACE_OPEN)) {
				statements.push(this.parseStatement())
			} else {
				const unexpectedToken = this.peek()
				throw new Error(`Unexpected token: ${unexpectedToken.type} at position ${unexpectedToken.position}`)
			}
		}

		return { type: "template", body: statements }
	}

	parseStatement() {
		if (this.match(TokenType.TAG_SET)) {
			return this.statementParser.parseSet()
		} else if (this.match(TokenType.TAG_EACH)) {
			return this.statementParser.parseEach()
		} else if (this.match(TokenType.TAG_INCLUDE)) {
			return this.statementParser.parseInclude()
		} else if (this.match(TokenType.TAG_CONDITIONAL)) {
			return this.statementParser.parseConditional()
		} else if (this.peek().type === TokenType.TAG_CONDITIONAL_CLOSE) {
			this.advance() // Consume the TAG_CONDITIONAL_CLOSE
			this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after closing tag")
			return null // No statement to add for a closing tag
		} else {
			const expression = this.expressionParser.parseExpression()
			this.consume(TokenType.DOUBLE_BRACE_CLOSE, "Expect '}}' after expression.")
			return { type: "expression", expression }
		}
	}
}

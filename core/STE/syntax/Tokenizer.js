import { TokenType } from "./TokenTypes.js"
import { Token } from "./Token.js"
import { BaseTokenizer } from "./BaseTokenizer.js"
import { ExpressionTokenizer } from "./ExpressionTokenizer.js"
import { OperatorTokenizer } from "./OperatorTokenizer.js"
import { TagTokenizer } from "./TagTokenizer.js"
import { TokenizerState } from "./TokenizerState.js"

export class Tokenizer extends BaseTokenizer {
    constructor(source) {
        // Create shared state
        const state = new TokenizerState(source)
        super(state)

        this.expressionTokenizer = new ExpressionTokenizer(state)
        this.operatorTokenizer = new OperatorTokenizer(state)
        this.tagTokenizer = new TagTokenizer(state)
    }

    scanTokens() {
        while (!this.isAtEnd()) {
            this.state.start = this.state.current
            if (!this.state.isInExpression) {
                this.scanText()
            } else {
                this.scanToken()
            }
        }

        this.state.tokens.push(new Token(TokenType.EOF, "", null, this.state.position))
        return this.state.tokens
    }

    scanText() {
        // Accumulate text until we hit a potential expression start
        while (!this.isAtEnd()) {
            if (this.peek() === "{" && this.peekNext() === "{") {
                break
            }
            this.advance()
        }

        // If we accumulated any text, add it as a STRING token
        if (this.state.current > this.state.start) {
            const text = this.state.source.substring(this.state.start, this.state.current)
            this.addToken(TokenType.STRING, text)
        }

        // Reset start position before scanning any special tokens
        this.state.start = this.state.current

        // If we stopped at an expression, process it
        if (!this.isAtEnd()) {
            this.scanToken()
        }
    }

    scanToken() {
        const c = this.advance()

        switch (c) {
            case "{":
                this.handleOpeningBrace()
                break
            case "}":
                this.handleClosingBrace()
                break
            case "@":
                this.tagTokenizer.handleAtSymbol()
                break
            case "#":
                this.tagTokenizer.handleTag()
                break
            case "/":
                this.tagTokenizer.handleSlash()
                break
            case "(":
                this.addToken(TokenType.LPAREN)
                break
            case ")":
                this.addToken(TokenType.RPAREN)
                break
            case "[":
                this.addToken(TokenType.LBRACKET)
                break
            case "]":
                this.addToken(TokenType.RBRACKET)
                break
            case ".":
                this.addToken(TokenType.DOT)
                break
            case ",":
                this.addToken(TokenType.COMMA)
                break
            case "+":
                this.addToken(TokenType.PLUS)
                break
            case "-":
                this.addToken(TokenType.MINUS)
                break
            case "*":
                if (this.match("*")) {
                    this.addToken(TokenType.POWER)
                } else {
                    this.addToken(TokenType.MULTIPLY)
                }
                break
            case "%":
                this.addToken(TokenType.MODULO)
                break
            case "&":
                this.operatorTokenizer.handleAndOperator()
                break
            case "|":
                this.operatorTokenizer.handleOrOperator()
                break
            case "=":
                this.operatorTokenizer.handleEqualityOperator()
                break
            case "!":
                this.operatorTokenizer.handleNotOperator()
                break
            case ">":
                this.operatorTokenizer.handleGreaterThan()
                break
            case "<":
                this.operatorTokenizer.handleLessThan()
                break
            case '"':
            case "'":
            case "`":
                this.expressionTokenizer.string(c)
                break
            case " ":
            case "\r":
            case "\t":
            case "\n":
                break
            case "?":
                this.addToken(TokenType.QUESTION)
                break
            case ":":
                this.addToken(TokenType.COLON)
                break
            default:
                if (this.isDigit(c)) {
                    this.expressionTokenizer.number()
                } else if (this.isAlpha(c)) {
                    this.expressionTokenizer.identifier()
                } else {
                    throw new Error(`Unexpected character: ${c} at position ${this.state.position}`)
                }
                break
        }
    }

    handleOpeningBrace() {
        if (this.match("{")) {
            this.addToken(TokenType.DOUBLE_BRACE_OPEN)
            this.state.isInExpression = true
        } else if (this.state.isInExpression) {
            this.state.braceCount++
            this.addToken(TokenType.LBRACE)
        }
    }

    handleClosingBrace() {
        if (this.state.braceCount > 0) {
            this.state.braceCount--
            this.addToken(TokenType.RBRACE)
        } else if (this.match("}")) {
            this.addToken(TokenType.DOUBLE_BRACE_CLOSE)
            this.state.isInExpression = false
        }
    }
}

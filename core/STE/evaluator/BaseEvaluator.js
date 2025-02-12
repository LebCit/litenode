import { TokenType } from "../syntax/TokenTypes.js"

export class BaseEvaluator {
	constructor(state) {
		this.state = state
	}

	resolveVariable(name) {
		// First check if it's a dotted property name in currentContext
		if (this.state.currentContext && typeof this.state.currentContext === "object") {
			if (name in this.state.currentContext) return this.state.currentContext[name]
		}

		// Then check if it's a dotted property name in globalData
		if (name in this.state.globalData) return this.state.globalData[name]

		// If name has no dots, try regular property access
		if (!name.includes(".")) {
			const contextValue = this.state.currentContext?.[name]
			if (contextValue !== undefined) return contextValue

			const globalValue = this.state.globalData[name]
			if (globalValue !== undefined) return globalValue
		} else {
			// Handle dotted path resolution
			let parts = name.split(".")

			// Try currentContext first
			if (this.state.currentContext && typeof this.state.currentContext === "object") {
				let value = this.state.currentContext
				let found = true

				for (const part of parts) {
					if (value && typeof value === "object" && part in value) {
						value = value[part]
					} else {
						found = false
						break
					}
				}

				if (found) return value
			}

			// Then try globalData
			let value = this.state.globalData
			for (const part of parts) {
				if (value && typeof value === "object" && part in value) {
					value = value[part]
				} else {
					return undefined
				}
			}
			return value
		}

		return undefined
	}

	evaluateBinaryOp(operator, left, right) {
		switch (operator) {
			case TokenType.PLUS:
				return left + right
			case TokenType.MINUS:
				return left - right
			case TokenType.MULTIPLY:
				return left * right
			case TokenType.DIVIDE:
				return left / right
			case TokenType.MODULO:
				return left % right
			case TokenType.POWER:
				return Math.pow(left, right)
			default:
				throw new Error(`Unknown binary operator: ${operator}`)
		}
	}

	evaluateComparisonOp(operator, left, right) {
		switch (operator) {
			case TokenType.GREATER:
				return left > right
			case TokenType.GREATER_EQUAL:
				return left >= right
			case TokenType.LESS:
				return left < right
			case TokenType.LESS_EQUAL:
				return left <= right
			case TokenType.EQUAL:
				return left == right
			case TokenType.NOT_EQUAL:
				return left != right
			case TokenType.STRICT_EQUAL:
				return left === right
			case TokenType.STRICT_NOT_EQUAL:
				return left !== right
			default:
				throw new Error(`Unknown comparison operator: ${operator}`)
		}
	}
}

import { evaluateSimpleExpression } from "./evaluateSimpleExpression.js"
import { resolveValue } from "./resolveValue.js"

export const evaluateCondition = (condition, dataObject) => {
	try {
		// Check if the condition includes a logical operator
		const hasLogicalOperator = /==|!=|<=|>=|<|>/.test(condition)

		// If it includes a logical operator, evaluate it as a logical expression
		if (hasLogicalOperator) {
			return evaluateSimpleExpression(condition, dataObject)
		}

		// Otherwise, evaluate it as a simple condition
		const value = resolveValue(condition, dataObject)
		return Boolean(value)
	} catch (error) {
		console.error("Error evaluating condition:", error)
		return false
	}
}

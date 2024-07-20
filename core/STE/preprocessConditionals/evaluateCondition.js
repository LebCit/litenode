import { evaluateSimpleExpression } from "./evaluateSimpleExpression.js"

export const evaluateCondition = (condition, dataObject) => {
	try {
		// Evaluate the condition as a logical or simple expression
		return evaluateSimpleExpression(condition, dataObject)
	} catch (error) {
		console.error("Error evaluating condition:", error)
		return false
	}
}

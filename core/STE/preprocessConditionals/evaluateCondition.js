import { evaluateSimpleExpression } from "./evaluateSimpleExpression.js"

export const evaluateCondition = (condition, dataObject) => {
	try {
		return evaluateSimpleExpression(condition, dataObject)
	} catch (error) {
		console.error("Error evaluating condition:", error)
		return false
	}
}

import { evaluateComparison } from "./evaluateComparison.js"

export const evaluateSimpleExpression = (expression, dataObject) => {
	if (expression.includes("&&")) {
		return expression.split("&&").every((subExp) => evaluateSimpleExpression(subExp.trim(), dataObject))
	}
	if (expression.includes("||")) {
		return expression.split("||").some((subExp) => evaluateSimpleExpression(subExp.trim(), dataObject))
	}

	const comparisonMatch = expression.match(/(.+?)(==|!=|<=|>=|<|>)(.+)/)
	if (comparisonMatch) {
		const left = comparisonMatch[1].trim()
		const operator = comparisonMatch[2].trim()
		const right = comparisonMatch[3].trim()
		return evaluateComparison(left, operator, right, dataObject)
	}

	return !!dataObject[expression.trim()]
}

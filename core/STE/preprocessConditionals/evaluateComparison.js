import { resolveValue } from "./resolveValue.js"

export const evaluateComparison = (left, operator, right, dataObject) => {
	const leftValue = resolveValue(left, dataObject)
	const rightValue = resolveValue(right, dataObject)

	switch (operator) {
		case "==":
			return leftValue == rightValue
		case "!=":
			return leftValue != rightValue
		case "<":
			return leftValue < rightValue
		case ">":
			return leftValue > rightValue
		case "<=":
			return leftValue <= rightValue
		case ">=":
			return leftValue >= rightValue
		default:
			return false
	}
}

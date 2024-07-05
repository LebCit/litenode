import { evaluateCondition } from "./evaluateCondition.js"
import { processInnerContent } from "./processInnerContent.js"

export const processNotBlocks = (content, dataObject) => {
	const notRegex = /{{#not\s+(.+?)}}([\s\S]*?){{\/not}}/g

	return content.replace(notRegex, (match, condition, innerContent) => {
		const conditionKey = condition.trim()
		const conditionValue = evaluateCondition(conditionKey, dataObject)

		if (!conditionValue) {
			return processInnerContent(innerContent, dataObject)
		} else {
			return ""
		}
	})
}

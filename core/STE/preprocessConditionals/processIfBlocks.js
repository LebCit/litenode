import { evaluateCondition } from "./evaluateCondition.js"
import { processInnerContent } from "./processInnerContent.js"

export const processIfBlocks = (content, dataObject) => {
	const ifRegex = /{{#if\s+(.+?)}}([\s\S]*?){{\/if}}/g

	return content.replace(ifRegex, (match, condition, innerContent) => {
		const conditionKey = condition.trim()
		const conditionValue = evaluateCondition(conditionKey, dataObject)

		if (conditionValue) {
			const trueContent = innerContent.split(/{{#elseif.*}}|{{#else}}/)[0]
			return processInnerContent(trueContent, dataObject)
		} else {
			const parts = innerContent.split(/({{#elseif\s+.*?}}|{{#else}})/)
			let isElse = false

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i].trim()

				if (part.startsWith("{{#elseif")) {
					const elseifCondition = part.match(/{{#elseif\s+(.*?)}}/)[1].trim()
					const elseifConditionValue = evaluateCondition(elseifCondition, dataObject)

					if (elseifConditionValue) {
						return processInnerContent(parts[i + 1], dataObject)
					}
					i++
				} else if (part === "{{#else}}") {
					isElse = true
				} else if (isElse) {
					return processInnerContent(part, dataObject)
				}
			}
			return ""
		}
	})
}

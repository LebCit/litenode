let readFile, join

if (typeof require !== "undefined") {
	;({ readFile } = require("node:fs/promises"))
	;({ join } = require("node:path"))
} else {
	;(async () => {
		const fs = await import("node:fs/promises")
		const path = await import("node:path")
		readFile = fs.readFile
		join = path.join
	})()
}

class STE {
	#baseDir = process.cwd()
	constructor(baseDir) {
		this.#baseDir = baseDir
	}

	async render(filePath, dataObject) {
		try {
			if (!filePath.endsWith(".html")) {
				throw new Error(`File ${filePath} is not an HTML file`)
			}

			const resolvedFilePath = join(this.#baseDir, filePath)

			let data = await readFile(resolvedFilePath, { encoding: "utf8" })

			data = this.#preprocessConditionals(data, dataObject)

			for (const key in dataObject) {
				if (dataObject.hasOwnProperty(key)) {
					let value = dataObject[key]

					if (
						typeof value === "object" ||
						typeof value === "function" ||
						typeof value === "boolean" ||
						typeof value === "number"
					) {
						value = JSON.stringify(value)
					}

					if (key.startsWith("html_")) {
						data = data.replace(new RegExp(`{{${key}}}`, "g"), value)
					} else {
						const escapedValue = this.#escapeHtml(value)
						data = data.replace(new RegExp(`{{${key}}}`, "g"), escapedValue)
					}
				}
			}

			data = this.#handleIncludes(data, dataObject)

			return data
		} catch (err) {
			if (err.message.startsWith("File")) {
				throw err
			} else {
				throw new Error(`Error reading ${filePath}: ${err.message}`)
			}
		}
	}

	#preprocessConditionals(content, dataObject) {
		const evaluateCondition = (condition, dataObject) => {
			try {
				return evaluateSimpleExpression(condition, dataObject)
			} catch (error) {
				console.error("Error evaluating condition:", error)
				return false
			}
		}

		const evaluateSimpleExpression = (expression, dataObject) => {
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

		const evaluateComparison = (left, operator, right, dataObject) => {
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

		const resolveValue = (value, dataObject) => {
			if (isNaN(value)) {
				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					return value.slice(1, -1)
				}
				return dataObject[value.trim()]
			}
			return parseFloat(value)
		}

		const processInnerContent = (content, dataObject) => {
			return this.#preprocessConditionals(content, dataObject)
		}

		const ifRegex = /{{#if\s+(.+?)}}([\s\S]*?){{\/if}}/g

		content = content.replace(ifRegex, (match, condition, innerContent) => {
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

		const notRegex = /{{#not\s+(.+?)}}([\s\S]*?){{\/not}}/g

		content = content.replace(notRegex, (match, condition, innerContent) => {
			const conditionKey = condition.trim()
			const conditionValue = evaluateCondition(conditionKey, dataObject)

			if (!conditionValue) {
				return processInnerContent(innerContent, dataObject)
			} else {
				return ""
			}
		})

		const resolveDotNotation = (value, dataObject) => {
			return value
				.split(".")
				.reduce((obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined), dataObject)
		}

		const processEach = (content, dataObject, eachCounter = 0) => {
			const eachRegex = new RegExp(
				`{{#each${eachCounter ? eachCounter : ""}\\s+(.+?)}}([\\s\\S]*?){{\\/each${
					eachCounter ? eachCounter : ""
				}}}`,
				"g"
			)

			return content.replace(eachRegex, (match, arrayKey, innerContent) => {
				const arrayValue = resolveDotNotation(arrayKey.trim(), dataObject)

				if (Array.isArray(arrayValue)) {
					return arrayValue
						.map((item) => {
							let itemContent = innerContent

							if (typeof item === "object") {
								for (const key in item) {
									if (item.hasOwnProperty(key)) {
										const itemRegex = new RegExp(`{{${key}}}`, "g")
										itemContent = itemContent.replace(itemRegex, item[key])
									}
								}
							} else {
								itemContent = itemContent.replace(/{{this}}/g, item)
							}

							// Recursively process nested each blocks
							itemContent = processEach(itemContent, item, eachCounter + 1)

							return itemContent
						})
						.join("")
				} else {
					return ""
				}
			})
		}

		content = processEach(content, dataObject)

		return content
	}

	async #handleIncludes(content, dataObject) {
		const includeRegex = /{{include\(["'](.+?)["']\)}}/g
		let match
		while ((match = includeRegex.exec(content))) {
			const includeFilePath = match[1]
			try {
				const renderedIncludeData = await this.render(includeFilePath, dataObject)
				content = content.replace(match[0], renderedIncludeData)
			} catch (error) {
				throw new Error(`Error including ${includeFilePath}: ${error.message}`)
			}
		}
		return content
	}

	#escapeHtml(str) {
		const escapeMap = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		}

		return str.replace(/[&<>"']/g, (match) => escapeMap[match])
	}
}

module.exports = { STE }

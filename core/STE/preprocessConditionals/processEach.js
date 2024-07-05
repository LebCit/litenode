export const processEach = (content, dataObject, eachCounter = 0) => {
	const resolveDotNotation = (value, dataObject) => {
		return value
			.split(".")
			.reduce((obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined), dataObject)
	}

	const eachRegex = new RegExp(
		`{{#each${eachCounter ? eachCounter : ""}\\s+(.+?)}}([\\s\\S]*?){{\\/each${eachCounter ? eachCounter : ""}}}`,
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

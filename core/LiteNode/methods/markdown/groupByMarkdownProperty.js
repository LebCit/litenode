export async function groupByMarkdownProperty(dir, properties, groupByField, extractMarkdownProperties) {
	const extractedProperties = await extractMarkdownProperties(dir, properties)
	return extractedProperties.reduce((acc, item) => {
		const groupValue = item[groupByField] || "Undefined"
		if (!acc[groupValue]) {
			acc[groupValue] = []
		}
		acc[groupValue].push(item)
		return acc
	}, {})
}

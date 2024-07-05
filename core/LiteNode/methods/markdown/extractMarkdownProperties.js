export async function extractMarkdownProperties(input, properties, parseMarkdownFile, parseMarkdownFileS) {
	let parsedFiles

	if (Array.isArray(input)) {
		parsedFiles = input
	} else if (typeof input === "string") {
		if (input.endsWith(".md")) {
			const parsedFile = parseMarkdownFile(input)
			parsedFiles = [parsedFile]
		} else {
			parsedFiles = await parseMarkdownFileS(input)
		}
	} else {
		throw new Error("Invalid input type for extractMarkdownProperties. Must be an array or a string.")
	}

	return parsedFiles.map((obj) => {
		const { frontmatter } = obj

		if (!frontmatter) {
			return properties.reduce((acc, prop) => {
				acc[prop] = undefined
				return acc
			}, {})
		}

		return properties.reduce((acc, prop) => {
			const value = prop.split(".").reduce((nestedAcc, key) => nestedAcc?.[key], frontmatter)
			acc[prop] = value
			return acc
		}, {})
	})
}

export async function handleIncludes(content, dataObject, baseDir, renderFunction) {
	const includeRegex = /{{include\(["'](.+?)["']\)}}/g
	let match
	while ((match = includeRegex.exec(content))) {
		const includeFilePath = match[1]
		try {
			const renderedIncludeData = await renderFunction(includeFilePath, dataObject, baseDir)
			content = content.replace(match[0], renderedIncludeData)
		} catch (error) {
			throw new Error(`Error including ${includeFilePath}: ${error.message}`)
		}
	}
	return content
}

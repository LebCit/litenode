export function extractCodeBlocks(markdown) {
	const codeBlockRegex = /(```[\s\S]*?```)/g
	const codeBlocks = []

	const markdownWithoutCodeBlocks = markdown.replace(codeBlockRegex, (match) => {
		codeBlocks.push(match)
		return `{{CODE_BLOCK_${codeBlocks.length - 1}}}`
	})

	return { markdownWithoutCodeBlocks, codeBlocks }
}

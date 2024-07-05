export function reinsertCodeBlocks(markdown, codeBlocks) {
	return markdown.replace(/{{CODE_BLOCK_(\d+)}}/g, (match, index) => codeBlocks[index])
}

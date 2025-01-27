import { CODEBLOCK_PLACEHOLDER } from "./constants.js"

/**
 * A utility class to handle code block extraction and reinsertion in a content string.
 * This class provides methods to extract code blocks from the content, replace them with placeholders,
 * and later reinsert the original code blocks back into the content.
 */
export class CodeBlockProcessor {
	/**
	 * Extracts code blocks from the provided content and replaces them with placeholders.
	 * The extracted code blocks are returned separately so they can be reinserted later.
	 *
	 * @param {string} content - The content string containing code blocks to be extracted.
	 * @returns {Object} - An object containing:
	 *   - `processedContent`: The content with placeholders for code blocks.
	 *   - `codeBlocks`: An array of the extracted code blocks.
	 */
	static extract(content) {
		const codeBlocks = []
		// Regular expression to match code blocks (enclosed in triple backticks)
		const pattern = /(```[\s\S]*?```)/g

		// Replace code blocks with placeholders, saving the original code blocks
		const processedContent = content.replace(pattern, (match) => {
			codeBlocks.push(match)
			return `${CODEBLOCK_PLACEHOLDER}${codeBlocks.length - 1}`
		})

		return { processedContent, codeBlocks }
	}

	/**
	 * Reinserts the original code blocks back into the content, replacing the placeholders with the actual code blocks.
	 *
	 * @param {string} content - The content string with placeholders for code blocks.
	 * @param {Array<string>} codeBlocks - An array of the original code blocks to be reintegrated.
	 * @returns {string} - The content with the code blocks reinserted in place of the placeholders.
	 */
	static reinsert(content, codeBlocks) {
		// Replace placeholders with the corresponding code blocks from the provided array
		return content.replace(new RegExp(`${CODEBLOCK_PLACEHOLDER}(\\d+)`, "g"), (_, index) => codeBlocks[index])
	}
}

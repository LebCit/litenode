import { normalizeString } from "./utils/stringHelpers.js"

/**
 * A utility class to process headings in a content string. It provides methods to add unique IDs to headings
 * based on a specified syntax and to transform markdown-style headings into HTML.
 */
export class HeadingProcessor {
	/**
	 * Adds unique IDs to headings in the content based on the `{#id}` syntax.
	 * This method processes headings of level 1 to 6 (h1 to h6) and adds an `id` attribute to the corresponding
	 * HTML heading tags. The ID is normalized using the `normalizeString` utility function.
	 *
	 * @param {string} content - The content string containing the headings to process.
	 * @returns {string} - The content with IDs added to the headings.
	 */
	static addIds(content) {
		// Regular expression to match headings with the {#id} syntax (e.g., <h1>Heading</h1> {#heading-id})
		const headingPattern = /<(h[1-6])(.*?)>(.*?)\s*{\s*.*#\s*(.*?)\s*}\s*<\/\1>/gi

		// Replace matched headings with IDs added
		return content.replace(headingPattern, (match, tag, attrs, content, id) => {
			// Normalize the ID to ensure it's a valid and unique ID
			const normalizedId = normalizeString(id)
			// Return the updated heading with the normalized ID
			return `<${tag}${attrs} id="${normalizedId}">${content}</${tag}>`
		})
	}

	/**
	 * Transforms markdown-style headings into HTML heading tags.
	 * This method processes heading lines (e.g., `### Heading` or `## Heading`) and converts them into
	 * corresponding HTML heading tags (e.g., `<h3>Heading</h3>` or `<h2>Heading</h2>`).
	 *
	 * @param {string} content - The content string containing markdown-style headings.
	 * @returns {string} - The content with markdown-style headings transformed into HTML.
	 */
	static transformToHtml(content) {
		let result = content
		// Loop through heading levels 6 to 1 (h6 to h1)
		for (let level = 6; level >= 1; level--) {
			// Regular expression to match markdown-style headings (e.g., ### Heading)
			const pattern = new RegExp(`^${"#".repeat(level)} (.*$)`, "gim")
			// Replace markdown headings with HTML <hX> tags
			result = result.replace(pattern, `<h${level}>$1</h${level}>`)
		}
		return result
	}
}

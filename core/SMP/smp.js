import { MarkdownProcessor } from "./MarkdownProcessor.js"

/**
 * The `SMP` (Static Markdown Processor) class is a simplified interface for processing markdown files
 * using the `MarkdownProcessor`. It provides methods to process markdown files and extract frontmatter
 * information.
 */
export class SMP {
	/**
	 * Constructs a new instance of the `SMP` class.
	 *
	 * @param {string} [baseDir="views"] - The base directory where markdown files are stored.
	 */
	constructor(baseDir = "views") {
		// Initialize the MarkdownProcessor with the given base directory
		this.processor = new MarkdownProcessor(baseDir)
	}

	/**
	 * Parses the frontmatter from a given markdown file.
	 * This method uses the `MarkdownProcessor` to process the file and extract the frontmatter.
	 *
	 * @param {string} filePath - The relative path to the markdown file to process.
	 * @returns {object} - An object containing the frontmatter and processed content of the file.
	 * @throws {Error} - If the file is not found or processing fails.
	 */
	parseFrontmatter(filePath) {
		// Use the MarkdownProcessor to process the file and extract the frontmatter
		return this.processor.processFile(filePath)
	}
}

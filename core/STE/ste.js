import { Tokenizer } from "./syntax/Tokenizer.js"
import { Parser } from "./parser/Parser.js"
import { Evaluator } from "./evaluator/Evaluator.js"

export class STE {
	#baseDir
	#templateCache

	/**
	 * Creates a new instance of TemplateEngine
	 * @param {string} baseDir - The base directory where template files are located
	 * @param {Object} options - Configuration options
	 */
	constructor(baseDir) {
		this.#baseDir = baseDir
		this.#templateCache = new Map()
		this.htmlVars = new Map() // Add persistent storage for HTML variables
	}

	/**
	 * Renders a template from a file path
	 * @param {string} filePath - The path to the template file
	 * @param {Object} data - The data object containing values
	 * @returns {Promise<string>} The rendered template
	 */
	async render(filePath, data) {
		try {
			// Process the main template
			const processed = await this.renderStringWithoutRestore(filePath, data)

			// Restore HTML content only at the very end
			let result = processed
			for (const { marker, value } of this.htmlVars.values()) {
				result = result.replace(marker, value)
			}

			return result
		} catch (error) {
			throw new Error(`Template rendering failed for ${filePath}: ${error.message}`)
		}
	}

	/**
	 * Reads a template file from the base directory
	 * @private
	 */
	async #readFile(filePath) {
		if (!filePath.endsWith(".html")) {
			throw new Error("Invalid file type. Only HTML files are supported.")
		}

		try {
			const { readFile } = await import("node:fs/promises")
			const { join } = await import("node:path")
			const path = join(this.#baseDir, filePath)
			return await readFile(path, "utf8")
		} catch (error) {
			throw new Error(`File reading failed: ${error.message}`)
		}
	}

	// New method to render without restoring HTML content
	// In ste.js
	async renderStringWithoutRestore(filePath, data) {
		try {
			const content = await this.#readFile(filePath)
			console.log("Initial data:", data) // Add this log

			// Process any html_ variables in the data
			// Add null check {} to prevent error if no data object is initialized
			for (const [key, value] of Object.entries(data || {})) {
				if (key.startsWith("html_") && !this.htmlVars.has(key)) {
					const marker = `__HTML_${Math.random().toString(36).substring(2, 11)}__`
					this.htmlVars.set(key, { marker, value })
					data[key] = marker
				}
			}

			// Process template
			let processed = content
			processed = await this.#processExpressions(processed, data)
			return processed
		} catch (error) {
			throw new Error(`Template rendering failed for ${filePath}: ${error.message}`)
		}
	}

	/**
	 * Processes expressions using tokenizer/parser/evaluator
	 * @private
	 */
	async #processExpressions(content, data) {
		try {
			const tokenizer = new Tokenizer(content)
			const tokens = tokenizer.scanTokens()

			const parser = new Parser(tokens)
			const ast = parser.parse()

			const evaluator = new Evaluator(data, this) // 'this' → template engine reference

			const result = await evaluator.evaluate(ast)
			return result
		} catch (error) {
			throw new Error(`Expression processing failed: ${error.message}`)
		}
	}

	clearCache() {
		this.#templateCache.clear()
		this.htmlVars.clear() // Clear HTML variables cache too
	}

	removeFromCache(template) {
		this.#templateCache.delete(template)
	}
}

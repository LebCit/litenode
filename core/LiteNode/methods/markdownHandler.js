import { readdir, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { SMP } from "../../SMP/smp.js"

export class MarkdownHandler {
	#viewsDir

	constructor(viewsDir = "views") {
		this.#viewsDir = viewsDir
		// Initialize the custom markdown parser and pass viewsDir to SMP
		this.smp = new SMP(viewsDir)
	}

	/**
	 * Parses a single markdown file and extracts its frontmatter and content.
	 * @param {string} filePath - The path to the markdown file.
	 * @returns {Object} - An object containing the parsed frontmatter and content.
	 */
	parseMarkdownFile(filePath) {
		return this.smp.parseFrontmatter(filePath)
	}

	/**
	 * Parses all markdown files in a directory.
	 * @param {string} dir - The directory containing markdown files.
	 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of parsed markdown objects.
	 */
	async parseMarkdownFileS(dir) {
		const normalizedDir = dir.startsWith("/") ? dir.slice(1) : dir
		// Use the custom views directory instead of hardcoded "views"
		const files = await this.getMarkdownFiles(join(this.#viewsDir, normalizedDir))
		return Promise.all(
			files.map((file) => {
				// Use the custom views directory instead of hardcoded "views"
				const relativePath = relative(this.#viewsDir, file)
				return this.parseMarkdownFile(relativePath)
			})
		)
	}

	/**
	 * Recursively retrieves all markdown files in a directory.
	 * @param {string} dir - The directory to search for markdown files.
	 * @param {Array<string>} fileList - An array to accumulate file paths (used internally for recursion).
	 * @returns {Promise<Array<string>>} - A promise that resolves to an array of markdown file paths.
	 */
	async getMarkdownFiles(dir, fileList = []) {
		const files = await readdir(dir, { withFileTypes: true })
		await Promise.all(
			files.map(async (file) => {
				const filePath = join(dir, file.name)
				const stats = await stat(filePath)
				if (stats.isDirectory()) {
					await this.getMarkdownFiles(filePath, fileList)
				} else if (filePath.endsWith(".md")) {
					fileList.push(filePath)
				}
			})
		)
		return fileList
	}

	/**
	 * Extracts specified properties from markdown files.
	 * @param {string|Array} input - A file path, directory path, or array of parsed markdown objects.
	 * @param {Array<string>} properties - An array of property names to extract.
	 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects containing the extracted properties.
	 */
	async extractMarkdownProperties(input, properties) {
		let parsedFiles

		if (Array.isArray(input)) {
			parsedFiles = input
		} else if (typeof input === "string") {
			if (input.endsWith(".md")) {
				const parsedFile = this.parseMarkdownFile(input)
				parsedFiles = [parsedFile]
			} else {
				parsedFiles = await this.parseMarkdownFileS(input)
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

	/**
	 * Groups markdown files by a specified property.
	 * @param {string} dir - The directory containing markdown files.
	 * @param {Array<string>} properties - An array of property names to extract.
	 * @param {string} groupByField - The property to group the files by.
	 * @returns {Promise<Object>} - A promise that resolves to an object where keys are group values and values are arrays of objects.
	 */
	async groupByMarkdownProperty(dir, properties, groupByField) {
		const extractedProperties = await this.extractMarkdownProperties(dir, properties)
		return extractedProperties.reduce((acc, item) => {
			const groupValue = item[groupByField] || "Undefined"
			if (!acc[groupValue]) {
				acc[groupValue] = []
			}
			acc[groupValue].push(item)
			return acc
		}, {})
	}

	/**
	 * Paginates an array of items and returns a paginated result object with previous and next items.
	 * @param {Array<any>} items - The array of items to paginate.
	 * @param {number} current_page - The current page number (default is 1).
	 * @param {number} per_page_items - Number of items per page (default is 10).
	 * @returns {Object} - A paginated result object containing page information, previous and next items, and paginated data.
	 */
	#paginator(items, current_page = 1, per_page_items = 10) {
		let page = current_page,
			per_page = per_page_items,
			offset = (page - 1) * per_page,
			paginatedItems = items.slice(offset, offset + per_page), // Get items for the current page
			total_pages = Math.ceil(items.length / per_page), // Calculate total number of pages
			prev_item = offset > 0 ? items[offset - 1] : null, // Previous item or null if on the first page
			next_item = offset + per_page < items.length ? items[offset + per_page] : null // Next item or null if on the last page

		return {
			page: Number(page), // Current page number
			per_page: per_page, // Number of items per page
			prev_page: page > 1 ? Number(page) - 1 : null, // Previous page number or null if on the first page
			next_page: page < total_pages ? Number(page) + 1 : null, // Next page number or null if on the last page
			prev_item: prev_item, // Previous item in the array
			next_item: next_item, // Next item in the array
			total_items: items.length, // Total number of items
			total_pages: total_pages, // Total number of pages
			data: paginatedItems, // Items for the current page
		}
	}

	/**
	 * Paginates an array of markdown files or files from a directory.
	 * @param {string|Array} input - A file path, directory path, or array of parsed markdown objects.
	 * @param {number} page - The page number (1-based index).
	 * @param {number} perPage - The number of items per page.
	 * @returns {Promise<Object>} - A promise that resolves to an object containing paginated results and metadata.
	 */
	async paginateMarkdownFiles(input, page = 1, perPage = 10) {
		let parsedFiles

		if (Array.isArray(input)) {
			parsedFiles = input
		} else if (typeof input === "string") {
			parsedFiles = await this.parseMarkdownFileS(input)
		} else {
			throw new Error("Invalid input type for paginateMarkdownFiles. Must be an array or a string.")
		}

		return this.#paginator(parsedFiles, page, perPage)
	}
}

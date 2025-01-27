import { readdir, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { SMP } from "../../SMP/smp.js"
import { paginator } from "../../utils/paginator.js"

export class MarkdownHandler {
	constructor() {
		this.smp = new SMP() // Initialize the custom markdown parser
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
		const files = await this.getMarkdownFiles(join("views", normalizedDir))
		return Promise.all(
			files.map((file) => {
				const relativePath = relative("views", file)
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

		return paginator(parsedFiles, page, perPage)
	}
}

import { readdir, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { SMP } from "../../SMP/smp.js"
import { paginator } from "../../utils/paginator.js"

export class MarkdownHandler {
	constructor() {
		this.smp = new SMP() // Initialize the custom markdown parser
	}

	// Parse a single markdown file
	parseMarkdownFile(filePath) {
		return this.smp.parseFrontmatter(filePath)
	}

	// Parse all markdown files in a directory
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

	// Get all markdown files in a directory
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

	// Extract specific properties from markdown files
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

	// Group markdown files by a specific property
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

	// Paginate markdown files
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

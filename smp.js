let existsSync, readFileSync, path

if (typeof require !== "undefined") {
	;({ existsSync, readFileSync } = require("node:fs"))
	path = require("path")
} else {
	;(async () => {
		const fs = await import("node:fs")
		;({ existsSync, readFileSync } = fs)
		path = await import("node:path")
	})()
}

class SMP {
	constructor(baseDir = "views") {
		this.baseDir = baseDir
	}

	parseFrontmatter(filePath) {
		const normalizedFilePath = filePath.startsWith("/") ? filePath.slice(1) : filePath
		const fullPath = path.join(this.baseDir, normalizedFilePath)

		if (!existsSync(fullPath)) {
			throw new Error(`File not found: ${fullPath}`)
		}

		const fileContent = readFileSync(fullPath, "utf8")
		const lines = fileContent.split("\n")

		let frontmatter = {}
		let contentLines = []
		let inFrontmatter = false
		let frontmatterLines = []

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim()
			if (line === "---") {
				if (!inFrontmatter) {
					inFrontmatter = true
				} else {
					inFrontmatter = false
					continue
				}
			} else if (inFrontmatter) {
				frontmatterLines.push(line)
			} else {
				contentLines = lines.slice(i)
				break
			}
		}

		try {
			this.#validateFrontmatter(frontmatterLines)
			frontmatter = this.#parseFrontmatterLines(frontmatterLines)
		} catch (error) {
			throw new Error(`Error parsing frontmatter: ${error.message}`)
		}

		const markdownContent = contentLines.join("\n").trim()

		const { markdownWithoutCodeBlocks, codeBlocks } = this.#extractCodeBlocks(markdownContent)

		const transformedMarkdown = this.#transformHeadingsToHtml(markdownWithoutCodeBlocks)
		const markdownWithIDs = this.#addIdsToHeadings(transformedMarkdown)

		const finalContent = this.#reinsertCodeBlocks(markdownWithIDs, codeBlocks)

		return {
			frontmatter,
			content: finalContent,
			filePath: fullPath.split(path.sep).join("/"),
			fileDir: path.dirname(normalizedFilePath).split(path.sep).join("/"),
			fileName: path.basename(normalizedFilePath),
		}
	}

	#transformHeadingsToHtml(markdown) {
		for (let level = 6; level >= 1; level--) {
			const regex = new RegExp(`^${"#".repeat(level)} (.*$)`, "gim")
			const replacement = `<h${level}>$1</h${level}>`
			markdown = markdown.replace(regex, replacement)
		}

		return markdown
	}

	#addIdsToHeadings(str) {
		const regex = /<(h[1-6])(.*?)>(.*?)\s*{\s*.*#\s*(.*?)\s*}\s*<\/\1>/gi

		return str.replace(regex, (match, tag, attributes, content, id) => {
			let normalizedId = id
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase()
				.replace(/[^a-zA-Z0-9-_ ]/g, "")
				.replace(/_+/g, "-")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-+/, "")
				.replace(/-+$/, "")

			return `<${tag}${attributes} id="${normalizedId}">${content}</${tag}>`
		})
	}

	#extractCodeBlocks(markdown) {
		const codeBlockRegex = /(```[\s\S]*?```)/g
		const codeBlocks = []

		const markdownWithoutCodeBlocks = markdown.replace(codeBlockRegex, (match) => {
			codeBlocks.push(match)
			return `{{CODE_BLOCK_${codeBlocks.length - 1}}}`
		})

		return { markdownWithoutCodeBlocks, codeBlocks }
	}

	#reinsertCodeBlocks(markdown, codeBlocks) {
		return markdown.replace(/{{CODE_BLOCK_(\d+)}}/g, (match, index) => codeBlocks[index])
	}

	#parseFrontmatterLines(lines) {
		let result = {}
		let currentObject = result
		let stack = [result]

		lines.forEach((line) => {
			if (line.startsWith("#")) {
				return
			}

			if (line.includes(":")) {
				const [key, ...valueParts] = line.split(":")
				const value = valueParts.join(":").trim()
				if (value === "" || value.endsWith(":")) {
					const newObject = {}
					currentObject[key.trim()] = newObject
					stack.push(currentObject)
					currentObject = newObject
				} else {
					currentObject[key.trim()] = this.#parseValue(value)
				}
			} else if (line === "") {
				currentObject = stack.pop()
			}
		})

		return result
	}

	#parseValue(value) {
		if (/^['"].*['"]$/.test(value)) {
			return value.slice(1, -1)
		} else if (!isNaN(value)) {
			return parseFloat(value)
		} else if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
			return value.toLowerCase() === "true"
		} else if (/^\[.*\]$/.test(value)) {
			return value
				.slice(1, -1)
				.split(",")
				.map((item) => item.trim())
		} else {
			return value
		}
	}

	#validateFrontmatter(lines) {
		lines.forEach((line, index) => {
			if (!line.startsWith("#") && line.includes(":")) {
				const [key, ...valueParts] = line.split(":")
				const value = valueParts.join(":").trim()
				if (!key.trim()) {
					throw new Error(`Malformed frontmatter at line ${index + 1}: Missing key`)
				}
				if (value === "" || value.endsWith(":")) {
					return
				}

				if (key.trim().toLowerCase().endsWith("_date")) {
					const date = new Date(value)
					if (isNaN(date.getTime())) {
						throw new Error(`Malformed frontmatter at line ${index + 1}: Invalid date string`)
					}
				}

				if (/^['"].*['"]$/.test(value)) {
					if (!/^['"].*['"]$/.test(value)) {
						throw new Error(`Malformed frontmatter at line ${index + 1}: Invalid string format`)
					}
				} else if (!isNaN(value)) {
					if (!/^[-+]?[0-9]*\.?[0-9]+$/.test(value)) {
						throw new Error(`Malformed frontmatter at line ${index + 1}: Invalid number format`)
					}
				} else if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
				} else if (/^\[.*\]$/.test(value)) {
					if (!/^\[([^\]]*)\]$/.test(value)) {
						throw new Error(`Malformed frontmatter at line ${index + 1}: Invalid array format`)
					}
					const elements = value.slice(1, -1).split(",")
					elements.forEach((element) => {
						if (element.trim() === "") {
							throw new Error(`Malformed frontmatter at line ${index + 1}: Empty array element`)
						}
					})
					if (elements.length > 1) {
						const originalArrayString = value.slice(1, -1).trim()
						const reconstructedArrayString = elements.map((e) => e.trim()).join(", ")
						if (originalArrayString !== reconstructedArrayString) {
							throw new Error(`Malformed frontmatter at line ${index + 1}: Invalid array separator`)
						}
					}
				} else {
					if (/[^a-zA-Z0-9_ \-]/.test(value)) {
						throw new Error(
							`Malformed frontmatter at line ${index + 1}: Unquoted string with special characters`
						)
					}
				}
			} else if (!line.startsWith("#") && line.trim() !== "") {
				throw new Error(`Malformed frontmatter at line ${index + 1}: Invalid format`)
			}
		})
	}
}

module.exports = { SMP }

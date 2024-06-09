let readFileSync, join

if (typeof require !== "undefined") {
	;({ readFileSync } = require("node:fs"))
	;({ join } = require("node:path"))
} else {
	;(async () => {
		const fs = await import("fs")
		const path = await import("path")
		readFileSync = fs.readFileSync
		join = path.join
	})()
}

class STE {
	#baseDir = process.cwd()
	constructor(baseDir) {
		this.#baseDir = baseDir
	}

	render(filePath, dataObject) {
		try {
			if (!filePath.endsWith(".html")) {
				throw new Error(`File ${filePath} is not an HTML file`)
			}

			const resolvedFilePath = join(this.#baseDir, filePath)

			let data = readFileSync(resolvedFilePath, "utf8")

			for (const key in dataObject) {
				if (dataObject.hasOwnProperty(key)) {
					let value = dataObject[key]

					if (typeof value === "object" || typeof value === "function") {
						value = JSON.stringify(value)
					}

					if (key.startsWith("html_")) {
						data = data.replace(new RegExp(`{{${key}}}`, "g"), value)
					} else {
						const escapedValue = this.#escapeHtml(value)
						data = data.replace(new RegExp(`{{${key}}}`, "g"), escapedValue)
					}
				}
			}

			data = this.#handleIncludes(data, dataObject)

			return data
		} catch (err) {
			if (err.message.startsWith("File")) {
				throw err
			} else {
				throw new Error(`Error reading ${filePath}: ${err.message}`)
			}
		}
	}

	#handleIncludes(content, dataObject) {
		const includeRegex = /{{include\(["'](.+?)["']\)}}/g
		let match
		while ((match = includeRegex.exec(content))) {
			const includeFilePath = match[1]
			try {
				const renderedIncludeData = this.render(includeFilePath, dataObject)
				content = content.replace(match[0], renderedIncludeData)
			} catch (error) {
				throw new Error(`Error including ${includeFilePath}: ${error.message}`)
			}
		}
		return content
	}

	#escapeHtml(str) {
		const escapeMap = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		}

		return str.replace(/[&<>"']/g, (match) => escapeMap[match])
	}
}

module.exports = { STE }

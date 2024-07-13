import { readFileContent } from "./fileHandler.js"
import { preprocessConditionals } from "./preprocessConditionals/index.js"
import { handleIncludes } from "./handleIncludes.js"
import { escapeHtml } from "../utils/escapeHtml.js"

export class STE {
	#baseDir = process.cwd()
	constructor(baseDir) {
		this.#baseDir = baseDir
	}

	async render(filePath, dataObject) {
		try {
			let data = await readFileContent(this.#baseDir, filePath)

			data = preprocessConditionals(data, dataObject)

			data = this.replacePlaceholders(data, dataObject)

			data = await handleIncludes(data, dataObject, this.#baseDir, this.render.bind(this))

			return data
		} catch (err) {
			if (err.message.startsWith("File")) {
				throw err
			} else {
				throw new Error(`Error reading ${filePath}: ${err.message}`)
			}
		}
	}

	replacePlaceholders(template, data, prefix = "") {
		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				let value = data[key]
				const fullKey = prefix ? `${prefix}.${key}` : key

				if (typeof value === "object" && value !== null && !Array.isArray(value)) {
					template = this.replacePlaceholders(template, value, fullKey)
				} else {
					if (
						typeof value === "object" ||
						typeof value === "function" ||
						typeof value === "boolean" ||
						typeof value === "number"
					) {
						value = JSON.stringify(value)
					}

					const escapedValue = key.startsWith("html_") ? value : escapeHtml(value)
					const regex = new RegExp(`{{${fullKey}}}`, "g")
					template = template.replace(regex, escapedValue)
				}
			}
		}
		return template
	}
}

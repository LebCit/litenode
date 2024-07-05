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

			for (const key in dataObject) {
				if (dataObject.hasOwnProperty(key)) {
					let value = dataObject[key]

					if (
						typeof value === "object" ||
						typeof value === "function" ||
						typeof value === "boolean" ||
						typeof value === "number"
					) {
						value = JSON.stringify(value)
					}

					if (key.startsWith("html_")) {
						data = data.replace(new RegExp(`{{${key}}}`, "g"), value)
					} else {
						const escapedValue = escapeHtml(value)
						data = data.replace(new RegExp(`{{${key}}}`, "g"), escapedValue)
					}
				}
			}

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
}

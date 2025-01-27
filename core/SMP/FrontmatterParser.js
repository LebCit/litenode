import { validators } from "./utils/validators.js"

/**
 * A class responsible for parsing frontmatter content from a list of lines, typically found in YAML-like metadata
 * blocks. The parser handles nested structures, values of various types (strings, numbers, booleans, arrays, dates),
 * and converts them into an easily accessible JavaScript object.
 */
export class FrontmatterParser {
	/**
	 * Parses an array of lines into a structured object. The method processes each line to extract key-value pairs
	 * and handles nested objects, arrays, and primitive values.
	 *
	 * @param {string[]} lines - The lines of frontmatter content to be parsed.
	 * @returns {Object} - The parsed frontmatter object.
	 */
	static parse(lines) {
		let result = {}
		let currentObject = result
		let stack = [result]

		// Iterate over each line and process it based on specific patterns
		for (const line of lines) {
			// Skip lines that are comments or empty
			if (line.startsWith("#") || !line.trim()) continue

			// Process lines with key-value pairs (e.g., key: value)
			if (line.includes(":")) {
				const [key, ...valueParts] = line.split(":")
				const trimmedKey = key.trim()
				const value = valueParts.join(":").trim()

				// Skip if the key is empty
				if (!trimmedKey) continue

				if (value === "" || value.endsWith(":")) {
					// Create new nested object if value is empty or ends with a colon
					const newObject = {}
					currentObject[trimmedKey] = newObject
					stack.push(currentObject)
					currentObject = newObject
				} else {
					// Add value to the current object
					currentObject[trimmedKey] = this.parseValue(value, trimmedKey)
				}
			} else if (line.trim() === "") {
				// Pop back to the parent object when encountering an empty line
				if (stack.length > 1) {
					currentObject = stack.pop()
				}
			}
		}

		return result
	}

	/**
	 * Parses a value, determining whether it's an array, primitive, or other structure.
	 * Delegates to `parsePrimitiveValue` for non-array values.
	 *
	 * @param {string} value - The value to be parsed.
	 * @param {string} key - The key associated with the value (for context, e.g., array handling).
	 * @returns {any} - The parsed value (could be a primitive, array, or other data type).
	 */
	static parseValue(value, key) {
		value = value.trim()
		if (validators.isArray(value)) {
			try {
				// Parse an array if the value is formatted as one
				const arrayContent = value.slice(1, -1).trim()
				if (!arrayContent) return []
				return arrayContent.split(",").map((item) => {
					item = item.trim()
					// Handle quoted strings and numbers in the array
					if (validators.isQuotedString(item)) {
						return item.slice(1, -1).trim()
					}
					if (validators.isNumber(item)) {
						return parseFloat(item)
					}
					return this.parsePrimitiveValue(item)
				})
			} catch (e) {
				throw new Error(`Invalid array format: ${value}`)
			}
		}
		// Delegate to parsing primitive values if it's not an array
		return this.parsePrimitiveValue(value)
	}

	/**
	 * Parses a primitive value, determining whether it’s a quoted string, number, boolean, date, or a plain string.
	 *
	 * @param {string} value - The value to be parsed.
	 * @returns {any} - The parsed value, which could be a string, number, boolean, date, or the original string.
	 */
	static parsePrimitiveValue(value) {
		if (validators.isQuotedString(value)) {
			return value.slice(1, -1)
		}
		if (validators.isNumber(value)) {
			return parseFloat(value)
		}
		if (validators.isBoolean(value)) {
			return value.toLowerCase() === "true"
		}
		if (validators.isValidDate(value)) {
			return new Date(value)
		}
		// Return value as a string if no other type matches
		return value
	}
}

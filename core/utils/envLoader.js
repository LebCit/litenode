import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Loads environment variables from a .env file into process.env
 * @param {string} path - Path to the .env file (default: ".env")
 * @param {Object} options - Configuration options
 * @param {boolean} options.override - Whether to override existing environment variables (default: false)
 * @param {boolean} options.silent - Whether to silence errors if the file doesn't exist (default: false)
 * @returns {Object} Object containing the loaded environment variables
 */
export function loadEnv(path = ".env", options = {}) {
	const { override = false, silent = false } = options
	const envPath = resolve(process.cwd(), path)
	const envVars = {}

	try {
		// Check if the file exists
		if (!existsSync(envPath)) {
			if (!silent) {
				console.warn(`[LiteNode] Environment file not found: ${envPath}`)
			}
			return envVars
		}

		// Read and parse the .env file
		const content = readFileSync(envPath, "utf8")
		const lines = content.split(/\r?\n/)

		for (const line of lines) {
			// Skip empty lines and comments
			const trimmedLine = line.trim()
			if (!trimmedLine || trimmedLine.startsWith("#")) {
				continue
			}

			// Parse key-value pairs
			const match = trimmedLine.match(/^([^=]+)=(.*)$/)
			if (match) {
				const key = match[1].trim()
				let value = match[2].trim()

				// Remove quotes if present
				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.substring(1, value.length - 1)
				}

				// Set the environment variable if not already set or if override is true
				if (!(key in process.env) || override) {
					process.env[key] = value
					envVars[key] = value
				}
			}
		}

		return envVars
	} catch (error) {
		if (!silent) {
			console.error(`[LiteNode] Error loading environment variables: ${error.message}`)
		}
		return envVars
	}
}

/**
 * Gets an environment variable with type conversion
 * @param {string} key - The environment variable key
 * @param {any} defaultValue - Default value if the environment variable is not set
 * @returns {any} The environment variable value with appropriate type conversion
 */
export function getEnv(key, defaultValue = undefined) {
	const value = process.env[key]

	if (value === undefined) {
		return defaultValue
	}

	// Try to convert the value to the appropriate type
	if (value.toLowerCase() === "true") {
		return true
	}

	if (value.toLowerCase() === "false") {
		return false
	}

	if (value.toLowerCase() === "null") {
		return null
	}

	if (value.toLowerCase() === "undefined") {
		return undefined
	}

	// Check if the value is a number
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return Number(value)
	}

	// Return as string for all other cases
	return value
}

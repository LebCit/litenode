export const validators = {
	/**
	 * Checks if the value is a valid date.
	 * Uses `new Date(value).getTime()` to attempt creating a valid date object and checks if it returns a valid timestamp.
	 *
	 * @param {string} value - The value to validate as a date.
	 * @returns {boolean} - Returns true if the value is a valid date, false otherwise.
	 */
	isValidDate(value) {
		return !isNaN(new Date(value).getTime())
	},

	/**
	 * Checks if the value is a quoted string (either single or double quotes).
	 *
	 * @param {string} value - The value to validate as a quoted string.
	 * @returns {boolean} - Returns true if the value is a string enclosed in single or double quotes, false otherwise.
	 */
	isQuotedString(value) {
		return /^["'].*["']$/.test(value)
	},

	/**
	 * Checks if the value is a valid number (including negative and decimal numbers).
	 *
	 * @param {string} value - The value to validate as a number.
	 * @returns {boolean} - Returns true if the value matches a number pattern, false otherwise.
	 */
	isNumber(value) {
		return /^-?\d*\.?\d+$/.test(value)
	},

	/**
	 * Checks if the value is a valid boolean string (`true` or `false`).
	 *
	 * @param {string} value - The value to validate as a boolean string.
	 * @returns {boolean} - Returns true if the value is either "true" or "false" (case insensitive), false otherwise.
	 */
	isBoolean(value) {
		return /^(true|false)$/i.test(value)
	},

	/**
	 * Checks if the value is an array, represented as a string.
	 * The value is considered an array if it matches the pattern of a string starting and ending with square brackets `[...]`.
	 *
	 * @param {string} value - The value to validate as an array.
	 * @returns {boolean} - Returns true if the value matches the pattern of an array, false otherwise.
	 */
	isArray(value) {
		return /^\[.*\]$/.test(value)
	},
}

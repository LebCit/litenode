import { HEADING_ID_SEPARATOR } from "../constants.js"

/**
 * Normalizes a string by removing accents, converting to lowercase, and replacing spaces and special characters
 * with a separator to create a clean, URL-friendly string (commonly used for heading IDs).
 *
 * @param {string} str - The input string to be normalized.
 * @returns {string} - The normalized string, which is safe to use in heading IDs or URLs.
 */
export const normalizeString = (str) => {
	return (
		str
			// Normalize the string by decomposing accented characters into base characters and diacritical marks.
			.normalize("NFD")
			// Remove diacritical marks (accents, tildes, etc.) by matching Unicode characters in the range \u0300-\u036f.
			.replace(/[\u0300-\u036f]/g, "")
			// Convert the string to lowercase for consistency and to make it case-insensitive.
			.toLowerCase()
			// Remove characters that are not alphanumeric, spaces, underscores, or hyphens.
			.replace(/[^a-zA-Z0-9-_ ]/g, "")
			// Replace any sequence of underscores, spaces, or hyphens with the defined separator (e.g., "-").
			.replace(/[_\s-]+/g, HEADING_ID_SEPARATOR)
			// Trim leading and trailing hyphens or separators.
			.replace(/^-+|-+$/g, "")
	)
}

//Store generators at module level
const cycleGenerators = new Map()
let cycleCounter = 0

const cycle = (_, ...values) => {
	// Validate input
	if (values.length < 1) {
		throw new Error("cycle filter requires at least one value")
	}

	// Create a stable ID for this cycle generator
	const id = `cycle_${cycleCounter++}`

	// Store values and initial index
	cycleGenerators.set(id, {
		values: values,
		currentIndex: -1,
		next: function () {
			this.currentIndex = (this.currentIndex + 1) % this.values.length
			return this.values[this.currentIndex]
		},
	})

	return id
}

const next = (value) => {
	const generator = cycleGenerators.get(value)
	if (!generator) {
		throw new Error(`No cycle found for ID: ${value}`)
	}
	return generator.next()
}

export const builtInFilters = {
	cycle,
	next,

	abs: (value) => {
		const number = Number(value)
		if (isNaN(number)) {
			throw new Error(`abs filter expects a number, but got ${typeof value}`)
		}
		return Math.abs(number)
	},

	capitalize: (value) => {
		if (typeof value !== "string") {
			throw new Error(`capitalize filter expects a string, but got ${typeof value}`)
		}
		return String(value).charAt(0).toUpperCase() + String(value).slice(1)
	},

	currency: (value, symbol = "$") => {
		const number = Number(value)
		if (isNaN(number)) {
			throw new Error(`currency filter expects a number, but got ${typeof value}`)
		}
		return `${number.toFixed(2)} ${symbol}`
	},

	dateFormat: (value, format = "YYYY-MM-DD") => {
		const date = new Date(value)
		if (isNaN(date.getTime())) {
			throw new Error(`dateFormat filter expects a valid date, but got ${value}`)
		}
		const replacements = {
			YYYY: date.getFullYear(),
			MM: String(date.getMonth() + 1).padStart(2, "0"),
			DD: String(date.getDate()).padStart(2, "0"),
			HH: String(date.getHours()).padStart(2, "0"),
			mm: String(date.getMinutes()).padStart(2, "0"),
			ss: String(date.getSeconds()).padStart(2, "0"),
		}
		return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => replacements[match])
	},

	defaults: (value, ...fallbacks) => {
		// Helper to check if a value is truthy
		// (eliminates all falsy values: false, 0, "", null, undefined, NaN)
		const isTruthy = (val) => Boolean(val)

		// If value is truthy, return it
		if (isTruthy(value)) {
			return value
		}

		// Look for first truthy fallback
		const validFallback = fallbacks.find(isTruthy)
		return validFallback !== undefined ? validFallback : ""
	},

	dump: (value) => `<pre>${JSON.stringify(value, null, 2)}</pre>`,

	escape: (value) => {
		if (typeof value !== "string") {
			throw new Error(`escape filter expects a string, but got ${typeof value}`)
		}
		return String(value)
			.replace(/&/g, "&amp;amp;") // Double-escape & first
			.replace(/</g, "&amp;lt;") // Then escape < with &amp;lt;
			.replace(/>/g, "&amp;gt;") // Then escape > with &amp;gt;
			.replace(/"/g, "&amp;quot;") // Then escape " with &amp;quot;
			.replace(/'/g, "&amp;#39;") // Then escape ' with &amp;#39;
	},

	fileSize: (bytes) => {
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
		if (bytes === 0) return "0 Byte"
		const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
		return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i]
	},

	first: (value) => {
		if (!Array.isArray(value) && typeof value !== "string") {
			throw new Error(`first filter expects an array or string, but got ${typeof value}`)
		}
		return Array.isArray(value) ? value[0] : String(value).charAt(0)
	},

	groupBy: (array, key) => {
		if (!Array.isArray(array)) {
			throw new Error("groupBy filter expects an array")
		}
		return array.reduce((acc, item) => {
			const groupKey = item[key]
			if (!acc[groupKey]) acc[groupKey] = []
			acc[groupKey].push(item)
			return acc
		}, {})
	},

	has: (value, search) => {
		// Helper function for recursive search
		const recursiveSearch = (obj, searchKey) => {
			// Base cases
			if (obj === null || typeof obj !== "object") {
				return false
			}

			// Check if the current object has the key directly
			if (Object.prototype.hasOwnProperty.call(obj, searchKey)) {
				return true
			}

			// Recursive case - search in all values
			return Object.values(obj).some((val) => {
				if (Array.isArray(val)) {
					// For arrays, check each element
					return val.some((item) => recursiveSearch(item, searchKey))
				} else if (typeof val === "object" && val !== null) {
					// For objects, recurse
					return recursiveSearch(val, searchKey)
				}
				return false
			})
		}

		try {
			// Handle null or undefined
			if (value == null) {
				return false
			}

			// Handle objects
			if (typeof value === "object" && !Array.isArray(value)) {
				// 1. First check if it's a direct key (fastest)
				if (Object.prototype.hasOwnProperty.call(value, search)) {
					return true
				}

				// 2. If not found as direct key and search contains dots, try path traversal
				if (typeof search === "string" && search.includes(".")) {
					const parts = search.split(".")
					let current = value

					for (let i = 0; i < parts.length; i++) {
						// Check for dotted key at each level
						const remainingPath = parts.slice(i).join(".")
						if (Object.prototype.hasOwnProperty.call(current, remainingPath)) {
							return true
						}

						// Try to traverse one level deeper
						if (!Object.prototype.hasOwnProperty.call(current, parts[i])) {
							break // Break to fall through to recursive search
						}
						current = current[parts[i]]
					}
				}

				// 3. If still not found, try recursive search
				return recursiveSearch(value, search)
			}

			// Handle arrays
			if (Array.isArray(value)) {
				// First try direct includes
				if (value.includes(search)) {
					return true
				}
				// Then try recursive search on each element
				return value.some((item) => typeof item === "object" && item !== null && recursiveSearch(item, search))
			}

			// Handle strings
			if (typeof value === "string") {
				return value.includes(search)
			}

			return false
		} catch (error) {
			console.error("Error in has filter:", error)
			return false
		}
	},

	int: (value) => {
		const number = parseInt(value, 10)
		if (isNaN(number)) {
			throw new Error(`int filter expects a number, but got ${typeof value}`)
		}
		return number
	},

	join: (array, separator = ", ", finalSeparator = null) => {
		if (!Array.isArray(array)) {
			throw new Error("join filter expects an array")
		}

		// Handle empty array and single item cases
		if (array.length <= 1) {
			return array.join("")
		}

		// If no finalSeparator is provided, use the regular separator throughout
		if (finalSeparator === null) {
			return array.join(separator)
		}

		// If finalSeparator is provided, use it for the last item
		if (array.length === 2) {
			return array.join(finalSeparator)
		}

		return array.slice(0, -1).join(separator) + finalSeparator + array.slice(-1)
	},

	last: (value) => {
		if (!Array.isArray(value) && typeof value !== "string") {
			throw new Error(`last filter expects an array or string, but got ${typeof value}`)
		}
		return Array.isArray(value) ? value[value.length - 1] : String(value).slice(-1)
	},

	length: (value) => {
		if (!Array.isArray(value) && typeof value !== "object" && typeof value !== "string") {
			throw new Error(`length filter expects an array, object, or string, but got ${typeof value}`)
		}
		return Array.isArray(value)
			? value.length
			: typeof value === "object"
			? Object.keys(value).length
			: String(value).length
	},

	log: (value, label = "Template Debug") => {
		console.log(`${label}:`, value)
		return value
	},

	lowercase: (value) => {
		if (typeof value !== "string") {
			throw new Error(`lowercase filter expects a string, but got ${typeof value}`)
		}
		return String(value).toLowerCase()
	},

	numberFormat: (value, decimals = 0) => {
		const number = Number(value)
		if (isNaN(number)) {
			throw new Error("numberFormat filter expects a number")
		}
		const suffixes = ["", "K", "M", "B", "T"]
		const suffixNum = Math.floor(("" + parseInt(number)).length / 3)
		let shortValue = parseFloat(
			(suffixNum !== 0 ? number / Math.pow(1000, suffixNum) : number).toPrecision(decimals + 1)
		)
		if (shortValue % 1 !== 0) {
			shortValue = shortValue.toFixed(decimals)
		}
		return shortValue + suffixes[suffixNum]
	},

	preserveSpaces: (value) => {
		// Handle null/undefined gracefully
		if (value == null) return ""

		// Convert to string and handle non-string inputs gracefully
		const str = String(value)

		return str.replace(/\s/g, "&nbsp;") // Replace all spaces with &nbsp;
	},

	range: (value, lower, upper, inclusive = false) => {
		// Convert the input value to a number
		const number = Number(value)
		if (isNaN(number)) {
			throw new Error(`range filter expects a number, but got ${typeof value}`)
		}

		// Validate the range
		if (lower > upper) {
			throw new Error(`Invalid range: lower bound (${lower}) cannot be greater than upper bound (${upper})`)
		}

		// Check if the number is within the range
		if (inclusive) {
			return number >= lower && number <= upper
		} else {
			return number > lower && number < upper
		}
	},

	removeSpaces: (value) => {
		if (typeof value !== "string") {
			throw new Error(`removeSpaces filter expects a string, but got ${typeof value}`)
		}
		return value.replace(/\s+/g, "") // Removes all spaces, including newlines, tabs, etc.
	},

	replace: (value, search, replacement) => {
		if (typeof value !== "string") {
			throw new Error(`replace filter expects a string, but got ${typeof value}`)
		}
		return String(value).replace(new RegExp(search, "g"), replacement)
	},

	reverse: (value) => {
		if (!Array.isArray(value) && typeof value !== "string") {
			throw new Error(`reverse filter expects an array or string, but got ${typeof value}`)
		}
		return Array.isArray(value) ? value.reverse() : String(value).split("").reverse().join("")
	},

	round: (value, precision = 0) => {
		const number = Number(value)
		if (isNaN(number)) {
			throw new Error(`round filter expects a number, but got ${typeof value}`)
		}
		return number.toFixed(precision)
	},

	safeStringify: (value, indent = 2) => {
		const seen = new WeakSet()
		return JSON.stringify(
			value,
			(key, value) => {
				if (typeof value === "object" && value !== null) {
					if (seen.has(value)) {
						return "[Circular]"
					}
					seen.add(value)
				}
				return value
			},
			indent
		)
	},

	slugify: (value) => {
		if (typeof value !== "string") {
			throw new Error("slugify filter expects a string")
		}
		return value
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w\-]+/g, "")
			.replace(/\-\-+/g, "-")
			.replace(/^-+/, "")
			.replace(/-+$/, "")
	},

	sortBy: (array, key) => {
		if (!Array.isArray(array)) {
			throw new Error("sortBy filter expects an array")
		}
		return [...array].sort((a, b) => (a[key] > b[key] ? 1 : -1))
	},

	timeAgo: (value) => {
		const date = new Date(value)
		if (isNaN(date.getTime())) {
			throw new Error("timeAgo filter expects a valid date")
		}
		const seconds = Math.floor((new Date() - date) / 1000)
		const intervals = {
			year: 31536000,
			month: 2592000,
			week: 604800,
			day: 86400,
			hour: 3600,
			minute: 60,
			second: 1,
		}
		for (const [unit, secondsInUnit] of Object.entries(intervals)) {
			const interval = Math.floor(seconds / secondsInUnit)
			if (interval >= 1) {
				return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`
			}
		}
		return "just now"
	},

	toLink: (value, displayText, external = false, safe = false) => {
		if (typeof value !== "string" || typeof displayText !== "string") {
			throw new Error(`toLink expects two string arguments: URL and display text`)
		}

		// Escape the URL and display text to prevent XSS
		const escapedUrl = value.replace(
			/[&<>"']/g,
			(match) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				}[match])
		)

		const escapedText = displayText.replace(
			/[&<>"']/g,
			(match) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				}[match])
		)

		// Determine the attributes for the <a> tag
		let attributes = ""
		if (external) {
			attributes = 'target="_blank"'
			if (safe) {
				attributes += ' rel="external noopener noreferrer"'
			}
		}

		// Return the <a> tag with appropriate attributes
		return `<a href="${escapedUrl}" ${attributes}>${escapedText}</a>`
	},

	trim: (value) => {
		if (typeof value !== "string") {
			throw new Error(`trim filter expects a string, but got ${typeof value}`)
		}
		return String(value).trim()
	},

	truncate: (value, length = 50) => {
		if (typeof value !== "string") {
			throw new Error(`truncate filter expects a string, but got ${typeof value}`)
		}
		return String(value).length > length ? String(value).slice(0, length) + "..." : value
	},

	truncateWords: (value, wordCount = 10, suffix = "...") => {
		if (typeof value !== "string") {
			throw new Error("truncateWords filter expects a string")
		}
		const words = value.split(/\s+/)
		if (words.length <= wordCount) return value
		return words.slice(0, wordCount).join(" ") + suffix
	},

	type: (value) => {
		if (Array.isArray(value)) return "array"
		return typeof value
	},

	uppercase: (value) => {
		if (typeof value !== "string") {
			throw new Error(`uppercase filter expects a string, but got ${typeof value}`)
		}
		return String(value).toUpperCase()
	},

	where: (array, key, value) => {
		if (!Array.isArray(array)) {
			throw new Error("where filter expects an array")
		}
		return array.filter((item) => item[key] === value)
	},

	wordCount: (value) => {
		if (typeof value !== "string") {
			throw new Error(`wordCount filter expects a string, but got ${typeof value}`)
		}
		return String(value).split(/\s+/).filter(Boolean).length
	},
}

export function parseValue(value) {
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

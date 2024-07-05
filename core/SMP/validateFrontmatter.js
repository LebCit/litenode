export function validateFrontmatter(lines) {
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

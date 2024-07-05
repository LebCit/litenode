export function generateTOC(input) {
	const headingRegex = /<h([2-6])( id="([^"]*)")?>(.*?)<\/h\1>/g
	const headings = []
	let match

	while ((match = headingRegex.exec(input)) !== null) {
		headings.push({ level: parseInt(match[1], 10), id: match[3] || "", text: match[4] })
	}

	let toc = "<ul>"
	let currentLevel = 2
	let stack = []

	headings.forEach((heading) => {
		const { level, id, text } = heading

		if (level === 2) {
			while (currentLevel > 2) {
				toc += "</ul></li>"
				currentLevel--
				stack.pop()
			}

			toc += `<li>${id ? `<a href="#${id}">${text}</a>` : text}`
			stack.push(level)
		} else {
			if (level > currentLevel) {
				toc += "<ul>"
				currentLevel = level
			} else if (level < currentLevel) {
				while (currentLevel > level) {
					toc += "</ul></li>"
					currentLevel--
					stack.pop()
				}
			}

			toc += `<li>${id ? `<a href="#${id}">${text}</a>` : text}`
			stack.push(level)
		}
	})

	while (currentLevel > 2) {
		toc += "</ul></li>"
		currentLevel--
		stack.pop()
	}

	toc += "</ul>"

	return toc
}

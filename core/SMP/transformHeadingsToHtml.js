export function transformHeadingsToHtml(markdown) {
	for (let level = 6; level >= 1; level--) {
		const regex = new RegExp(`^${"#".repeat(level)} (.*$)`, "gim")
		const replacement = `<h${level}>$1</h${level}>`
		markdown = markdown.replace(regex, replacement)
	}
	return markdown
}

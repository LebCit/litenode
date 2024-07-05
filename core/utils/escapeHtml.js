export function escapeHtml(str) {
	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	}

	return str.replace(/[&<>"']/g, (match) => escapeMap[match])
}

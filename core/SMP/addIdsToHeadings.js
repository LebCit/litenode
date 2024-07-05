export function addIdsToHeadings(str) {
	const regex = /<(h[1-6])(.*?)>(.*?)\s*{\s*.*#\s*(.*?)\s*}\s*<\/\1>/gi

	return str.replace(regex, (match, tag, attributes, content, id) => {
		let normalizedId = id
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-zA-Z0-9-_ ]/g, "")
			.replace(/_+/g, "-")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+/, "")
			.replace(/-+$/, "")

		return `<${tag}${attributes} id="${normalizedId}">${content}</${tag}>`
	})
}

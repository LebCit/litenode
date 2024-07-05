import { paginator } from "../../../utils/paginator.js"

export async function paginateMarkdownFiles(input, page = 1, perPage = 10, parseMarkdownFileS) {
	let parsedFiles

	if (Array.isArray(input)) {
		parsedFiles = input
	} else if (typeof input === "string") {
		parsedFiles = await parseMarkdownFileS(input)
	} else {
		throw new Error("Invalid input type for paginateMarkdownFiles. Must be an array or a string.")
	}

	return paginator(parsedFiles, page, perPage)
}

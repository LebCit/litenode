import { getMarkdownFiles } from "./getMarkdownFiles.js"
import { join, relative } from "node:path"

export async function parseMarkdownFileS(dir, parseMarkdownFile) {
	const normalizedDir = dir.startsWith("/") ? dir.slice(1) : dir
	const files = await getMarkdownFiles(join("views", normalizedDir))
	return Promise.all(
		files.map((file) => {
			const relativePath = relative("views", file)
			return parseMarkdownFile(relativePath)
		})
	)
}

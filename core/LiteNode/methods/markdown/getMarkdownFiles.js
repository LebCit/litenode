import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"

export async function getMarkdownFiles(dir, fileList = []) {
	const files = await readdir(dir, { withFileTypes: true })
	await Promise.all(
		files.map(async (file) => {
			const filePath = join(dir, file.name)
			const stats = await stat(filePath)
			if (stats.isDirectory()) {
				await getMarkdownFiles(filePath, fileList)
			} else if (filePath.endsWith(".md")) {
				fileList.push(filePath)
			}
		})
	)
	return fileList
}

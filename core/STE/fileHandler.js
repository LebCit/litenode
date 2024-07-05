import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const readFileContent = async (baseDir, filePath) => {
	if (!filePath.endsWith(".html")) {
		throw new Error(`File ${filePath} is not an HTML file`)
	}

	const resolvedFilePath = join(baseDir, filePath)
	return await readFile(resolvedFilePath, { encoding: "utf8" })
}

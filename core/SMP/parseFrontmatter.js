import path from "path"
import { existsSync, readFileSync } from "node:fs"
import { validateFrontmatter } from "./validateFrontmatter.js"
import { parseFrontmatterLines } from "./parseFrontmatterLines.js"
import { extractCodeBlocks } from "./extractCodeBlocks.js"
import { transformHeadingsToHtml } from "./transformHeadingsToHtml.js"
import { addIdsToHeadings } from "./addIdsToHeadings.js"
import { reinsertCodeBlocks } from "./reinsertCodeBlocks.js"

export function parseFrontmatter(filePath) {
	const normalizedFilePath = filePath.startsWith("/") ? filePath.slice(1) : filePath
	const fullPath = path.join(this.baseDir, normalizedFilePath)

	if (!existsSync(fullPath)) {
		throw new Error(`File not found: ${fullPath}`)
	}

	const fileContent = readFileSync(fullPath, "utf8")
	const lines = fileContent.split("\n")

	let frontmatter = {}
	let contentLines = []
	let inFrontmatter = false
	let frontmatterLines = []

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (line === "---") {
			if (!inFrontmatter) {
				inFrontmatter = true
			} else {
				inFrontmatter = false
				continue
			}
		} else if (inFrontmatter) {
			frontmatterLines.push(line)
		} else {
			contentLines = lines.slice(i)
			break
		}
	}

	try {
		validateFrontmatter(frontmatterLines)
		frontmatter = parseFrontmatterLines(frontmatterLines)
	} catch (error) {
		throw new Error(`Error parsing frontmatter: ${error.message}`)
	}

	const markdownContent = contentLines.join("\n").trim()
	const { markdownWithoutCodeBlocks, codeBlocks } = extractCodeBlocks(markdownContent)
	const transformedMarkdown = transformHeadingsToHtml(markdownWithoutCodeBlocks)
	const markdownWithIDs = addIdsToHeadings(transformedMarkdown)
	const finalContent = reinsertCodeBlocks(markdownWithIDs, codeBlocks)

	return {
		frontmatter,
		content: finalContent,
		filePath: fullPath.split(path.sep).join("/"),
		fileDir: path.dirname(normalizedFilePath).split(path.sep).join("/"),
		fileName: path.basename(normalizedFilePath),
	}
}

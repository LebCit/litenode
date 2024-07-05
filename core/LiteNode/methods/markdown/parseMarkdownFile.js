import { SMP } from "../../../SMP/smp.js"

export function parseMarkdownFile(filePath) {
	const smp = new SMP()
	return smp.parseFrontmatter(filePath)
}

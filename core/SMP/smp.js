import { parseFrontmatter } from "./parseFrontmatter.js"

export class SMP {
	constructor(baseDir = "views") {
		this.baseDir = baseDir
	}

	parseFrontmatter(filePath) {
		return parseFrontmatter.call(this, filePath)
	}
}

import { readdirSync, statSync, readFileSync, watch } from "node:fs"
import { extname, join } from "node:path"
import { getContentType } from "../utils/getContentType.js"

const NO_STATIC_DIR = "__NO_STATIC_DIR__"

export class StaticAssetLoader {
	constructor(directory) {
		this.directory = directory
		this.watchedFiles = []
	}

	getFiles(dirName, maxDepth = Infinity, depth = 0) {
		let files = []
		if (depth > maxDepth) return files

		const items = readdirSync(dirName, { withFileTypes: true })

		for (const item of items) {
			const filePath = join(dirName, item.name)
			if (item.isDirectory()) {
				files = [...files, ...this.getFiles(filePath, maxDepth, depth + 1)]
			} else {
				files.push(filePath)
				if (!this.watchedFiles.includes(filePath)) {
					this.watchedFiles.push(filePath)
				}
			}
		}

		return files
	}

	watchDirectory(router) {
		watch(this.directory, { recursive: true }, (eventType, filename) => {
			if (filename && eventType === "rename") {
				const filePath = join(this.directory, filename)
				if (!this.watchedFiles.includes(filePath)) {
					this.addRouteForFile(router, filePath)
					this.watchedFiles.push(filePath)
				}
			}
		})
	}

	addRouteForFile(router, filePath) {
		const routePath = `/${filePath.split("\\").join("/")}`

		router.get(routePath, (req, res) => {
			const fullPath = join(process.cwd(), filePath)
			try {
				const stats = statSync(fullPath)
				if (stats.isFile()) {
					const contentType = getContentType(extname(fullPath))
					res.setHeader("Content-Type", contentType)
					const fileContents = readFileSync(fullPath)
					res.end(fileContents)
				} else {
					res.writeHead(404)
					res.end("Not Found")
				}
			} catch (err) {
				console.error(`Error while serving file: ${err.message}`)
				res.writeHead(500)
				res.end()
			}
		})
	}

	serveStaticAssets(router) {
		if (this.directory === NO_STATIC_DIR) {
			return
		}

		try {
			const staticAssets = this.getFiles(this.directory, 5) // Allowed depth for directory traversal is 5
			staticAssets.forEach((el) => {
				this.addRouteForFile(router, el)
			})
			this.watchDirectory(router)
		} catch (error) {
			console.warn(`Error while reading static directory: "${this.directory}" directory doesn't exist!`)
			console.warn("LiteNode will continue running without serving static assets.")
		}
	}
}

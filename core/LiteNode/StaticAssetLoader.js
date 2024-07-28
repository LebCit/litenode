import { readdirSync, statSync, readFileSync, watch } from "node:fs"
import { extname, join } from "node:path"
import { getContentType } from "../utils/getContentType.js"

export class StaticAssetLoader {
	constructor(directory) {
		this.directory = directory
		this.watchedFiles = []
	}

	getFiles(dirName) {
		let files = []
		const items = readdirSync(dirName, { withFileTypes: true })

		for (const item of items) {
			if (item.isDirectory()) {
				files = [...files, ...this.getFiles(`${dirName}/${item.name}`)]
			} else {
				const filePath = `${dirName}/${item.name}`
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
					//console.log(`New file added: ${filePath}`)
				}
			}
		})
	}

	addRouteForFile(router, filePath) {
		// Ensure the routePath includes the static directory
		const routePath = `/${filePath.split("\\").join("/")}`
		//console.log(`Registering route: ${routePath} for file: ${filePath}`)

		router.get(routePath, (req, res) => {
			const fullPath = join(process.cwd(), filePath)
			//console.log(`Serving file from: ${fullPath}`)
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
		if (this.directory === "__NO_STATIC_DIR__") {
			return
		}

		try {
			const staticAssets = this.getFiles(this.directory)
			//console.log("Static assets to be served:", staticAssets)

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

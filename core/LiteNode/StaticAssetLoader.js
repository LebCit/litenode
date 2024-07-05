import { readdirSync, statSync, readFileSync } from "node:fs"
import { extname, join } from "node:path"
import { getContentType } from "../utils/getContentType.js"

export class StaticAssetLoader {
	constructor(directory) {
		this.directory = directory
	}

	getFiles(dirName) {
		let files = []
		const items = readdirSync(dirName, { withFileTypes: true })

		for (const item of items) {
			if (item.isDirectory()) {
				files = [...files, ...this.getFiles(`${dirName}/${item.name}`)]
			} else {
				files.push(`${dirName}/${item.name}`)
			}
		}

		return files
	}

	serveStaticAssets(router) {
		if (this.directory === "__NO_STATIC_DIR__") {
			return
		}

		try {
			const staticAssets = this.getFiles(this.directory)

			staticAssets.forEach((el) => {
				router.get(`/${el}`, (req, res) => {
					const filePath = join(process.cwd(), `/${el}`)

					try {
						const stats = statSync(filePath)
						if (stats.isFile()) {
							const contentType = getContentType(extname(filePath))
							res.setHeader("Content-Type", contentType)
							const fileContents = readFileSync(filePath)
							res.end(fileContents)
						} else {
							res.writeHead(404)
							res.end("Not Found")
						}
					} catch (err) {
						console.error(`Error while serving file: ${err.message}`)
						res.writeHead(500)
						res.end()
						return
					}
				})
			})
		} catch (error) {
			console.warn(`Error while reading static directory: "${this.directory}" directory doesn't exist!`)
			console.warn("LiteNode will continue running without serving static assets.")
		}
	}
}

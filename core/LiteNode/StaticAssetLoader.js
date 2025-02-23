import { readdirSync, statSync, readFileSync, watch } from "node:fs"
import { extname, join, sep } from "node:path"
import { getContentType } from "../utils/getContentType.js"

const NO_STATIC_DIR = "__NO_STATIC_DIR__"

export class StaticAssetLoader {
    constructor(directory) {
        this.directory = directory
        this.watchedFiles = []
        this.contentTypeCache = new Map()
        this.fileCache = new Map()
    }

    getFiles(dirName, maxDepth = Infinity, depth = 0) {
        let files = []
        if (depth > maxDepth) return files

        try {
            const items = readdirSync(dirName, {
                withFileTypes: true,
            })

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
        } catch (error) {
            console.error(`[StaticAssetLoader] Error scanning directory ${dirName}:`, error)
        }

        return files
    }

    watchDirectory(router) {
        try {
            watch(
                this.directory,
                {
                    recursive: true,
                },
                (eventType, filename) => {
                    if (!filename) return

                    const filePath = join(this.directory, filename)
                    const fullPath = join(process.cwd(), filePath) // Add this line

                    if (eventType === "rename") {
                        try {
                            // Check if file exists
                            statSync(filePath)
                            // File exists - add route if needed
                            if (!this.watchedFiles.includes(filePath)) {
                                this.addRouteForFile(router, filePath)
                                this.watchedFiles.push(filePath)
                            }
                        } catch (err) {
                            // File was deleted - remove from watched files
                            const index = this.watchedFiles.indexOf(filePath)
                            if (index > -1) {
                                this.watchedFiles.splice(index, 1)
                            }

                            // Clear from cache if it exists
                            if (this.fileCache.has(filePath)) {
                                this.fileCache.delete(filePath)
                            }
                        }
                    } else if (eventType === "change") {
                        // Clear cache on file change to ensure fresh content
                        if (this.fileCache.has(fullPath)) {
                            this.fileCache.delete(fullPath)
                        }
                    }
                }
            )
        } catch (error) {
            console.error(`[StaticAssetLoader] Error setting up directory watch:`, error)
        }
    }

    serveFile(fullPath) {
        return (req, res) => {
            try {
                const stats = statSync(fullPath)
                if (stats.isFile()) {
                    // Create an ETag based on file size and modification time
                    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`
                    res.setHeader("ETag", etag)

                    // Check if client has a valid cached version
                    const ifNoneMatch = req.headers["if-none-match"]
                    if (ifNoneMatch === etag) {
                        // Client has current version
                        res.statusCode = 304 // Not Modified
                        res.end()
                        return
                    }

                    // Get content type from cache or compute it
                    const ext = extname(fullPath)
                    let contentType = this.contentTypeCache.get(ext)

                    if (!contentType) {
                        contentType = getContentType(ext)
                        this.contentTypeCache.set(ext, contentType)
                    }

                    res.setHeader("Content-Type", contentType)

                    // Set Cache-Control headers based on environment
                    if (process.env.NODE_ENV !== "production") {
                        // In development, use validation caching instead of time-based
                        res.setHeader("Cache-Control", "no-cache")
                    } else if (
                        /\.(avif|jpg|jpeg|png|gif|webp|svg|ico|css|js|mjs|woff|woff2|ttf|eot)$/i.test(fullPath)
                    ) {
                        res.setHeader("Cache-Control", "public, max-age=86400") // 1 day
                    } else {
                        res.setHeader("Cache-Control", "no-cache") // Don't cache other content
                    }

                    // Get file contents from cache or read from disk
                    let fileContents
                    const isDev = process.env.NODE_ENV !== "production"

                    if (isDev && this.fileCache.has(fullPath)) {
                        fileContents = this.fileCache.get(fullPath)
                    } else {
                        fileContents = readFileSync(fullPath)
                        // Only cache in development mode
                        if (isDev) {
                            this.fileCache.set(fullPath, fileContents)
                        }
                    }

                    res.end(fileContents)
                } else {
                    res.writeHead(404)
                    res.end("Not Found")
                }
            } catch (err) {
                console.error(`[StaticAssetLoader] Error serving file ${fullPath}: ${err.message}`)
                if (!res.headersSent) {
                    res.writeHead(500)
                    res.end("Internal Server Error")
                }
            }
        }
    }

    addRouteForFile(router, filePath) {
        // Normalize path separators and ensure proper format
        const routePath = `/${filePath.split(sep).join("/")}`.replace(/\/+/g, "/")
        const fullPath = join(process.cwd(), filePath)

        // Add the route
        router.get(routePath, this.serveFile(fullPath))
    }

    serveStaticAssets(router) {
        if (this.directory === NO_STATIC_DIR) {
            return
        }

        try {
            const staticAssets = this.getFiles(this.directory, 10) // Allowed depth for directory traversal is 10

            staticAssets.forEach((el) => {
                this.addRouteForFile(router, el)
            })

            this.watchDirectory(router)
        } catch (error) {
            console.warn(
                `[StaticAssetLoader] Error while reading static directory: "${this.directory}" directory doesn't exist!`
            )
            console.warn("[StaticAssetLoader] LiteNode will continue running without serving static assets.")
        }
    }
}

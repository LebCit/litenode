let createServer, readFileSync, readdirSync, statSync, readdir, stat, writeFile, extname, join, relative, STE, SMP

if (typeof require !== "undefined") {
	const http = require("node:http")
	const fs = require("node:fs")
	const fsPromises = require("node:fs/promises")
	const path = require("node:path")
	const ste = require("./ste.js")
	const smp = require("./smp.js")

	createServer = http.createServer
	;({ readFileSync, readdirSync, statSync } = fs)
	;({ readdir, stat, writeFile } = fsPromises)
	;({ extname, join, relative } = path)
	;({ STE } = ste)
	;({ SMP } = smp)
} else {
	;(async () => {
		const http = await import("node:http")
		const fs = await import("node:fs")
		const fsPromises = await import("node:fs/promises")
		const path = await import("node:path")
		const ste = await import("./ste.js")
		const smp = await import("./smp.js")

		createServer = http.createServer
		;({ readFileSync, readdirSync, statSync } = fs)
		;({ readdir, stat, writeFile } = fsPromises)
		;({ extname, join, relative } = path)
		STE = ste.STE
		SMP = smp.SMP
	})()
}

class LiteNode {
	#rootNode
	#notFoundHandler
	#errorHandler
	#middlewareStack
	#directory
	#staticAssetLoader
	#templateEngine
	#parseMarkdownFile

	constructor(directory = "static") {
		this.#rootNode = new RouteNode()
		this.#notFoundHandler = null
		this.#errorHandler = null
		this.#middlewareStack = []
		this.#directory = directory
		this.#templateEngine = new STE("views")
		this.#parseMarkdownFile = new SMP()

		if (directory !== "__NO_STATIC_DIR__") {
			this.#staticAssetLoader = new StaticAssetLoader(directory)
			this.#staticAssetLoader.serveStaticAssets(this)
		}
	}

	#addRoute(httpMethod, routePath, ...handlers) {
		let currentNode = this.#rootNode
		let pathStart = 1,
			pathEnd = 1,
			pathLength = routePath.length

		for (; pathEnd <= pathLength; ++pathEnd) {
			if (pathEnd === pathLength || routePath[pathEnd] === "/") {
				let pathSegment = routePath.substring(pathStart, pathEnd)
				let nextNode

				if (pathSegment[0] === ":") {
					if (!currentNode.param) {
						currentNode.param = new RouteNode()
						currentNode.param.paramName = pathSegment.substring(1)
					}
					nextNode = currentNode.param
				} else {
					nextNode =
						currentNode.children[pathSegment] || (currentNode.children[pathSegment] = new RouteNode())
				}

				currentNode = nextNode
				pathStart = pathEnd + 1
			}
		}

		currentNode.handler[httpMethod] = handlers
	}

	printTree() {
		this.#printNode(this.#rootNode, "Root")
	}

	#printNode(node, prefix, level = 0, prefixSymbol = "") {
		let indentation = " ".repeat(level * 4)

		console.log(`${prefixSymbol ? `${indentation}${prefixSymbol} ${prefix || "/"}` : prefix}`)
		for (const [method, handlers] of Object.entries(node.handler)) {
			const handlerNames = handlers.map(
				(handler) =>
					handler.name ||
					handler
						.toString()
						.replace(/[\n]/g, "")
						.replace(/[\s]{2,}/g, " ")
						.substring(0, 30) + "..."
			)
			console.log(`${indentation}  └─ [${method}] ↠  ${handlerNames.join(", ")}`)
		}

		for (const [childPrefix, childNode] of Object.entries(node.children)) {
			this.#printNode(childNode, childPrefix, level + 1, "├─")
		}
		if (node.param) {
			this.#printNode(node.param, `:${node.param.paramName}`, level + 1, "├─")
		}
	}

	notFound(handler) {
		this.#notFoundHandler = handler
	}

	onError(handler) {
		this.#errorHandler = handler
	}

	#getContentType(filePath) {
		const contentTypeMap = {
			".css": "text/css",
			".js": "application/javascript",
			".mjs": "application/javascript",
			".png": "image/png",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".gif": "image/gif",
			".avif": "image/avif",
			".svg": "image/svg+xml",
			".ico": "image/x-icon",
			".webp": "image/webp",
			".html": "text/html",
			".txt": "text/plain",
		}

		const extName = extname(filePath)
		return contentTypeMap[extName] || "application/octet-stream"
	}

	#extendResponse(nativeRes) {
		nativeRes.redirect = (location, statusCode = 302) => {
			nativeRes.writeHead(statusCode, { Location: location })
			nativeRes.end()
		}

		nativeRes.txt = (text) => {
			nativeRes.setHeader("Content-Type", "text/plain")
			nativeRes.end(text)
		}

		nativeRes.json = (data) => {
			nativeRes.setHeader("Content-Type", "application/json")
			nativeRes.end(JSON.stringify(data))
		}

		nativeRes.sendFile = (filePath) => {
			try {
				const fileContents = readFileSync(filePath)
				const contentType = this.#getContentType(filePath)
				nativeRes.setHeader("Content-Type", contentType)
				nativeRes.end(fileContents)
			} catch (err) {
				nativeRes.writeHead(500)
				nativeRes.end("Internal Server Error")
			}
		}

		nativeRes.render = async (template, data) => {
			try {
				const html = await this.#templateEngine.render(template, data)
				nativeRes.setHeader("Content-Type", "text/html")
				nativeRes.end(html)
			} catch (error) {
				nativeRes.writeHead(500)
				nativeRes.end(`Error rendering template: ${error.message}`)
			}
		}

		nativeRes.status = (code) => {
			nativeRes.statusCode = code
			return nativeRes
		}
	}

	async #handleRequest(nativeReq, nativeRes) {
		try {
			this.#extendResponse(nativeRes)

			await this.#applyMiddleware(nativeReq, nativeRes)

			const { method, url } = nativeReq
			const queryDelimiter = url.indexOf("?")
			const routePath = queryDelimiter === -1 ? url : url.substring(0, queryDelimiter)

			const routeHandler = this.#findRouteHandler(method, routePath)

			if (!routeHandler) {
				if (this.#notFoundHandler) {
					await this.#notFoundHandler(nativeReq, nativeRes)
					return
				} else {
					nativeRes.writeHead(404)
					nativeRes.end("Route Not Found")
					return
				}
			}

			nativeReq.params = routeHandler.extractedParams
			nativeReq.queryParams = new URLSearchParams(queryDelimiter === -1 ? "" : url.substring(queryDelimiter))

			const routeHandlerFuncs = routeHandler.requestHandlers

			for (const handler of routeHandlerFuncs) {
				await handler(nativeReq, nativeRes)
				if (nativeRes.headersSent || nativeRes.finished) return
			}
		} catch (error) {
			console.error("Internal Server Error:", error)

			if (this.#errorHandler) {
				await this.#errorHandler(error, nativeReq, nativeRes)
				return
			} else {
				nativeRes.writeHead(500)
				nativeRes.end("Internal Server Error")
			}
		}
	}

	async #applyMiddleware(nativeReq, nativeRes) {
		for (const middleware of this.#middlewareStack) {
			await middleware(nativeReq, nativeRes)
			if (nativeRes.headersSent || nativeRes.finished) return
		}
	}

	#findRouteHandler(httpMethod, routePath) {
		let currentNode = this.#rootNode
		let extractedParams = Object.create(null)
		let pathStart = 1
		const pathLength = routePath.length

		for (let pathEnd = 1; pathEnd <= pathLength; ++pathEnd) {
			if (pathEnd === pathLength || routePath[pathEnd] === "/") {
				const pathSegment = routePath.substring(pathStart, pathEnd)
				let nextNode = currentNode.children[pathSegment]

				while (!nextNode && currentNode.param) {
					nextNode = currentNode.param
					extractedParams[currentNode.param.paramName] = pathSegment
					pathStart = pathEnd + 1
				}

				if (!nextNode) return null

				currentNode = nextNode
				pathStart = pathEnd + 1
			}
		}

		if (!currentNode.handler[httpMethod]) return null

		return { requestHandlers: currentNode.handler[httpMethod], extractedParams }
	}

	get(routePath, ...handlers) {
		this.#addRoute("GET", routePath, ...handlers)
		return this
	}

	post(routePath, ...handlers) {
		const jsonHandler = async (req, res) => {
			let body = ""
			const contentType = req.headers["content-type"]

			if (!/^application\/json/.test(contentType)) {
				res.writeHead(415)
				return res.end("Unsupported Media Type")
			}

			const maxRequestSize = 1024 * 1024
			if (req.headers["content-length"] > maxRequestSize) {
				res.writeHead(413)
				return res.end("Request Entity Too Large")
			}

			req.on("data", (chunk) => {
				body += chunk.toString()
				if (body.length > maxRequestSize) {
					req.connection.destroy()
				}
			})

			req.on("end", async () => {
				try {
					const data = JSON.parse(body)
					req.body = data
					await handlers[handlers.length - 1](req, res, data)
				} catch (error) {
					console.error("Error parsing JSON:", error)
					res.writeHead(400)
					res.end("Invalid JSON")
				}
			})
		}

		const allHandlers = handlers.slice(0, -1).concat(jsonHandler)
		this.#addRoute("POST", routePath, ...allHandlers)
		return this
	}

	put(routePath, ...handlers) {
		this.#addRoute("PUT", routePath, ...handlers)
		return this
	}

	delete(routePath, ...handlers) {
		this.#addRoute("DELETE", routePath, ...handlers)
		return this
	}

	patch(routePath, ...handlers) {
		this.#addRoute("PATCH", routePath, ...handlers)
		return this
	}

	#mergeNodes(currentNode, nodeToMerge, middlewares = []) {
		for (const [method, handlers] of Object.entries(nodeToMerge.handler)) {
			currentNode.handler[method] = [...middlewares, ...handlers]
		}

		for (const [pathSegment, subNode] of Object.entries(nodeToMerge.children)) {
			if (!currentNode.children[pathSegment]) {
				currentNode.children[pathSegment] = new RouteNode()
			}
			this.#mergeNodes(currentNode.children[pathSegment], subNode, middlewares)
		}

		if (nodeToMerge.param) {
			if (!currentNode.param) {
				currentNode.param = new RouteNode()
				currentNode.param.paramName = nodeToMerge.param.paramName
			}
			this.#mergeNodes(currentNode.param, nodeToMerge.param, middlewares)
		}
	}

	#nestNodes(currentNode, nodeToNest, prefix, middlewares = []) {
		const newRouter = new LiteNode("__NO_STATIC_DIR__")
		this.#generateNestedRoutes(nodeToNest, prefix, newRouter)
		this.#mergeNodes(currentNode, newRouter.#rootNode, middlewares)
	}

	#generateNestedRoutes(node, prefix, newRouter) {
		for (const [method, handlers] of Object.entries(node.handler)) {
			newRouter.#addRoute(method, prefix, ...handlers)
		}

		for (const [pathSegment, subNode] of Object.entries(node.children)) {
			this.#generateNestedRoutes(subNode, `${prefix}/${pathSegment}`, newRouter)
		}

		if (node.param) {
			this.#generateNestedRoutes(node.param, `${prefix}/:${node.param.paramName}`, newRouter)
		}
	}

	merge(routerToMerge, ...middlewares) {
		this.#mergeNodes(this.#rootNode, routerToMerge.#rootNode, middlewares)
	}

	nest(prefix, routerToNest, ...middlewares) {
		this.#nestNodes(this.#rootNode, routerToNest.#rootNode, prefix, middlewares)
		return this
	}

	use(middleware) {
		this.#middlewareStack.push(middleware)
		return this
	}

	async renderToFile(template, data, outputPath) {
		try {
			const html = await this.#templateEngine.render(template, data)
			await writeFile(outputPath, html, "utf-8")
		} catch (error) {
			console.error(`Error rendering template or saving file: ${error.message}`)
		}
	}

	parseMarkdownFile(filePath) {
		return this.#parseMarkdownFile.parseFrontmatter(filePath)
	}

	async #getMarkdownFiles(dir, fileList = []) {
		const files = await readdir(dir, { withFileTypes: true })
		await Promise.all(
			files.map(async (file) => {
				const filePath = join(dir, file.name)
				const stats = await stat(filePath)
				if (stats.isDirectory()) {
					await this.#getMarkdownFiles(filePath, fileList)
				} else if (filePath.endsWith(".md")) {
					fileList.push(filePath)
				}
			})
		)
		return fileList
	}

	async parseMarkdownFileS(dir) {
		const normalizedDir = dir.startsWith("/") ? dir.slice(1) : dir
		const files = await this.#getMarkdownFiles(join("views", normalizedDir))
		return Promise.all(
			files.map((file) => {
				const relativePath = relative("views", file)
				return this.parseMarkdownFile(relativePath)
			})
		)
	}

	async extractMarkdownProperties(input, properties) {
		let parsedFiles

		if (Array.isArray(input)) {
			parsedFiles = input
		} else if (typeof input === "string") {
			if (input.endsWith(".md")) {
				const parsedFile = await this.parseMarkdownFile(input)
				parsedFiles = [parsedFile]
			} else {
				parsedFiles = await this.parseMarkdownFileS(input)
			}
		} else {
			throw new Error("Invalid input type for extractMarkdownProperties. Must be an array or a string.")
		}

		return parsedFiles.map((obj) => {
			const { frontmatter } = obj

			if (!frontmatter) {
				return properties.reduce((acc, prop) => {
					acc[prop] = undefined
					return acc
				}, {})
			}

			return properties.reduce((acc, prop) => {
				const value = prop.split(".").reduce((nestedAcc, key) => nestedAcc?.[key], frontmatter)
				acc[prop] = value
				return acc
			}, {})
		})
	}

	addIdsToHeadings(str) {
		const regex = /<(h[1-6])(.*?)>(.*?)\s*{\s*.*#\s*(.*?)\s*}\s*<\/\1>/gi

		return str.replace(regex, (match, tag, attributes, content, id) => {
			// Normalize the ID
			let normalizedId = id
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase()
				.replace(/[^a-zA-Z0-9-_ ]/g, "")
				.replace(/_+/g, "-")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-+/, "")
				.replace(/-+$/, "")

			return `<${tag}${attributes} id="${normalizedId}">${content}</${tag}>`
		})
	}

	startServer(port = 5000) {
		return createServer((req, res) => {
			this.#handleRequest(req, res)
		}).listen(port, () => {
			console.log(`App @ http://localhost:${port}`)
		})
	}
}

class RouteNode {
	constructor() {
		this.handler = Object.create(null)
		this.children = Object.create(null)
		this.param = null
		this.paramName = null
	}
}

class StaticAssetLoader {
	constructor(directory) {
		this.directory = directory
	}

	#getFiles(dirName) {
		let files = []
		const items = readdirSync(dirName, { withFileTypes: true })

		for (const item of items) {
			if (item.isDirectory()) {
				files = [...files, ...this.#getFiles(`${dirName}/${item.name}`)]
			} else {
				files.push(`${dirName}/${item.name}`)
			}
		}

		return files
	}

	#getContentType(file) {
		const contentTypeMap = {
			".css": "text/css",
			".js": "application/javascript",
			".mjs": "application/javascript",
			".png": "image/png",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".gif": "image/gif",
			".avif": "image/avif",
			".svg": "image/svg+xml",
			".ico": "image/x-icon",
			".webp": "image/webp",
		}

		const extName = extname(file)
		return contentTypeMap[extName] || "application/octet-stream"
	}

	serveStaticAssets(router) {
		if (this.directory === "__NO_STATIC_DIR__") {
			return
		}

		try {
			const staticAssets = this.#getFiles(this.directory)

			staticAssets.forEach((el) => {
				router.get(`/${el}`, (req, res) => {
					const filePath = join(process.cwd(), `/${el}`)

					try {
						const stats = statSync(filePath)
						if (stats.isFile()) {
							const contentType = this.#getContentType(filePath)
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

module.exports = { LiteNode }

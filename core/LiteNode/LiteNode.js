// Built-in modules
import http from "node:http"
import { writeFile } from "node:fs/promises"

// Internal classes
import { RouteNode } from "./RouteNode.js"
import { StaticAssetLoader } from "./StaticAssetLoader.js"
import { STE } from "../STE/ste.js"

// Internal Router functions
import { printNode } from "./methods/printNode.js"
import { addRoute } from "./methods/addRoute.js"
import { handleRequest } from "./methods/handleRequest.js"
import { mergeNodes } from "./methods/mergeNodes.js"

// Internal Markdown handler
import { MarkdownHandler } from "./methods/markdownHandler.js"

// Internal Utility functions
import { generateTOC } from "../utils/generateTOC.js"
import { bodyParser } from "../utils/bodyParser.js"
import { checkForUpdate } from "../utils/updateChecker.js"
import { loadEnv, getEnv } from "../utils/envLoader.js"

export class LiteNode {
	#rootNode
	#addRoute

	#notFoundHandler
	#errorHandler
	#middlewareStack
	#handleRequest
	#staticDir
	#viewsDir
	#staticAssetLoader
	#markdownHandler

	constructor(staticDir = "static", viewsDir = "views") {
		// If staticDir is provided but viewsDir isn't, use default views
		this.#staticDir = staticDir
		this.#viewsDir = viewsDir

		// Initialize the root node for routing
		this.#rootNode = new RouteNode()

		// Bind addRoute method to LiteNode instance
		this.#addRoute = (httpMethod, routePath, ...handlers) => {
			return addRoute(this.#rootNode, httpMethod, routePath, ...handlers)
		}

		this.#notFoundHandler = null // Handler for 404 errors
		this.#errorHandler = null // Handler for general errors
		this.#middlewareStack = [] // Stack of middleware functions

		// Bind handleRequest method to LiteNode instance
		this.#handleRequest = (nativeReq, nativeRes) => {
			try {
				return handleRequest(
					this.#middlewareStack,
					this.#rootNode,
					this.#notFoundHandler,
					this.#errorHandler,
					nativeReq,
					nativeRes,
					this.#viewsDir
				)
			} catch (error) {
				console.error(`Error handling request: ${error.message}`)
				nativeRes.statusCode = 500
				nativeRes.end("Internal Server Error")
			}
		}

		this.#staticDir = staticDir
		if (staticDir !== "__NO_STATIC_DIR__") {
			this.#staticAssetLoader = new StaticAssetLoader(staticDir)
		}

		// Initialize MarkdownHandler with the views directory
		this.#markdownHandler = new MarkdownHandler(this.#viewsDir)
	}

	printTree() {
		// Print the route tree for debugging purposes
		printNode(this.#rootNode, "Root")
	}

	notFound(handler) {
		// Set custom handler for 404 Not Found errors
		this.#notFoundHandler = handler
	}

	onError(handler) {
		// Set custom handler for general errors
		this.#errorHandler = handler
	}

	get(routePath, ...handlers) {
		// Define GET route
		this.#addRoute("GET", routePath, ...handlers)
		return this
	}

	post(routePath, ...handlers) {
		// Define POST route with optional max request size
		const customMaxRequestSize = typeof handlers[handlers.length - 1] === "number" ? handlers.pop() : null
		const allHandlers = handlers.slice(0, -1).concat(bodyParser(handlers, customMaxRequestSize))
		this.#addRoute("POST", routePath, ...allHandlers)
		return this
	}

	put(routePath, ...handlers) {
		// Define PUT route
		this.#addRoute("PUT", routePath, ...handlers)
		return this
	}

	delete(routePath, ...handlers) {
		// Define DELETE route
		this.#addRoute("DELETE", routePath, ...handlers)
		return this
	}

	patch(routePath, ...handlers) {
		// Define PATCH route
		this.#addRoute("PATCH", routePath, ...handlers)
		return this
	}

	merge(routerToMerge, ...middlewares) {
		// Merge another router into this one
		mergeNodes(this.#rootNode, routerToMerge.#rootNode, middlewares)
	}

	#generateNestedRoutes(node, prefix, newRouter) {
		// Recursively generate nested routes
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

	#nestNodes(currentNode, nodeToNest, prefix, middlewares = []) {
		const newRouter = new LiteNode("__NO_STATIC_DIR__")
		this.#generateNestedRoutes(nodeToNest, prefix, newRouter)
		mergeNodes(currentNode, newRouter.#rootNode, middlewares)
	}

	nest(prefix, routerToNest, ...middlewares) {
		// Nest another router under a specific prefix
		this.#nestNodes(this.#rootNode, routerToNest.#rootNode, prefix, middlewares)
		return this
	}

	use(middleware) {
		// Add middleware to the stack
		this.#middlewareStack.push(middleware)
		return this
	}

	async renderToFile(template, data, outputPath) {
		try {
			// Render a template to a file
			const templateEngine = new STE(this.#viewsDir)
			const html = await templateEngine.render(template, data)
			await writeFile(outputPath, html, "utf-8")
		} catch (error) {
			console.error(`Error rendering template or saving file: ${error.message}`)
		}
	}

	parseMarkdownFile(filePath) {
		return this.#markdownHandler.parseMarkdownFile(filePath)
	}

	async parseMarkdownFileS(dir) {
		return this.#markdownHandler.parseMarkdownFileS(dir)
	}

	async extractMarkdownProperties(input, properties) {
		return this.#markdownHandler.extractMarkdownProperties(input, properties)
	}

	async groupByMarkdownProperty(dir, properties, groupByField) {
		return this.#markdownHandler.groupByMarkdownProperty(dir, properties, groupByField)
	}

	async paginateMarkdownFiles(input, page = 1, perPage = 10) {
		return this.#markdownHandler.paginateMarkdownFiles(input, page, perPage)
	}

	generateTOC(input) {
		return generateTOC(input)
	}

	loadEnv(path = ".env", options = {}) {
		return loadEnv(path, options)
	}

	getEnv(key, defaultValue = undefined) {
		return getEnv(key, defaultValue)
	}

	async startServer(port = 5000) {
		try {
			// Check for updates before starting the server
			await checkForUpdate()
		} catch (err) {
			console.error("Error checking for updates:", err)
		}

		if (this.#staticAssetLoader) {
			// Serve static assets if the static asset loader is initialized
			this.#staticAssetLoader.serveStaticAssets(this)
		}

		// Read environment PORT variable if available
		const envPort = getEnv("PORT", port)

		http.createServer((req, res) => {
			this.#handleRequest(req, res)
		}).listen(envPort, () => {
			console.log(`App @ http://localhost:${envPort}`)
		})
	}
}

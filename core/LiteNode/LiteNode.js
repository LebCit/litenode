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

export class LiteNode {
	#rootNode
	#addRoute

	#notFoundHandler
	#errorHandler
	#middlewareStack
	#handleRequest
	#directory
	#staticAssetLoader
	#markdownHandler

	constructor(directory = "static") {
		this.#rootNode = new RouteNode()

		// Bind addRoute method to LiteNode instance
		this.#addRoute = (httpMethod, routePath, ...handlers) => {
			return addRoute(this.#rootNode, httpMethod, routePath, ...handlers)
		}

		this.#notFoundHandler = null
		this.#errorHandler = null
		this.#middlewareStack = []

		// Bind handleRequest method to LiteNode instance
		this.#handleRequest = (nativeReq, nativeRes) => {
			return handleRequest(
				this.#middlewareStack,
				this.#rootNode,
				this.#notFoundHandler,
				this.#errorHandler,
				nativeReq,
				nativeRes
			)
		}

		this.#directory = directory
		if (directory !== "__NO_STATIC_DIR__") {
			this.#staticAssetLoader = new StaticAssetLoader(directory)
		}

		this.#markdownHandler = new MarkdownHandler() // Initialize the MarkdownHandler
	}

	printTree() {
		printNode(this.#rootNode, "Root")
	}

	notFound(handler) {
		this.#notFoundHandler = handler
	}

	onError(handler) {
		this.#errorHandler = handler
	}

	get(routePath, ...handlers) {
		this.#addRoute("GET", routePath, ...handlers)
		return this
	}

	post(routePath, ...handlers) {
		const customMaxRequestSize = typeof handlers[handlers.length - 1] === "number" ? handlers.pop() : null
		const allHandlers = handlers.slice(0, -1).concat(bodyParser(handlers, customMaxRequestSize))
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

	merge(routerToMerge, ...middlewares) {
		mergeNodes(this.#rootNode, routerToMerge.#rootNode, middlewares)
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

	#nestNodes(currentNode, nodeToNest, prefix, middlewares = []) {
		const newRouter = new LiteNode("__NO_STATIC_DIR__")
		this.#generateNestedRoutes(nodeToNest, prefix, newRouter)
		mergeNodes(currentNode, newRouter.#rootNode, middlewares)
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
			const templateEngine = new STE("views")
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

	async startServer(port = 5000) {
		try {
			await checkForUpdate()
		} catch (err) {
			console.error("Error checking for updates:", err)
		}

		if (this.#staticAssetLoader) {
			this.#staticAssetLoader.serveStaticAssets(this)
		}

		http.createServer((req, res) => {
			this.#handleRequest(req, res)
		}).listen(port, () => {
			console.log(`App @ http://localhost:${port}`)
		})
	}
}

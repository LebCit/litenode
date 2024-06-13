declare module "litenode" {
	import { Server, IncomingMessage, ServerResponse } from "http"

	interface RouteHandler {
		(req: IncomingMessage, res: ServerResponse, data?: any): Promise<void>
	}

	class LiteNode {
		constructor(directory?: string)

		printTree(): void
		notFound(handler: RouteHandler): void
		onError(handler: RouteHandler): void
		get(routePath: string, ...handlers: RouteHandler[]): this
		post(routePath: string, ...handlers: RouteHandler[]): this
		put(routePath: string, ...handlers: RouteHandler[]): this
		delete(routePath: string, ...handlers: RouteHandler[]): this
		patch(routePath: string, ...handlers: RouteHandler[]): this
		merge(routerToMerge: LiteNode, ...middlewares: RouteHandler[]): void
		nest(prefix: string, routerToNest: LiteNode, ...middlewares: RouteHandler[]): this
		use(middleware: RouteHandler): this
		renderToFile(template: string, data: object, outputPath: string): Promise<void>
		parseMarkdownFile(filePath: string): {
			frontmatter: object
			content: string
			filePath: string
			fileDir: string
			fileName: string
		}
		parseMarkdownFileS(
			dir: string
		): Promise<{ frontmatter: object; content: string; filePath: string; fileDir: string; fileName: string }[]>
		extractMarkdownProperties(arr: Array<{ frontmatter: object }>, properties: Array<string>): Array<object>
		addIdsToHeadings(str: string): string
		startServer(port?: number): Server
	}

	export { LiteNode }
}

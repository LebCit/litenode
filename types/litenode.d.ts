declare module "litenode" {
	import { Server, IncomingMessage, ServerResponse } from "http"

	// Extend ServerResponse to include custom methods
	interface CustomResponse extends ServerResponse {
		/**
		 * Redirects the client to the specified location.
		 *
		 * @param location - The URL to redirect to.
		 * @param statusCode - The HTTP status code for the redirect. Defaults to 302.
		 * @example
		 * res.redirect("/new-location", 301);
		 * @see {@link https://litenode.pages.dev/docs/routing/#redirect|Redirect Documentation}
		 */
		redirect(location: string, statusCode?: number): void

		/**
		 * Sends a plain text response.
		 *
		 * @param text - The text to send as the response.
		 * @example
		 * res.txt("Hello, world!");
		 * @see {@link https://litenode.pages.dev/docs/send-text/#txt|Txt Documentation}
		 */
		txt(text: string): void

		/**
		 * Sends a JSON response.
		 *
		 * @param data - The JSON data to send as the response.
		 * @example
		 * res.json({ message: "Success" });
		 * @see {@link https://litenode.pages.dev/docs/json|Json Documentation}
		 */
		json(data: any): void

		/**
		 * Sends a file as the response.
		 *
		 * @param filePath - The path to the file to send.
		 * @example
		 * res.sendFile("/path/to/file.txt");
		 * @see {@link https://litenode.pages.dev/docs/send-file|SendFile Documentation}
		 */
		sendFile(filePath: string): void

		/**
		 * Renders a template with the provided data and sends it as the response.
		 *
		 * @param template - The path to the template file.
		 * @param data - The data to pass to the template.
		 * @example
		 * res.render("template.html", { title: "Hello, World!" });
		 * @see {@link https://litenode.pages.dev/docs/rendering-templates/#render|Render Documentation}
		 */
		render(template: string, data: object): Promise<void>

		/**
		 * Sets the HTTP status code for the response.
		 *
		 * @param code - The HTTP status code.
		 * @returns The modified CustomResponse object.
		 * @example
		 * res.status(404).txt("Not Found");
		 * @see {@link https://litenode.pages.dev/docs/routing/#status|Status Documentation}
		 */
		status(code: number): this

		/**
		 * Sends an HTML response.
		 *
		 * @param html - The HTML content to send as the response.
		 * @param statusCode - The HTTP status code to send (default is 200).
		 * @example
		 * res.html("<h1>Hello, world!</h1>");
		 * @see {@link https://litenode.pages.dev/docs/send-html|HTML Documentation}
		 */
		html(html: string, statusCode?: number): void

		/**
		 * Sends an XML response.
		 *
		 * @param xmlContent - The XML content to send as the response.
		 * @param statusCode - The HTTP status code to send (default is 200).
		 * @example
		 * res.xml("<response><message>Hello, world!</message></response>");
		 * @see {@link https://litenode.pages.dev/docs/send-xml|XML Documentation}
		 */
		xml(xmlContent: string, statusCode?: number): void
	}

	// RouteHandler interface using CustomRequest and CustomResponse
	interface RouteHandler {
		(req: IncomingMessage, res: CustomResponse, data?: any): Promise<void>
	}

	// LiteNode class with method signatures
	class LiteNode {
		constructor(directory?: string)

		/**
		 * Prints the routing tree to the console.
		 *
		 * @example
		 * app.printTree();
		 *
		 * @see {@link https://litenode.pages.dev/docs/print-route-tree|PrintTree Documentation}
		 */
		printTree(): void

		/**
		 * Sets a handler for not found (404) responses.
		 *
		 * @param handler - The handler to be called for 404 responses.
		 * @example
		 * app.notFound((req, res) => {
		 *   res.status(404).txt("Not Found");
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/error-handling/#notfound|NotFound Documentation}
		 */
		notFound(handler: RouteHandler): void

		/**
		 * Sets a handler for error responses.
		 *
		 * @param handler - The handler to be called for error responses.
		 * @example
		 * app.onError((err, req, res) => {
		 *   res.status(500).json({ error: err.message });
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/error-handling/#onerror|OnError Documentation}
		 */
		onError(handler: RouteHandler): void

		/**
		 * Registers a GET route handler.
		 *
		 * @param routePath - The path for the route.
		 * @param handlers - The handler functions for the route.
		 * @example
		 * app.get("/routePath", (req, res) => {
		 *   res.json({ message: "Hello, World!" });
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/routing/#get|Get Documentation}
		 */
		get(routePath: string, ...handlers: RouteHandler[]): this

		/**
		 * Registers a POST route handler.
		 *
		 * @param routePath - The path for the route.
		 * @param handlers - The handler functions for the route.
		 * @example
		 * app.post("/submit", async (req, res) => {
		 *   res.status(200).json({ success: true });
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/routing/#post|Post Documentation}
		 */
		post(routePath: string, ...handlers: RouteHandler[]): this

		/**
		 * Registers a PUT route handler.
		 *
		 * @param routePath - The path for the route.
		 * @param handlers - The handler functions for the route.
		 * @example
		 * app.put("/users/:id", async (req, res) => {
		 *   const userId = req.params.id;
		 *   res.txt(`User with ID ${userId} updated successfully`);
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/routing/#put|Put Documentation}
		 */
		put(routePath: string, ...handlers: RouteHandler[]): this

		/**
		 * Registers a DELETE route handler.
		 *
		 * @param routePath - The path for the route.
		 * @param handlers - The handler functions for the route.
		 * @example
		 * app.delete("/users/:id", async (req, res) => {
		 *   const userId = req.params.id;
		 *   res.end(`User with ID ${userId} deleted successfully`);
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/routing/#delete|Delete Documentation}
		 */
		delete(routePath: string, ...handlers: RouteHandler[]): this

		/**
		 * Registers a PATCH route handler.
		 *
		 * @param routePath - The path for the route.
		 * @param handlers - The handler functions for the route.
		 * @example
		 * app.patch("/users/:id", async (req, res) => {
		 *   const userId = req.params.id;
		 *   res.txt(`User with ID ${userId} patched successfully`);
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/routing/#patch|Patch Documentation}
		 */
		patch(routePath: string, ...handlers: RouteHandler[]): this

		/**
		 * Merges another LiteNode router into this one.
		 *
		 * @param routerToMerge - The LiteNode router to merge.
		 * @param middlewares - Middleware functions to apply.
		 * @example
		 * app.merge(otherRouter, middleware1, middleware2);
		 *
		 * @see {@link https://litenode.pages.dev/docs/merge-and-nest/#merge|Merge Documentation}
		 */
		merge(routerToMerge: LiteNode, ...middlewares: RouteHandler[]): void

		/**
		 * Nests another LiteNode router under a specified prefix.
		 *
		 * @param prefix - The prefix under which to nest the router.
		 * @param routerToNest - The LiteNode router to nest.
		 * @param middlewares - Middleware functions to apply.
		 * @example
		 * app.nest("/api", apiRouter);
		 *
		 * @see {@link https://litenode.pages.dev/docs/merge-and-nest/#nest|Nest Documentation}
		 */
		nest(prefix: string, routerToNest: LiteNode, ...middlewares: RouteHandler[]): this

		/**
		 * Adds a middleware function to the LiteNode instance.
		 *
		 * @param middleware - The middleware function to add.
		 * @example
		 * app.use((req, res) => {
		 *   console.log(`${req.method} ${req.url}`);
		 *
		 * });
		 *
		 * @see {@link https://litenode.pages.dev/docs/middleware/#use|Use Documentation}
		 */
		use(middleware: RouteHandler): this

		/**
		 * Renders a template to a file.
		 *
		 * @param template - The path to the template file.
		 * @param data - The data to pass to the template.
		 * @param outputPath - The path where the rendered file will be saved.
		 * @example
		 * await app.renderToFile("template.html", { title: "Hello, World!" }, "output.html");
		 *
		 * @see {@link https://litenode.pages.dev/docs/rendering-templates/#rendertofile|RenderToFile Documentation}
		 */
		renderToFile(template: string, data: object, outputPath: string): Promise<void>

		/**
		 * Parses a markdown file and extracts frontmatter and content.
		 *
		 * @param filePath - The path to the markdown file.
		 * @returns An object containing frontmatter, content, filePath, fileDir, fileName and fileBaseName.
		 * @example
		 * const { frontmatter, content } = app.parseMarkdownFile("path/to/file.md");
		 *
		 * @see {@link https://litenode.pages.dev/docs/markdown/#parse-markdown-file|ParseMarkdownFile Documentation}
		 */
		parseMarkdownFile(filePath: string): {
			frontmatter: object
			content: string
			filePath: string
			fileDir: string
			fileName: string
			fileBaseName: string
		}

		/**
		 * Parses all markdown files in a directory and extracts their frontmatter and content.
		 *
		 * @param dir - The directory containing the markdown files.
		 * @returns A promise that resolves to an array of objects containing frontmatter, content, filePath, fileDir, fileName and fileBaseName.
		 * @example
		 * const files = await app.parseMarkdownFileS("pages");
		 *
		 * @see {@link https://litenode.pages.dev/docs/markdown/#parse-markdown-files|ParseMarkdownFileS Documentation}
		 */
		parseMarkdownFileS(dir: string): Promise<
			{
				frontmatter: object
				content: string
				filePath: string
				fileDir: string
				fileName: string
				fileBaseName: string
			}[]
		>

		/**
		 * Extracts specified properties from parsed markdown files.
		 * This function can handle input as an array of parsed files, a directory path, or a single markdown file path,
		 * and organizes the specified frontmatter properties for further processing or display.
		 *
		 * @param input - The directory containing markdown files, an array of parsed markdown file objects, or a single markdown file path.
		 * @param properties - The properties to extract from the frontmatter.
		 * @returns A promise that resolves to an array of objects containing the specified properties.
		 * @example
		 * // Extracting properties from markdown files in the "pages" directory
		 * const propertiesToExtract = ["title", "date", "author"];
		 * const extractedProperties = await app.extractMarkdownProperties("pages", propertiesToExtract);
		 *
		 * @example
		 * // Extracting properties from a single markdown file
		 * const propertiesToExtract = ["title", "date", "author"];
		 * const extractedProperties = await app.extractMarkdownProperties("pages/single-file.md", propertiesToExtract);
		 *
		 * @see {@link https://litenode.pages.dev/docs/markdown/#extract-markdown-properties|ExtractMarkdownProperties Documentation}
		 */
		extractMarkdownProperties(
			input:
				| string
				| {
						frontmatter: object
						content: string
						filePath: string
						fileDir: string
						fileName: string
						fileBaseName: string
				  }[],
			properties: Array<string>
		): Promise<Array<object>>

		/**
		 * Groups parsed markdown file objects by a specified property in the frontmatter.
		 *
		 * @param dir - The directory containing the markdown files.
		 * @param properties - The properties to extract from the frontmatter.
		 * @param groupByField - The property by which to group the files.
		 * @returns A promise that resolves to an object with keys as group values and values as arrays of grouped objects.
		 * @example
		 * const groupedArticles = await app.groupByMarkdownProperty("pages", ["title", "href", "category"], "category");
		 *
		 * @see {@link https://litenode.pages.dev/docs/markdown/#group-by-markdown-property|GroupByMarkdownProperty Documentation}
		 */
		groupByMarkdownProperty(
			dir: string,
			properties: Array<string>,
			groupByField: string
		): Promise<{ [key: string]: Array<object> }>

		/**
		 * Paginates markdown files either from a directory or an array of parsed files.
		 *
		 * @param input - The directory containing markdown files or an array of parsed markdown file objects.
		 * @param page - The current page number for pagination.
		 * @param perPage - The number of items per page.
		 * @returns A promise that resolves to an object containing pagination details and the paginated data.
		 * @example
		 * // Paginate files from a directory
		 * const pagination = await app.paginateMarkdownFiles("pages", 1, 10);
		 *
		 * // Paginate a pre-parsed array of files
		 * const parsedFiles = await app.parseMarkdownFileS("pages");
		 * const pagination = await app.paginateMarkdownFiles(parsedFiles, 1, 10);
		 *
		 * @see {@link https://litenode.pages.dev/docs/markdown/#paginate-markdown-files|PaginateMarkdownFiles Documentation}
		 */
		paginateMarkdownFiles(
			input:
				| string
				| {
						frontmatter: object
						content: string
						filePath: string
						fileDir: string
						fileName: string
						fileBaseName: string
				  }[],
			page?: number,
			perPage?: number
		): Promise<{
			page: number
			per_page: number
			prev_page: number | null
			next_page: number | null
			total_files: number
			total_pages: number
			data: Array<object>
		}>

		/**
		 * Generates a Table of Contents (TOC) from an HTML string by extracting headings (h2 to h6) and creating a nested list structure.
		 *
		 * @param input - The HTML string from which to generate the TOC.
		 * @returns A string representing the HTML for the Table of Contents.
		 * @example
		 * const htmlContent = "<h2 id='intro'>Introduction</h2><h3 id='overview'>Overview</h3>";
		 * const toc = app.generateTOC(htmlContent);
		 * console.log(toc); // Outputs the HTML for the TOC
		 *
		 * @see {@link https://litenode.pages.dev/docs/markdown/#generate-toc|GenerateTOC Documentation}
		 */
		generateTOC(input: string): string

		/**
		 * Starts the LiteNode server on the specified port.
		 *
		 * @param port - The port number on which to start the server. Defaults to 5000 if not specified.
		 * @returns The HTTP server instance.
		 * @example
		 * app.startServer();
		 * // Outputs: App @ http://localhost:5000
		 *
		 * app.startServer(3000);
		 * // Outputs: App @ http://localhost:3000
		 *
		 * @see {@link https://litenode.pages.dev/docs/starting-the-server|StartServer Documentation}
		 */
		startServer(port?: number): Server
	}

	export { LiteNode }
}

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

        /**
         * Sets a cookie with the given name, value, and options
         *
         * @param name - The name of the cookie
         * @param value - The value of the cookie
         * @param options - Cookie options
         * @returns The response object for chaining
         *
         * @example
         * res.setCookie('session', 'abc123', { maxAge: 3600 });
         * @see {@link https://litenode.pages.dev/docs/cookies/#setcookie|SetCookie Documentation}
         */
        setCookie(
            name: string,
            value: string,
            options?: {
                maxAge?: number
                expires?: Date | string
                path?: string
                domain?: string
                secure?: boolean
                httpOnly?: boolean
                sameSite?: "Strict" | "Lax" | "None"
            }
        ): this

        /**
         * Gets the current value of cookie headers to be set
         *
         * @returns Array of cookie headers
         * @see {@link https://litenode.pages.dev/docs/cookies/#getcookies|GetCookies Documentation}
         */
        getCookies(): string[]

        /**
         * Clears a cookie by setting its expiration in the past
         *
         * @param name - The name of the cookie to clear
         * @param options - Cookie options (path and domain must match the original cookie)
         * @returns The response object for chaining
         *
         * @example
         * res.clearCookie('session');
         * @see {@link https://litenode.pages.dev/docs/cookies/#clearcookie|ClearCookie Documentation}
         */
        clearCookie(
            name: string,
            options?: {
                path?: string
                domain?: string
            }
        ): this
    }

    // RouteHandler interface using CustomRequest and CustomResponse
    interface RouteHandler {
        (req: IncomingMessage, res: CustomResponse, data?: any): Promise<void>
    }

    // Extend IncomingMessage with cookies
    module "http" {
        interface IncomingMessage {
            cookies?: {
                [key: string]: string
            }
        }
    }

    // LiteNode class with method signatures
    class LiteNode {
        constructor(staticDir?: string, viewsDir?: string)

        /**
         * Prints the routing tree to the console.
         *
         * @example
         * app.printTree();
         *
         * @see {@link https://litenode.pages.dev/docs/routing#printing-route-tree|PrintTree Documentation}
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
         * @param customMaxRequestSize - (Optional) Maximum request size in bytes. If not provided, defaults to 1MB.
         * @example
         * app.post("/submit", async (req, res) => {
         *   res.status(200).json({ success: true });
         * });
         *
         * @example
         * app.post("/upload", async (req, res) => {
         *   res.status(200).json({ success: true });
         * }, 5); // customMaxRequestSize of 5 MB
         *
         * @see {@link https://litenode.pages.dev/docs/routing/#post|Post Documentation}
         */
        post(routePath: string, ...handlers: (RouteHandler | number)[]): this

        /**
         * Registers a PUT route handler with automatic body parsing.
         *
         * @param routePath - The path for the route.
         * @param handlers - The handler functions for the route.
         * @param customMaxRequestSize - (Optional) Maximum request size in MB. If not provided, defaults to 1MB.
         * @example
         * app.put("/users/:id", async (req, res) => {
         *   const userId = req.params.id;
         *   const userData = req.body;
         *   res.txt(`User with ID ${userId} updated successfully`);
         * });
         *
         * @example
         * app.put("/users/:id", async (req, res) => {
         *   const userData = req.body;
         *   res.status(200).json({ success: true });
         * }, 5); // customMaxRequestSize of 5 MB
         *
         * @see {@link https://litenode.pages.dev/docs/routing/#put|Put Documentation}
         */
        put(routePath: string, ...handlers: (RouteHandler | number)[]): this

        /**
         * Registers a DELETE route handler with automatic body parsing.
         *
         * @param routePath - The path for the route.
         * @param handlers - The handler functions for the route.
         * @param customMaxRequestSize - (Optional) Maximum request size in MB. If not provided, defaults to 1MB.
         * @example
         * app.delete("/users/:id", async (req, res) => {
         *   const userId = req.params.id;
         *   const options = req.body; // Access deletion options if provided
         *   res.end(`User with ID ${userId} deleted successfully`);
         * });
         *
         * @example
         * // Bulk delete with IDs in request body
         * app.delete("/users", async (req, res) => {
         *   const userIds = req.body.ids;
         *   res.json({ deleted: userIds.length });
         * }, 2); // customMaxRequestSize of 2 MB
         *
         * @see {@link https://litenode.pages.dev/docs/routing/#delete|Delete Documentation}
         */
        delete(routePath: string, ...handlers: (RouteHandler | number)[]): this

        /**
         * Registers a PATCH route handler with automatic body parsing.
         *
         * @param routePath - The path for the route.
         * @param handlers - The handler functions for the route.
         * @param customMaxRequestSize - (Optional) Maximum request size in MB. If not provided, defaults to 1MB.
         * @example
         * app.patch("/users/:id", async (req, res) => {
         *   const userId = req.params.id;
         *   const updates = req.body; // Partial updates for the resource
         *   res.txt(`User with ID ${userId} patched successfully`);
         * });
         *
         * @example
         * app.patch("/documents/:id", async (req, res) => {
         *   const docUpdates = req.body;
         *   res.status(200).json({ success: true });
         * }, 10); // customMaxRequestSize of 10 MB for larger documents
         *
         * @see {@link https://litenode.pages.dev/docs/routing/#patch|Patch Documentation}
         */
        patch(routePath: string, ...handlers: (RouteHandler | number)[]): this

        /**
         * Registers a route handler for ALL HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS).
         *
         * @param routePath - The path for the route.
         * @param handlers - The handler functions for the route.
         * @example
         * app.any("/health", (req, res) => {
         *   res.json({ status: "healthy", method: req.method });
         * });
         *
         * @returns The LiteNode instance for method chaining.
         * @see {@link https://litenode.pages.dev/docs/routing/#any|Any Documentation}
         */
        any(routePath: string, ...handlers: RouteHandler[]): this

        /**
         * Registers a route handler for a path with a wildcard that matches a single path segment.
         * This is equivalent to `get(path + "/*", ...)` but provides a more descriptive API.
         * The matched value is available as `req.params["*"]`.
         *
         * @param routePath - The base path for the route (wildcard will be appended).
         * @param handlers - The handler functions for the route.
         * @example
         * app.wildcard("/files", (req, res) => {
         *   const filename = req.params["*"];
         *   res.json({ message: `Viewing file: ${filename}` });
         * });
         *
         * @returns The LiteNode instance for method chaining.
         * @see {@link https://litenode.pages.dev/docs/routing/#wildcard|Wildcard Documentation}
         */
        wildcard(routePath: string, ...handlers: RouteHandler[]): this

        /**
         * Registers a route handler for a path with a catch-all wildcard that matches multiple path segments.
         * This is equivalent to `get(path + "/**", ...)` but provides a more descriptive API.
         * The matched value is available as `req.params["**"]`.
         *
         * @param routePath - The base path for the route (catch-all wildcard will be appended).
         * @param handlers - The handler functions for the route.
         * @example
         * app.catchAll("/api", (req, res) => {
         *   const path = req.params["**"];
         *   res.json({ message: `Matched API path: ${path}` });
         * });
         *
         * @returns The LiteNode instance for method chaining.
         * @see {@link https://litenode.pages.dev/docs/routing/#catchall|CatchAll Documentation}
         */
        catchAll(routePath: string, ...handlers: RouteHandler[]): this

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
         * Loads environment variables from a .env file into process.env
         * @param {string} path - Path to the .env file (default: ".env")
         * @param {Object} options - Configuration options
         * @param {boolean} options.override - Whether to override existing environment variables (default: false)
         * @param {boolean} options.silent - Whether to silence errors if the file doesn't exist (default: false)
         * @returns {Object} Object containing the loaded environment variables
         * @example
         * app.loadEnv(); // Load from .env
         * app.loadEnv('.env.local', { override: true }); // Load from custom path with options
         *
         * @see {@link https://litenode.pages.dev/docs/env-variables/#loadenv|LoadEnv Documentation}
         */
        loadEnv(path?: string, options?: { override?: boolean; silent?: boolean }): { [key: string]: string }

        /**
         * Gets an environment variable with type conversion
         * @param {string} key - The environment variable key
         * @param {any} defaultValue - Default value if the environment variable is not set
         * @returns {any} The environment variable value with appropriate type conversion
         * @example
         * const port = app.getEnv('PORT', 3000); // Will be a number
         * const debug = app.getEnv('DEBUG', false); // Will be a boolean
         *
         * @see {@link https://litenode.pages.dev/docs/env-variables/#getenv|GetEnv Documentation}
         */
        getEnv(key: string, defaultValue?: any): any

        /**
         * Creates a cookie parser middleware and adds it to the middleware stack.
         * This middleware will parse incoming cookies and make them available at req.cookies.
         *
         * @returns The LiteNode instance for chaining
         *
         * @example
         * app.enableCookieParser();
         *
         * app.get('/profile', (req, res) => {
         *   const sessionId = req.cookies.sessionId;
         *   // Use the cookie value...
         * });
         * @see {@link https://litenode.pages.dev/docs/cookies|Cookies Documentation}
         */
        enableCookieParser(): this

        /**
         * Creates utilities for working with signed cookies.
         * Signed cookies help protect against client tampering.
         *
         * @param secret - The secret key used for signing cookies (should be at least 16 characters)
         * @returns Object with methods for working with signed cookies
         *
         * @example
         * const signedCookies = app.createSignedCookies('my-long-secret-key');
         *
         * app.get('/login', async (req, res) => {
         *   // Set a signed cookie
         *   await signedCookies.setCookie(res, 'userId', '12345', { httpOnly: true });
         *   res.redirect('/dashboard');
         * });
         *
         * app.get('/dashboard', async (req, res) => {
         *   // Get and verify a signed cookie
         *   const userId = await signedCookies.getCookie(req, 'userId');
         *
         *   if (!userId) {
         *     return res.redirect('/login');
         *   }
         *
         *   // Continue with authenticated user...
         * });
         * @see {@link https://litenode.pages.dev/docs/cookies/#createsignedcookies|CreateSignedCookies Documentation}
         */
        createSignedCookies(secret: string): {
            sign(value: string): Promise<string>
            verify(signedValue: string): Promise<string | null>
            setCookie(res: CustomResponse, name: string, value: string, options?: object): Promise<CustomResponse>
            getCookie(req: IncomingMessage, name: string): Promise<string | null>
        }

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

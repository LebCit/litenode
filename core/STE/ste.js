import { Tokenizer } from "./syntax/Tokenizer.js"
import { Parser } from "./parser/Parser.js"
import { Evaluator } from "./evaluator/Evaluator.js"

export class STE {
    #baseDir
    #templateCache
    #currentTemplate
    #includeStack // Track include stack
    #pathUtils = null
    #isRootMode
    #rootPrefix // Store the root component folder name
    #basePath // Store the base path segments

    /**
     * Creates a new instance of TemplateEngine
     * @param {string} baseDir - The base directory where template files are located
     * @param {Object} options - Configuration options
     */
    constructor(baseDir) {
        this.#baseDir = baseDir
        this.#templateCache = new Map()
        this.#currentTemplate = null
        this.#includeStack = [] // Initialize include stack
        this.htmlVars = new Map() // Add persistent storage for HTML variables
        this.#isRootMode = baseDir === "./"
        this.#rootPrefix = null // Will be set on first template render
        this.#basePath = null // Will be set on first template render
    }

    /**
     * Initializes path utilities if not already initialized
     * @private
     */
    async #initPathUtils() {
        if (!this.#pathUtils) {
            const { dirname, resolve, join, normalize } = await import("node:path")
            this.#pathUtils = { dirname, resolve, join, normalize }
        }
        return this.#pathUtils
    }

    /**
     * Sets the root prefix and base path from the first template path.
     * Used to maintain consistent path resolution across template includes.
     *
     * @private
     * @param {string} path - The initial template path
     */
    #setRootPrefix(path) {
        if (!this.#basePath) {
            // Split the path into segments
            const segments = path.split(/[/\\]/)

            if (segments.length > 2) {
                // Multiple levels - If there are more than two segments, remove the last two (file and its parent folder)
                this.#basePath = segments.slice(0, -2) // Remove last two segments (e.g., layouts/index.html)
            } else {
                // Root level file - empty base path
                this.#basePath = []
            }

            this.#rootPrefix = this.#basePath.join("/")
        }
    }

    /**
     * Normalizes a file path by resolving dots and maintaining correct base path context.
     * Handles both absolute and relative paths while preserving theme directory structure.
     *
     * @private
     * @param {string} path - The path to normalize
     * @returns {string} The normalized path
     */
    #normalizePath(path) {
        // Split path into segments
        const segments = path.split(/[/\\]/)
        const result = []

        // Handle absolute paths (no ./ or ../)
        if (!path.startsWith("./") && !path.startsWith("../")) {
            // For absolute paths within templates, prepend the base path
            if (this.#basePath && segments[0] !== this.#basePath[0]) {
                result.push(...this.#basePath)
            }
        }

        // Process remaining segments
        for (const segment of segments) {
            if (segment === "." || segment === "") {
                continue
            }
            if (segment === "..") {
                result.pop()
            } else {
                result.push(segment)
            }
        }

        return result.join("/")
    }

    /**
     * Resolves template paths, handling both absolute (from default views) and relative paths
     * @private
     */
    async #resolvePath(filePath) {
        if (!filePath.endsWith(".html")) {
            throw new Error("Invalid file type. Only HTML files are supported.")
        }

        const { dirname, resolve, join, normalize } = await this.#initPathUtils()

        // Normalize the base directory to absolute path
        const absoluteBaseDir = normalize(resolve(this.#baseDir))

        // If path starts with ./ or ../, it's relative to current template
        if (filePath.startsWith("./") || filePath.startsWith("../")) {
            // Get the INCLUDING template (not the one being included)
            const includingTemplate = this.#includeStack[this.#includeStack.length - 1] || this.#currentTemplate

            // Get the directory of the including template
            const includingTemplateDir = dirname(includingTemplate)

            // First join the template directory with the new path
            const combinedPath = join(includingTemplateDir, filePath)

            // Then normalize it to resolve any .. or .
            const normalizedPath = this.#normalizePath(combinedPath)

            // Create the absolute path by joining with the base directory
            const resolvedPath = join(absoluteBaseDir, normalizedPath)

            // In root mode, verify the path exists within project root
            if (this.#isRootMode) {
                const projectRoot = resolve("./")
                if (!resolvedPath.startsWith(projectRoot)) {
                    throw new Error("Cannot include files outside of project root")
                }
            }

            return resolvedPath
        }

        // For absolute paths (from baseDir), normalize then join with baseDir
        const normalizedPath = this.#normalizePath(filePath)
        const absolutePath = join(absoluteBaseDir, normalizedPath)

        return absolutePath
    }

    /**
     * Renders a template from a file path
     * @param {string} filePath - The path to the template file
     * @param {Object} data - The data object containing values
     * @returns {Promise<string>} The rendered template
     */
    async render(filePath, data) {
        try {
            // Set root prefix from the initial template path
            this.#setRootPrefix(filePath)

            // Set current template for relative path resolution
            const previousTemplate = this.#currentTemplate
            this.#currentTemplate = filePath

            // Process the main template
            const processed = await this.renderStringWithoutRestore(filePath, data)

            // Restore HTML content at the end
            let result = processed
            for (const { marker, value } of this.htmlVars.values()) {
                result = result.replace(marker, value)
            }

            // Restore previous template context
            this.#currentTemplate = previousTemplate

            return result
        } catch (error) {
            this.#currentTemplate = null // Reset on error
            console.error("[STE] Main render error:", error)
            throw new Error(`Template rendering failed for ${filePath}: ${error.message}`)
        }
    }

    /**
     * Reads a template file from the base directory
     * @private
     */
    async #readFile(filePath) {
        try {
            const resolvedPath = await this.#resolvePath(filePath)

            const { readFile } = await import("node:fs/promises")
            const content = await readFile(resolvedPath, "utf8")

            return content
        } catch (error) {
            console.error("[STE] File reading error:", error)
            throw new Error(`File reading failed: ${error.message}`)
        }
    }

    /**
     * Renders a template without restoring HTML variable content.
     * Internal method used for template processing and includes.
     *
     * @private
     * @param {string} filePath - Path to the template file
     * @param {Object} data - Data object containing template variables
     * @returns {Promise<string>} The rendered template content
     */
    async renderStringWithoutRestore(filePath, data) {
        try {
            const content = await this.#readFile(filePath)

            // Push the template onto the include stack AFTER reading the file
            this.#includeStack.push(filePath)

            // Process any html_ variables in the data
            // Add null check {} to prevent error if no data object is initialized
            for (const [key, value] of Object.entries(data || {})) {
                if (key.startsWith("html_") && !this.htmlVars.has(key)) {
                    const marker = `__HTML_${Math.random().toString(36).substring(2, 11)}__`
                    this.htmlVars.set(key, { marker, value })
                    data[key] = marker
                }
            }

            // Process template
            let processed = content
            processed = await this.#processExpressions(processed, data)

            // Pop the template from the include stack when done
            this.#includeStack.pop()

            return processed
        } catch (error) {
            // Make sure to pop from the stack even if there's an error
            if (this.#includeStack.includes(filePath)) {
                this.#includeStack.pop()
            }
            console.error("[STE] Render error:", error)
            throw new Error(`Template rendering failed for ${filePath}: ${error.message}`)
        }
    }

    /**
     * Processes expressions using tokenizer/parser/evaluator
     * @private
     */
    async #processExpressions(content, data) {
        try {
            const tokenizer = new Tokenizer(content)
            const tokens = tokenizer.scanTokens()

            const parser = new Parser(tokens)
            const ast = parser.parse()

            const evaluator = new Evaluator(data, this) // 'this' → template engine reference

            const result = await evaluator.evaluate(ast)
            return result
        } catch (error) {
            throw new Error(`Expression processing failed: ${error.message}`)
        }
    }

    /**
     * Clears both the template cache and HTML variables cache.
     * Useful when templates or HTML content need to be reloaded.
     *
     * @public
     */
    clearCache() {
        this.#templateCache.clear()
        this.htmlVars.clear() // Clear HTML variables cache too
    }

    /**
     * Removes a specific template from the cache.
     * Allows selective cache clearing when only certain templates change.
     *
     * @public
     * @param {string} template - The template path to remove from cache
     */
    removeFromCache(template) {
        this.#templateCache.delete(template)
    }
}

import { readFileSync, existsSync } from "node:fs"
import { join, dirname, basename, sep, extname } from "node:path"

import { FRONTMATTER_DELIMITER } from "./constants.js"
import { HeadingProcessor } from "./HeadingProcessor.js"
import { FrontmatterParser } from "./FrontmatterParser.js"
import { CodeBlockProcessor } from "./CodeBlockProcessor.js"

/**
 * The `MarkdownProcessor` class is responsible for processing markdown files. It handles loading a markdown file, 
 * extracting and parsing frontmatter, processing the main content by converting markdown headings to HTML,
 * adding IDs to headings, and reinserting code blocks. 
 */
export class MarkdownProcessor {
  /**
   * Constructs a new instance of the `MarkdownProcessor`.
   * 
   * @param {string} [baseDir="views"] - The base directory to look for markdown files.
   */
  constructor(baseDir = "views") {
    this.baseDir = baseDir
  }

  /**
   * Processes a markdown file by loading it, extracting frontmatter, processing the content, 
   * and returning an object containing metadata and processed content.
   * 
   * @param {string} filePath - The relative path to the markdown file to process.
   * @returns {object} - An object containing the processed frontmatter, content, and file metadata.
   * @throws {Error} - If the file doesn't exist.
   */
  processFile(filePath) {
    const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath
    const fullPath = join(this.baseDir, normalizedPath)

    // Check if the file exists
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    // Read the file content
    const content = readFileSync(fullPath, "utf8")

    // Split the content into frontmatter and main content
    const { frontmatter, mainContent } = this.splitContent(content)

    // Process the main content (convert markdown headings to HTML, add IDs, reinsert code blocks)
    const processedContent = this.processContent(mainContent)

    return {
      frontmatter,
      content: processedContent,
      filePath: fullPath.split(sep).join("/"),
      fileDir: dirname(normalizedPath).split(sep).join("/"),
      fileName: basename(normalizedPath),
      fileBaseName: basename(normalizedPath, extname(normalizedPath)),
    }
  }

  /**
   * Splits the given content into frontmatter and main content. 
   * Frontmatter is expected to be delimited by `---`.
   * 
   * @param {string} content - The raw markdown content of the file.
   * @returns {object} - An object containing the parsed frontmatter and the main content.
   */
  splitContent(content) {
    const lines = content.split("\n")
    const frontmatterLines = []
    let mainContentStart = 0
    let inFrontmatter = false

    // Iterate through lines to separate frontmatter and main content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (line === FRONTMATTER_DELIMITER) {
        if (!inFrontmatter) {
          inFrontmatter = true
        } else {
          mainContentStart = i + 1
          break
        }
      } else if (inFrontmatter) {
        frontmatterLines.push(line)
      }
    }

    // Return an object with parsed frontmatter and main content
    return {
      frontmatter: FrontmatterParser.parse(frontmatterLines),
      mainContent: lines.slice(mainContentStart).join("\n").trim(),
    }
  }

  /**
   * Processes the content by converting markdown headings into HTML, adding IDs to headings, 
   * and reinserting any code blocks that were replaced with placeholders.
   * 
   * @param {string} content - The main content of the markdown file.
   * @returns {string} - The processed content with HTML headings and code blocks reintegrated.
   */
  processContent(content) {
    // Extract code blocks and replace them with placeholders
    const { processedContent, codeBlocks } = CodeBlockProcessor.extract(content)

    // Convert markdown-style headings into HTML headings
    const withHtmlHeadings = HeadingProcessor.transformToHtml(processedContent)

    // Add IDs to the headings
    const withHeadingIds = HeadingProcessor.addIds(withHtmlHeadings)

    // Reinsert code blocks back into the content
    return CodeBlockProcessor.reinsert(withHeadingIds, codeBlocks)
  }
}

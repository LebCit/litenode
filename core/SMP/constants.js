/**
 * The delimiter used to separate frontmatter metadata in a document.
 * Typically found at the top of markdown files to enclose YAML metadata.
 *
 * @constant {string}
 */
export const FRONTMATTER_DELIMITER = "---"

/**
 * A placeholder string used to mark the location of code blocks in the document.
 * This can be replaced or processed with actual code block content during rendering.
 *
 * @constant {string}
 */
export const CODEBLOCK_PLACEHOLDER = "{{CODE_BLOCK_}}"

/**
 * The separator used to generate unique IDs for headings in a document.
 * It is used to replace spaces and other characters in heading texts to form an ID.
 *
 * @constant {string}
 */
export const HEADING_ID_SEPARATOR = "-"

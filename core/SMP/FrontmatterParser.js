import { validators } from "./utils/validators.js"

/**
 * A robust parser for YAML-like frontmatter content that handles nested structures,
 * arrays, and multiple value types (strings, numbers, booleans, dates).
 *
 * Features:
 * - Supports nested objects via indentation
 * - Auto-detects and converts value types
 * - Handles simple arrays with mixed content
 * - Provides detailed error reporting
 */
export class FrontmatterParser {
    static _ERRORS = {
        INVALID_INPUT: "Input must be an array of strings",
        EMPTY_CONTENT: "Empty frontmatter content",
        INVALID_ARRAY: "Invalid array format",
        MISSING_VALIDATOR: "Missing required validator function:",
    }

    /**
     * Parses lines of frontmatter content into a structured object.
     * Supports both YAML and JSON-like syntax including:
     * - Key-value pairs
     * - Nested objects
     * - Arrays (both bracket-style and hyphen-style)
     * - Multiple value types (strings, numbers, booleans, dates)
     *
     * @param {string[]} lines - Lines to parse (e.g., from file.split('\n'))
     * @returns {Object} Parsed frontmatter object
     * @throws {Error} When parsing fails with context about the error
     * @example
     * const fm = FrontmatterParser.parse([
     *   'title: Hello World',
     *   'tags: [js, yaml]',
     *   'fruits:',
     *   '  - apple',
     *   '  - banana'
     * ]);
     */
    static parse(lines) {
        this._validateInput(lines)
        this._validateValidators()

        const result = {}
        const stack = new NestedStack(result)

        try {
            for (let i = 0; i < lines.length; i++) {
                const nextLine = i + 1 < lines.length ? lines[i + 1] : null
                this._processLine(lines[i], stack, i + 1, nextLine)
            }
        } catch (error) {
            throw new Error(`Frontmatter parsing failed: ${error.message}`)
        }

        return result
    }

    /**
     * Processes a single line of frontmatter content
     * @private
     * @param {string} line - Line to process
     * @param {NestedStack} stack - Current parsing stack
     * @param {number} lineNumber - For error reporting
     * @param {string|null} nextLine - The next line in the input (used for array detection)
     */
    static _processLine(line, stack, lineNumber, nextLine) {
        if (this._shouldSkipLine(line)) return

        const { indent, trimmedLine } = this._parseLineIndentation(line)
        stack.adjustToIndent(indent)

        if (trimmedLine.startsWith("- ")) {
            this._processArrayItem(trimmedLine, stack, lineNumber)
        } else if (trimmedLine.includes(":")) {
            this._processKeyValueLine(trimmedLine, stack, lineNumber, nextLine)
        }
    }

    /**
     * Processes a YAML array item (lines starting with "- ")
     * @private
     * @param {string} line - Line starting with array marker
     * @param {NestedStack} stack - Current parsing stack
     * @param {number} lineNumber - For error reporting
     * @throws {Error} When array items appear without a parent key
     */
    static _processArrayItem(line, stack, lineNumber) {
        const itemContent = line.slice(2).trim()

        try {
            if (!stack.currentArray) {
                // Check if we're at the root level
                if (stack.stack.length === 1) {
                    throw new Error("Root level arrays need explicit key")
                }

                // Convert the last assigned key to an array
                const lastKey = Object.keys(stack.currentObj).pop()
                if (!lastKey) {
                    throw new Error("Array items must belong to a key")
                }

                stack.currentObj[lastKey] = []
                stack.currentArray = stack.currentObj[lastKey]
            }

            stack.currentArray.push(this._parseValue(itemContent))
        } catch (error) {
            throw new Error(`Line ${lineNumber}: ${error.message}`)
        }
    }

    /**
     * Processes a key-value pair line
     * @private
     * @param {string} line - Trimmed line containing "key: value"
     * @param {NestedStack} stack - Current parsing stack
     * @param {number} lineNumber - For error context
     * @param {string|null} nextLine - The next line in the input (used for array detection)
     * @throws {Error} When value parsing fails
     */
    static _processKeyValueLine(line, stack, lineNumber, nextLine) {
        const [key, ...valueParts] = line.split(":")
        const trimmedKey = key.trim()
        const rawValue = valueParts.join(":").trim()

        if (!trimmedKey) return

        try {
            if (rawValue === "" || rawValue.endsWith(":")) {
                // Check if the next line starts with array syntax
                if (nextLine && nextLine.trim().startsWith("- ")) {
                    // Initialize as array
                    stack.currentObj[trimmedKey] = []
                    stack.currentArray = stack.currentObj[trimmedKey]
                } else {
                    // Otherwise create a nested object
                    stack.pushNewObject(trimmedKey)
                }
            } else {
                const parsedValue = this._parseValue(rawValue, trimmedKey)
                stack.setCurrentValue(trimmedKey, parsedValue)
            }
        } catch (error) {
            throw new Error(`Line ${lineNumber}: ${error.message}`)
        }
    }

    /**
     * Parses a value into appropriate JavaScript type
     * @private
     * @param {string} value - Value to parse
     * @param {string} key - Context key for error reporting
     * @returns {any} Parsed value (string|number|boolean|Date|Array)
     */
    static _parseValue(value, key) {
        if (value == null) return value
        value = value.trim()

        if (validators.isArray(value)) {
            return this._parseArrayValue(value, key)
        }
        return this._parsePrimitiveValue(value)
    }

    /**
     * Parses array values in format "[item1, item2]". Supports:
     * - Unquoted strings: [a, b]
     * - Quoted strings: ["a", "b"]
     * - Numbers: [1, 2]
     * - Mixed: [1, "a", true]
     * @private
     * @param {string} arrayValue - The array string to parse
     * @param {string} key - Context key for errors
     * @returns {Array} Parsed array
     * @throws {Error} On malformed arrays
     */
    static _parseArrayValue(arrayValue, key) {
        try {
            const arrayContent = arrayValue.slice(1, -1).trim()
            if (!arrayContent) return []

            return arrayContent
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
                .map((item) => this._parseArrayItem(item))
        } catch (error) {
            throw new Error(`${this._ERRORS.INVALID_ARRAY} for key '${key}': ${arrayValue}`)
        }
    }

    /**
     * Parses an individual array item
     * @private
     * @param {string} item - The array item to parse
     * @returns {any} Parsed item value
     */
    static _parseArrayItem(item) {
        // Handle empty quoted strings
        if (item === '""' || item === "''") return ""

        if (validators.isQuotedString(item)) {
            return this._parseQuotedString(item)
        }
        if (validators.isNumber(item)) {
            return parseFloat(item)
        }
        return item // Return as-is for unquoted strings
    }

    /**
     * Parses primitive values (string, number, boolean, date)
     * @private
     * @param {string} value - Value to parse
     * @returns {any} Parsed value
     */
    static _parsePrimitiveValue(value) {
        if (validators.isQuotedString(value)) {
            return this._parseQuotedString(value)
        }
        if (validators.isNumber(value)) {
            return parseFloat(value)
        }
        if (validators.isBoolean(value)) {
            return value.toLowerCase() === "true"
        }
        if (validators.isValidDate(value)) {
            return new Date(value)
        }
        return value
    }

    /**
     * Parses quoted strings and handles basic escaping
     * @private
     * @param {string} value - Quoted string (e.g., '"hello"')
     * @returns {string} Unquoted and unescaped string
     */
    static _parseQuotedString(value) {
        const unquoted = value.slice(1, -1)
        return unquoted.replace(/\\"/g, '"').replace(/\\'/g, "'")
    }

    /**
     * Validates the input lines array
     * @private
     * @param {any} lines - Input to validate
     * @throws {Error} When input is invalid
     */
    static _validateInput(lines) {
        if (!Array.isArray(lines)) {
            throw new Error(this._ERRORS.INVALID_INPUT)
        }
        if (lines.length === 0) {
            throw new Error(this._ERRORS.EMPTY_CONTENT)
        }
    }

    /**
     * Verifies all required validator functions exist
     * @private
     * @throws {Error} When any validator is missing
     */
    static _validateValidators() {
        const requiredValidators = ["isArray", "isQuotedString", "isNumber", "isBoolean", "isValidDate"]

        for (const validator of requiredValidators) {
            if (typeof validators[validator] !== "function") {
                throw new Error(`${this._ERRORS.MISSING_VALIDATOR} ${validator}`)
            }
        }
    }

    /**
     * Determines if a line should be skipped (comments or empty lines)
     * @private
     * @param {string} line - Line to check
     * @returns {boolean} True if line should be skipped
     */
    static _shouldSkipLine(line) {
        //return line.startsWith("#") || !line.trim()
        return (line.startsWith("#") || !line.trim()) && !line.trim().startsWith("- ")
    }

    /**
     * Extracts indentation info from a line
     * @private
     * @param {string} line - Line to parse
     * @returns {{indent: number, trimmedLine: string}}
     */
    static _parseLineIndentation(line) {
        const trimmedLine = line.trim()
        const indent = line.length - line.trimStart().length
        return { indent, trimmedLine }
    }
}

/**
 * Helper class for managing nested object hierarchy during parsing
 * @private
 */
class NestedStack {
    /**
     * Creates a new NestedStack instance
     * @param {Object} rootObj - The root object to start with
     */
    constructor(rootObj) {
        this.stack = [{ obj: rootObj, indent: -1 }]
        this.currentArray = null
        this.currentKey = null
    }

    /**
     * Gets the current working object
     * @returns {Object} Current object in stack
     */
    get currentObj() {
        return this.stack[this.stack.length - 1].obj
    }

    /**
     * Gets the most recently used key in the current object
     * @returns {string|null} The current key or null if none
     */
    getCurrentKey() {
        return this.currentKey
    }

    /**
     * Sets a value in the current object and updates context
     * @param {string} key - The key to set
     * @param {any} value - The value to assign
     */
    setCurrentValue(key, value) {
        this.currentKey = key
        this.currentArray = null // Reset array context when setting a new value
        this.currentObj[key] = value
    }

    /**
     * Adjusts stack based on indentation level
     * @param {number} indent - Current line's indentation
     */
    adjustToIndent(indent) {
        while (indent <= this.stack[this.stack.length - 1].indent) {
            this.stack.pop()
            this.currentArray = null // Reset array context when popping stack
        }
    }

    /**
     * Creates and pushes a new nested object
     * @param {string} key - Key to assign the new object
     */
    pushNewObject(key) {
        const newObj = {}
        this.currentKey = key
        this.currentArray = null // Reset array context when creating new object
        this.currentObj[key] = newObj
        this.stack.push({ obj: newObj, indent: this._getCurrentIndent() + 1 })
    }

    /**
     * Gets current indentation level
     * @private
     * @returns {number} Current indent
     */
    _getCurrentIndent() {
        return this.stack[this.stack.length - 1].indent
    }
}

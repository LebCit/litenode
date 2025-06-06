// Common helper function for handling nested property access
const getNestedValue = (obj, path) => {
    // Handle empty or null path
    if (!path) return obj

    // Parse the path into segments handling both dot and bracket notation
    const segments = []
    let current = ""
    let inBracket = false

    for (let i = 0; i < path.length; i++) {
        const char = path[i]

        if (char === "[" && !inBracket) {
            if (current) segments.push(current)
            current = ""
            inBracket = true
        } else if (char === "]" && inBracket) {
            // Handle both quoted and unquoted keys in brackets
            const trimmed = current.trim()
            segments.push(trimmed.startsWith('"') || trimmed.startsWith("'") ? trimmed.slice(1, -1) : trimmed)
            current = ""
            inBracket = false
        } else if (char === "." && !inBracket) {
            if (current) segments.push(current)
            current = ""
        } else {
            current += char
        }
    }

    if (current) segments.push(current)

    // Navigate the object using the parsed segments
    return segments.reduce((value, segment) => value?.[segment], obj)
}

// Common validation function for array input
const validateArrayInput = (array, filterName) => {
    if (!Array.isArray(array)) {
        throw new Error(`${filterName} filter expects an array as input`)
    }
}

//Store generators at module level
const cycleGenerators = new Map()
let cycleCounter = 0

const cycle = (_, ...values) => {
    // Validate input
    if (values.length < 1) {
        throw new Error("cycle filter requires at least one value")
    }

    // Create a stable ID for this cycle generator
    const id = `cycle_${cycleCounter++}`

    // Store values and initial index
    cycleGenerators.set(id, {
        values: values,
        currentIndex: -1,
        next: function () {
            this.currentIndex = (this.currentIndex + 1) % this.values.length
            return this.values[this.currentIndex]
        },
    })

    return id
}

const next = (value) => {
    const generator = cycleGenerators.get(value)
    if (!generator) {
        throw new Error(`No cycle found for ID: ${value}`)
    }
    return generator.next()
}

function getTimezoneOffsetString(date) {
    const offset = -date.getTimezoneOffset()
    const sign = offset >= 0 ? "+" : "-"
    const absOffset = Math.abs(offset)
    const hours = String(Math.floor(absOffset / 60)).padStart(2, "0")
    const minutes = String(absOffset % 60).padStart(2, "0")
    return `${sign}${hours}:${minutes}`
}

export const builtInFilters = {
    cycle,
    next,

    abs: (value) => {
        const number = Number(value)
        if (isNaN(number)) {
            throw new Error(`abs filter expects a number, but got ${typeof value}`)
        }
        return Math.abs(number)
    },

    capitalize: (value) => {
        if (typeof value !== "string") {
            throw new Error(`capitalize filter expects a string, but got ${typeof value}`)
        }
        return String(value).charAt(0).toUpperCase() + String(value).slice(1)
    },

    currency: (value, symbol = "$") => {
        const number = Number(value)
        if (isNaN(number)) {
            throw new Error(`currency filter expects a number, but got ${typeof value}`)
        }
        return `${number.toFixed(2)} ${symbol}`
    },

    dateFormat: (value, format = "YYYY-MM-DD", useUTC = true, locale = {}) => {
        if (value === null || value === undefined) return ""

        const date = new Date(value)
        if (isNaN(date.getTime())) return `Invalid date: ${value}`

        // Getters
        const getYear = useUTC ? () => date.getUTCFullYear() : () => date.getFullYear()
        const getMonth = useUTC ? () => date.getUTCMonth() : () => date.getMonth()
        const getDay = useUTC ? () => date.getUTCDate() : () => date.getDate()
        const getHours = useUTC ? () => date.getUTCHours() : () => date.getHours()
        const getMinutes = useUTC ? () => date.getUTCMinutes() : () => date.getMinutes()
        const getSeconds = useUTC ? () => date.getUTCSeconds() : () => date.getSeconds()
        const getDayOfWeek = useUTC ? () => date.getUTCDay() : () => date.getDay()

        const year = getYear()
        const month = getMonth() + 1
        const day = getDay()
        const hours = getHours()
        const minutes = getMinutes()
        const seconds = getSeconds()
        const dayOfWeek = getDayOfWeek()
        const ampm = hours >= 12 ? "PM" : "AM"
        const timezoneOffset = useUTC ? "+00:00" : getTimezoneOffsetString(date)

        // Fallback to default English if no locale is provided
        const defaultLocale = {
            monthNames: [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ],
            monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            weekdayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            weekdayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        }

        const loc = {
            ...defaultLocale,
            ...locale,
        }

        // Replacements map
        const replacements = {
            YYYY: String(year),
            yyyy: String(year),
            YY: String(year).slice(-2),
            yy: String(year).slice(-2),

            MMMM: loc.monthNames[getMonth()],
            MMM: loc.monthNamesShort[getMonth()],
            mmmm: loc.monthNames[getMonth()],
            mmm: loc.monthNamesShort[getMonth()],

            MM: String(month).padStart(2, "0"),
            M: String(month),

            DD: String(day).padStart(2, "0"),
            D: String(day),
            dd: String(day).padStart(2, "0"),
            d: String(day),

            dddd: loc.weekdayNames[dayOfWeek],
            ddd: loc.weekdayNamesShort[dayOfWeek],

            HH: String(hours).padStart(2, "0"),
            H: String(hours),
            hh: String(hours).padStart(2, "0"),
            h: String(hours),

            mm: String(minutes).padStart(2, "0"),
            m: String(minutes),

            ss: String(seconds).padStart(2, "0"),
            s: String(seconds),

            A: ampm,
            a: ampm.toLowerCase(),

            Z: timezoneOffset,
        }

        // Use regex to match all supported tokens
        return format.replace(
            /YYYY|yyyy|YY|yy|MMMM|mmmm|mmm|MM|M|DD|D|dd|d|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a|Z/g,
            (match) => replacements[match] ?? match
        )
    },

    defaults: (value, ...fallbacks) => {
        // Helper to check if a value is truthy
        // (eliminates all falsy values: false, 0, "", null, undefined, NaN)
        const isTruthy = (val) => Boolean(val)

        // If value is truthy, return it
        if (isTruthy(value)) {
            return value
        }

        // Look for first truthy fallback
        const validFallback = fallbacks.find(isTruthy)
        return validFallback !== undefined ? validFallback : ""
    },

    dump: (value) => `<pre>${JSON.stringify(value, null, 2)}</pre>`,

    escape: (value) => {
        if (typeof value !== "string") {
            throw new Error(`escape filter expects a string, but got ${typeof value}`)
        }
        return String(value)
            .replace(/&/g, "&amp;amp;") // Double-escape & first
            .replace(/</g, "&amp;lt;") // Then escape < with &amp;lt;
            .replace(/>/g, "&amp;gt;") // Then escape > with &amp;gt;
            .replace(/"/g, "&amp;quot;") // Then escape " with &amp;quot;
            .replace(/'/g, "&amp;#39;") // Then escape ' with &amp;#39;
    },

    fileSize: (bytes) => {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
        if (bytes === 0) return "0 Byte"
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
        return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i]
    },

    first: (value) => {
        if (!Array.isArray(value) && typeof value !== "string") {
            throw new Error(`first filter expects an array or string, but got ${typeof value}`)
        }
        return Array.isArray(value) ? value[0] : String(value).charAt(0)
    },

    groupBy: (array, key) => {
        validateArrayInput(array, "groupBy")
        return array.reduce((acc, item) => {
            const groupKey = getNestedValue(item, key)
            if (!acc[groupKey]) acc[groupKey] = []
            acc[groupKey].push(item)
            return acc
        }, {})
    },

    has: (value, search) => {
        // Helper function for recursive search
        const recursiveSearch = (obj, searchKey) => {
            // Base cases
            if (obj === null || typeof obj !== "object") {
                return false
            }

            // Check if the current object has the key directly
            if (Object.prototype.hasOwnProperty.call(obj, searchKey)) {
                return true
            }

            // Recursive case - search in all values
            return Object.values(obj).some((val) => {
                if (Array.isArray(val)) {
                    // For arrays, check each element
                    return val.some((item) => recursiveSearch(item, searchKey))
                } else if (typeof val === "object" && val !== null) {
                    // For objects, recurse
                    return recursiveSearch(val, searchKey)
                }
                return false
            })
        }

        try {
            // Handle null or undefined
            if (value == null) {
                return false
            }

            // Handle objects
            if (typeof value === "object" && !Array.isArray(value)) {
                // 1. First check if it's a direct key (fastest)
                if (Object.prototype.hasOwnProperty.call(value, search)) {
                    return true
                }

                // 2. If not found as direct key and search contains dots, try path traversal
                if (typeof search === "string" && search.includes(".")) {
                    const parts = search.split(".")
                    let current = value

                    for (let i = 0; i < parts.length; i++) {
                        // Check for dotted key at each level
                        const remainingPath = parts.slice(i).join(".")
                        if (Object.prototype.hasOwnProperty.call(current, remainingPath)) {
                            return true
                        }

                        // Try to traverse one level deeper
                        if (!Object.prototype.hasOwnProperty.call(current, parts[i])) {
                            break // Break to fall through to recursive search
                        }
                        current = current[parts[i]]
                    }
                }

                // 3. If still not found, try recursive search
                return recursiveSearch(value, search)
            }

            // Handle arrays
            if (Array.isArray(value)) {
                // First try direct includes
                if (value.includes(search)) {
                    return true
                }
                // Then try recursive search on each element
                return value.some((item) => typeof item === "object" && item !== null && recursiveSearch(item, search))
            }

            // Handle strings
            if (typeof value === "string") {
                return value.includes(search)
            }

            return false
        } catch (error) {
            console.error("Error in has filter:", error)
            return false
        }
    },

    int: (value) => {
        const number = parseInt(value, 10)
        if (isNaN(number)) {
            throw new Error(`int filter expects a number, but got ${typeof value}`)
        }
        return number
    },

    join: (array, separator = ", ", finalSeparator = null) => {
        validateArrayInput(array, "join")

        // Handle empty array and single item cases
        if (array.length <= 1) {
            return array.join("")
        }

        // If no finalSeparator is provided, use the regular separator throughout
        if (finalSeparator === null) {
            return array.join(separator)
        }

        // If finalSeparator is provided, use it for the last item
        if (array.length === 2) {
            return array.join(finalSeparator)
        }

        return array.slice(0, -1).join(separator) + finalSeparator + array.slice(-1)
    },

    last: (value) => {
        if (!Array.isArray(value) && typeof value !== "string") {
            throw new Error(`last filter expects an array or string, but got ${typeof value}`)
        }
        return Array.isArray(value) ? value[value.length - 1] : String(value).slice(-1)
    },

    length: (value) => {
        if (!Array.isArray(value) && typeof value !== "object" && typeof value !== "string") {
            throw new Error(`length filter expects an array, object, or string, but got ${typeof value}`)
        }
        return Array.isArray(value)
            ? value.length
            : typeof value === "object"
            ? Object.keys(value).length
            : String(value).length
    },

    log: (value, label = "Template Debug") => {
        console.log(`${label}:`, value)
        return value
    },

    lowercase: (value) => {
        if (typeof value !== "string") {
            throw new Error(`lowercase filter expects a string, but got ${typeof value}`)
        }
        return String(value).toLowerCase()
    },

    numberFormat: (value, decimals = 0) => {
        const number = Number(value)
        if (isNaN(number)) {
            throw new Error("numberFormat filter expects a number")
        }
        const suffixes = ["", "K", "M", "B", "T"]
        const suffixNum = Math.floor(("" + parseInt(number)).length / 3)
        let shortValue = parseFloat(
            (suffixNum !== 0 ? number / Math.pow(1000, suffixNum) : number).toPrecision(decimals + 1)
        )
        if (shortValue % 1 !== 0) {
            shortValue = shortValue.toFixed(decimals)
        }
        return shortValue + suffixes[suffixNum]
    },

    preserveSpaces: (value) => {
        // Handle null/undefined gracefully
        if (value == null) return ""

        // Convert to string and handle non-string inputs gracefully
        const str = String(value)

        return str.replace(/\s/g, "&nbsp;") // Replace all spaces with &nbsp;
    },

    range: (value, lower, upper, inclusive = false) => {
        // Convert the input value to a number
        const number = Number(value)
        if (isNaN(number)) {
            throw new Error(`range filter expects a number, but got ${typeof value}`)
        }

        // Validate the range
        if (lower > upper) {
            throw new Error(`Invalid range: lower bound (${lower}) cannot be greater than upper bound (${upper})`)
        }

        // Check if the number is within the range
        if (inclusive) {
            return number >= lower && number <= upper
        } else {
            return number > lower && number < upper
        }
    },

    removeSpaces: (value) => {
        if (typeof value !== "string") {
            throw new Error(`removeSpaces filter expects a string, but got ${typeof value}`)
        }
        return value.replace(/\s+/g, "") // Removes all spaces, including newlines, tabs, etc.
    },

    replace: (value, search, replacement) => {
        if (typeof value !== "string") {
            throw new Error(`replace filter expects a string, but got ${typeof value}`)
        }
        return String(value).replace(new RegExp(search, "g"), replacement)
    },

    reverse: (value) => {
        if (!Array.isArray(value) && typeof value !== "string") {
            throw new Error(`reverse filter expects an array or string, but got ${typeof value}`)
        }
        return Array.isArray(value) ? value.reverse() : String(value).split("").reverse().join("")
    },

    round: (value, precision = 0) => {
        const number = Number(value)
        if (isNaN(number)) {
            throw new Error(`round filter expects a number, but got ${typeof value}`)
        }
        return number.toFixed(precision)
    },

    safeStringify: (value, indent = 2) => {
        const seen = new WeakSet()
        return JSON.stringify(
            value,
            (key, value) => {
                if (typeof value === "object" && value !== null) {
                    if (seen.has(value)) {
                        return "[Circular]"
                    }
                    seen.add(value)
                }
                return value
            },
            indent
        )
    },

    slugify: (value) => {
        if (typeof value !== "string") {
            throw new Error("slugify filter expects a string")
        }
        return value
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "")
    },

    sortBy: (array, key, order = "asc") => {
        validateArrayInput(array, "sortBy")

        // If order is an array, create a custom sort order map
        const orderMap = Array.isArray(order) ? Object.fromEntries(order.map((item, index) => [item, index])) : null

        return [...array].sort((a, b) => {
            const aVal = getNestedValue(a, key)
            const bVal = getNestedValue(b, key)

            // Handle custom sort order
            if (orderMap !== null) {
                const aIndex = orderMap[aVal] ?? Infinity
                const bIndex = orderMap[bVal] ?? Infinity
                return aIndex - bIndex
            }

            // Handle regular ascending/descending sort
            if (order === "desc") {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        })
    },

    sortByDate: (array, key, order = "asc") => {
        validateArrayInput(array, "sortByDate")

        return [...array].sort((a, b) => {
            const aDate = new Date(getNestedValue(a, key))
            const bDate = new Date(getNestedValue(b, key))

            if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
                throw new Error(`Invalid date found in key: ${key}`)
            }

            return order === "desc" ? bDate.getTime() - aDate.getTime() : aDate.getTime() - bDate.getTime()
        })
    },

    timeAgo: (value) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
            throw new Error("timeAgo filter expects a valid date")
        }
        const seconds = Math.floor((new Date() - date) / 1000)
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1,
        }
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit)
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`
            }
        }
        return "just now"
    },

    toLink: (value, displayText, external = false, safe = false) => {
        if (typeof value !== "string" || typeof displayText !== "string") {
            throw new Error(`toLink expects two string arguments: URL and display text`)
        }

        // Escape the URL and display text to prevent XSS
        const escapedUrl = value.replace(
            /[&<>"']/g,
            (match) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                }[match])
        )

        const escapedText = displayText.replace(
            /[&<>"']/g,
            (match) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                }[match])
        )

        // Determine the attributes for the <a> tag
        let attributes = ""
        if (external) {
            attributes = 'target="_blank"'
            if (safe) {
                attributes += ' rel="external noopener noreferrer"'
            }
        }

        // Return the <a> tag with appropriate attributes
        return `<a href="${escapedUrl}" ${attributes}>${escapedText}</a>`
    },

    trim: (value) => {
        if (typeof value !== "string") {
            throw new Error(`trim filter expects a string, but got ${typeof value}`)
        }
        return String(value).trim()
    },

    truncate: (value, length = 50) => {
        if (typeof value !== "string") {
            throw new Error(`truncate filter expects a string, but got ${typeof value}`)
        }
        return String(value).length > length ? String(value).slice(0, length) + "..." : value
    },

    truncateWords: (value, wordCount = 10, suffix = "...") => {
        if (typeof value !== "string") {
            throw new Error("truncateWords filter expects a string")
        }
        const words = value.split(/\s+/)
        if (words.length <= wordCount) return value
        return words.slice(0, wordCount).join(" ") + suffix
    },

    type: (value) => {
        if (Array.isArray(value)) return "array"
        return typeof value
    },

    uppercase: (value) => {
        if (typeof value !== "string") {
            throw new Error(`uppercase filter expects a string, but got ${typeof value}`)
        }
        return String(value).toUpperCase()
    },

    where: (array, key, value) => {
        validateArrayInput(array, "where")
        return array.filter((item) => getNestedValue(item, key) === value)
    },

    wordCount: (value) => {
        if (typeof value !== "string") {
            throw new Error(`wordCount filter expects a string, but got ${typeof value}`)
        }
        return String(value).split(/\s+/).filter(Boolean).length
    },
}

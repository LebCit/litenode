/**
 * Parse cookie string and return an object with all cookies
 * @param {string} cookieString - The cookie header string to parse
 * @returns {Object} Object containing all cookies as key-value pairs
 */
export function parseCookies(cookieString) {
    const cookies = {}
    if (!cookieString) return cookies

    cookieString.split(";").forEach((cookie) => {
        const parts = cookie.split("=")
        const name = parts[0].trim()
        // Handle cookies without values (flags) and properly decode values
        const value = parts.length > 1 ? decodeURIComponent(parts[1].trim()) : ""

        if (name) {
            cookies[name] = value
        }
    })

    return cookies
}

/**
 * Cookie parser middleware for LiteNode
 * Adds a cookies object to the request containing all parsed cookies
 */
export function cookieParser() {
    return (req, res) => {
        req.cookies = parseCookies(req.headers.cookie)
    }
}

/**
 * Serializes cookie options into a string
 * @param {Object} options - Cookie options
 * @returns {string} Serialized cookie options string
 */
function serializeCookieOptions(options) {
    const optionsArray = []

    if (options.maxAge) {
        optionsArray.push(`Max-Age=${options.maxAge}`)
    } else if (options.expires) {
        if (options.expires instanceof Date) {
            optionsArray.push(`Expires=${options.expires.toUTCString()}`)
        } else {
            optionsArray.push(`Expires=${options.expires}`)
        }
    }

    if (options.domain) {
        optionsArray.push(`Domain=${options.domain}`)
    }

    if (options.path) {
        optionsArray.push(`Path=${options.path}`)
    } else {
        // Default path to root if not specified
        optionsArray.push("Path=/")
    }

    if (options.secure) {
        optionsArray.push("Secure")
    }

    if (options.httpOnly) {
        optionsArray.push("HttpOnly")
    }

    if (options.sameSite) {
        optionsArray.push(`SameSite=${options.sameSite}`)
    }

    return optionsArray.join("; ")
}

/**
 * Extends the response object with cookie management methods
 * @param {Object} nativeRes - The native response object
 */
export function extendResponseWithCookies(nativeRes) {
    /**
     * Sets a cookie with the given name, value, and options
     *
     * @param {string} name - The name of the cookie
     * @param {string} value - The value of the cookie
     * @param {Object} options - Cookie options
     * @param {number} options.maxAge - Max age in seconds
     * @param {Date|string} options.expires - Expiration date
     * @param {string} options.path - Cookie path (defaults to '/')
     * @param {string} options.domain - Cookie domain
     * @param {boolean} options.secure - Secure flag
     * @param {boolean} options.httpOnly - HttpOnly flag
     * @param {string} options.sameSite - SameSite policy ('Strict', 'Lax', or 'None')
     * @returns {Object} The response object for chaining
     *
     * @example
     * // Set a simple cookie that expires in 1 hour
     * res.setCookie('session', 'abc123', { maxAge: 3600 });
     *
     * // Set a secure, http-only cookie
     * res.setCookie('auth', 'token', {
     *   maxAge: 86400,
     *   secure: true,
     *   httpOnly: true,
     *   sameSite: 'Strict'
     * });
     */
    nativeRes.setCookie = (name, value, options = {}) => {
        if (!name || name.length === 0) {
            throw new Error("Cookie name is required")
        }

        // Handle invalid characters in cookie name
        if (/[=,; \t\r\n\013\014]/.test(name)) {
            throw new Error("Cookie name contains invalid characters")
        }

        // Handle null or undefined value as empty string
        const stringValue = value != null ? value : ""

        // Encode the cookie value to handle special characters
        const encodedValue = encodeURIComponent(stringValue)

        // Build the cookie string
        let cookieString = `${name}=${encodedValue}`

        // Add options if any
        if (Object.keys(options).length > 0) {
            const serializedOptions = serializeCookieOptions(options)
            if (serializedOptions) {
                cookieString += `; ${serializedOptions}`
            }
        }

        // Set the cookie header
        const existingCookies = nativeRes.getHeader("Set-Cookie") || []
        const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies]

        nativeRes.setHeader("Set-Cookie", [...cookies, cookieString])

        return nativeRes // Allow chaining
    }

    /**
     * Gets the current value of cookie headers to be set
     *
     * @returns {Array} Array of cookie headers
     */
    nativeRes.getCookies = () => {
        return nativeRes.getHeader("Set-Cookie") || []
    }

    /**
     * Clears a cookie by setting its expiration in the past
     *
     * @param {string} name - The name of the cookie to clear
     * @param {Object} options - Cookie options (path and domain must match the original cookie)
     * @returns {Object} The response object for chaining
     *
     * @example
     * // Clear a cookie
     * res.clearCookie('session');
     *
     * // Clear a cookie with specific path/domain
     * res.clearCookie('auth', { path: '/api', domain: 'example.com' });
     */
    nativeRes.clearCookie = (name, options = {}) => {
        // To clear a cookie, set maxAge to 0 and expires to a past date
        const clearOptions = {
            ...options,
            expires: new Date(0), // Thu, 01 Jan 1970 00:00:00 GMT
            maxAge: 0,
        }

        return nativeRes.setCookie(name, "", clearOptions)
    }
}

/**
 * A simple signed cookie implementation using HMAC
 * @param {string} secret - The secret key used for signing
 * @returns {Object} Object with sign and verify methods
 */
export function createSignedCookies(secret) {
    if (!secret || typeof secret !== "string" || secret.length < 16) {
        throw new Error("A strong secret of at least 16 characters is required for signed cookies")
    }

    const sign = async (value) => {
        const { createHmac } = await import("node:crypto")
        const hmac = createHmac("sha256", secret)
        hmac.update(value)
        const signature = hmac.digest("base64")
        return `${value}.${signature}`
    }

    const verify = async (signedValue) => {
        if (!signedValue || !signedValue.includes(".")) return null

        const [value, signature] = signedValue.split(".")
        const { createHmac } = await import("node:crypto")
        const hmac = createHmac("sha256", secret)
        hmac.update(value)
        const expectedSignature = hmac.digest("base64")

        if (signature === expectedSignature) {
            return value
        }

        return null
    }

    return {
        /**
         * Signs a cookie value
         * @param {string} value - The value to sign
         * @returns {Promise<string>} The signed value
         */
        sign,

        /**
         * Verifies a signed cookie value
         * @param {string} signedValue - The signed value to verify
         * @returns {Promise<string|null>} The original value if signature is valid, null otherwise
         */
        verify,

        /**
         * Sets a signed cookie
         * @param {Object} res - The response object
         * @param {string} name - The cookie name
         * @param {string} value - The cookie value
         * @param {Object} options - Cookie options
         * @returns {Promise<Object>} The response object for chaining
         */
        async setCookie(res, name, value, options = {}) {
            const signedValue = await sign(value)
            return res.setCookie(name, signedValue, options)
        },

        /**
         * Gets and verifies a signed cookie
         * @param {Object} req - The request object
         * @param {string} name - The cookie name
         * @returns {Promise<string|null>} The original value if signature is valid, null otherwise
         */
        async getCookie(req, name) {
            const signedValue = req.cookies[name]
            if (!signedValue) return null
            return await verify(signedValue)
        },
    }
}

export const jsonHandler = (handlers) => async (req, res) => {
	let body = ""
	const contentType = req.headers["content-type"]

	const maxRequestSize = 1024 * 1024
	if (req.headers["content-length"] > maxRequestSize) {
		res.writeHead(413)
		return res.end("Request Entity Too Large")
	}

	req.on("data", (chunk) => {
		body += chunk.toString()
		if (body.length > maxRequestSize) {
			req.connection.destroy()
		}
	})

	req.on("end", async () => {
		try {
			let data
			if (/^application\/json/.test(contentType)) {
				data = JSON.parse(body)
			} else if (/^application\/x-www-form-urlencoded/.test(contentType)) {
				data = parseFormUrlEncoded(body)
			} else {
				res.writeHead(415)
				return res.end("Unsupported Media Type")
			}
			req.body = data
			await handlers[handlers.length - 1](req, res, data)
		} catch (error) {
			console.error("Error parsing data:", error)
			res.writeHead(400)
			res.end("Invalid data")
		}
	})
}

const parseFormUrlEncoded = (body) => {
	const params = new URLSearchParams(body)
	const data = {}

	for (const [key, value] of params.entries()) {
		assignNestedProperty(data, key, value)
	}

	return data
}

const assignNestedProperty = (obj, key, value) => {
	const keys = key.match(/[^[\]]+/g) // Split the key by [ and ] to get nested keys
	keys.reduce((acc, currentKey, index) => {
		if (index === keys.length - 1) {
			acc[currentKey] = value // Assign the value to the last key
		} else {
			acc[currentKey] = acc[currentKey] || {} // Create nested object if it doesn't exist
		}
		return acc[currentKey]
	}, obj)
}

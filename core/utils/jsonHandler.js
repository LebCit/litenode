export const jsonHandler = (handlers) => async (req, res) => {
	let body = ""
	const contentType = req.headers["content-type"]

	if (!/^application\/json/.test(contentType)) {
		res.writeHead(415)
		return res.end("Unsupported Media Type")
	}

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
			const data = JSON.parse(body)
			req.body = data
			await handlers[handlers.length - 1](req, res, data)
		} catch (error) {
			console.error("Error parsing JSON:", error)
			res.writeHead(400)
			res.end("Invalid JSON")
		}
	})
}

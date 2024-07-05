import { STE } from "../../STE/ste.js"
import { getContentType } from "../../utils/getContentType.js"

export function extendResponse(nativeRes) {
	nativeRes.redirect = (location, statusCode = 302) => {
		nativeRes.writeHead(statusCode, { Location: location })
		nativeRes.end()
	}

	nativeRes.txt = (text) => {
		nativeRes.setHeader("Content-Type", "text/plain")
		nativeRes.end(text)
	}

	nativeRes.json = (data) => {
		nativeRes.setHeader("Content-Type", "application/json")
		nativeRes.end(JSON.stringify(data))
	}

	nativeRes.sendFile = (filePath) => {
		try {
			const fileContents = readFileSync(filePath)
			const contentType = getContentType(filePath)
			nativeRes.setHeader("Content-Type", contentType)
			nativeRes.end(fileContents)
		} catch (err) {
			nativeRes.writeHead(500)
			nativeRes.end("Internal Server Error")
		}
	}

	nativeRes.render = async (template, data) => {
		try {
			const templateEngine = new STE("views")
			const html = await templateEngine.render(template, data)
			nativeRes.setHeader("Content-Type", "text/html")
			nativeRes.end(html)
		} catch (error) {
			nativeRes.writeHead(500)
			nativeRes.end(`Error rendering template: ${error.message}`)
		}
	}

	nativeRes.status = (code) => {
		nativeRes.statusCode = code
		return nativeRes
	}
}
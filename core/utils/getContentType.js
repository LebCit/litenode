export function getContentType(extname) {
	// Ensure the extension is in lowercase
	const lowerExtname = extname.toLowerCase()

	const contentTypeMap = {
		".css": "text/css",
		".js": "application/javascript",
		".mjs": "application/javascript",
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".avif": "image/avif",
		".svg": "image/svg+xml",
		".ico": "image/x-icon",
		".webp": "image/webp",
		".html": "text/html",
		".txt": "text/plain",
		".zip": "application/zip",
		".json": "application/json",
		".xml": "application/xml",
		".pdf": "application/pdf",
		".wav": "audio/wav",
		".mp3": "audio/mpeg",
		".mp4": "video/mp4",
		".webm": "video/webm",
		".ogg": "application/ogg",
	}

	return contentTypeMap[lowerExtname] || "application/octet-stream"
}

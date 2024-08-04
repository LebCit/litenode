export function getContentType(extname) {
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
	}
	return contentTypeMap[extname] || "application/octet-stream"
}

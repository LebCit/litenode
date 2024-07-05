export async function applyMiddleware(middlewareStack, nativeReq, nativeRes) {
	for (const middleware of middlewareStack) {
		await middleware(nativeReq, nativeRes)
		if (nativeRes.headersSent || nativeRes.finished) return
	}
}

import { extendResponse } from "./extendResponse.js"
import { applyMiddleware } from "./applyMiddleware.js"
import { findRouteHandler } from "./findRouteHandler.js"

export async function handleRequest(
	middlewareStack,
	routeNode,
	notFoundHandler,
	errorHandler,
	nativeReq,
	nativeRes,
	viewsDir
) {
	try {
		extendResponse(nativeRes, viewsDir)

		await applyMiddleware(middlewareStack, nativeReq, nativeRes)

		const { method, url } = nativeReq
		const queryDelimiter = url.indexOf("?")
		const routePath = queryDelimiter === -1 ? url : url.substring(0, queryDelimiter)

		const routeHandler = findRouteHandler(routeNode, method, routePath)

		if (!routeHandler) {
			if (notFoundHandler) {
				await notFoundHandler(nativeReq, nativeRes)
				return
			} else {
				nativeRes.writeHead(404)
				nativeRes.end("Route Not Found")
				return
			}
		}

		nativeReq.params = routeHandler.extractedParams
		nativeReq.queryParams = new URLSearchParams(queryDelimiter === -1 ? "" : url.substring(queryDelimiter))

		const routeHandlerFuncs = routeHandler.requestHandlers

		for (const handler of routeHandlerFuncs) {
			await handler(nativeReq, nativeRes)
			if (nativeRes.headersSent || nativeRes.finished) return
		}
	} catch (error) {
		console.error("Internal Server Error:", error)

		if (errorHandler) {
			await errorHandler(error, nativeReq, nativeRes)
			return
		} else {
			nativeRes.writeHead(500)
			nativeRes.end("Internal Server Error")
		}
	}
}

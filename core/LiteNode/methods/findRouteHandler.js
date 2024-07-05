export function findRouteHandler(routeNode, httpMethod, routePath) {
	let currentNode = routeNode
	let extractedParams = Object.create(null)
	let pathStart = 1
	const pathLength = routePath.length

	for (let pathEnd = 1; pathEnd <= pathLength; ++pathEnd) {
		if (pathEnd === pathLength || routePath[pathEnd] === "/") {
			const pathSegment = routePath.substring(pathStart, pathEnd)
			let nextNode = currentNode.children[pathSegment]

			while (!nextNode && currentNode.param) {
				nextNode = currentNode.param
				extractedParams[currentNode.param.paramName] = pathSegment
				pathStart = pathEnd + 1
			}

			if (!nextNode) return null

			currentNode = nextNode
			pathStart = pathEnd + 1
		}
	}

	if (!currentNode.handler[httpMethod]) return null

	return { requestHandlers: currentNode.handler[httpMethod], extractedParams }
}

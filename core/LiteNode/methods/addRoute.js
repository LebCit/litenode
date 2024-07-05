import { RouteNode } from "../RouteNode.js"

export function addRoute(routeNode, httpMethod, routePath, ...handlers) {
	let currentNode = routeNode
	let pathStart = 1,
		pathEnd = 1,
		pathLength = routePath.length

	for (; pathEnd <= pathLength; ++pathEnd) {
		if (pathEnd === pathLength || routePath[pathEnd] === "/") {
			let pathSegment = routePath.substring(pathStart, pathEnd)
			let nextNode

			if (pathSegment[0] === ":") {
				if (!currentNode.param) {
					currentNode.param = new RouteNode()
					currentNode.param.paramName = pathSegment.substring(1)
				}
				nextNode = currentNode.param
			} else {
				nextNode = currentNode.children[pathSegment] || (currentNode.children[pathSegment] = new RouteNode())
			}

			currentNode = nextNode
			pathStart = pathEnd + 1
		}
	}

	currentNode.handler[httpMethod] = handlers
}

import { RouteNode } from "../RouteNode.js"

export function mergeNodes(currentNode, nodeToMerge, middlewares = []) {
	for (const [method, handlers] of Object.entries(nodeToMerge.handler)) {
		currentNode.handler[method] = [...middlewares, ...handlers]
	}

	for (const [pathSegment, subNode] of Object.entries(nodeToMerge.children)) {
		if (!currentNode.children[pathSegment]) {
			currentNode.children[pathSegment] = new RouteNode()
		}
		mergeNodes(currentNode.children[pathSegment], subNode, middlewares)
	}

	if (nodeToMerge.param) {
		if (!currentNode.param) {
			currentNode.param = new RouteNode()
			currentNode.param.paramName = nodeToMerge.param.paramName
		}
		mergeNodes(currentNode.param, nodeToMerge.param, middlewares)
	}
}

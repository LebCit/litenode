export function findRouteHandler(routeNode, httpMethod, routePath) {
    let currentNode = routeNode
    let extractedParams = Object.create(null)
    let pathStart = 1
    const pathLength = routePath.length

    for (let pathEnd = 1; pathEnd <= pathLength; ++pathEnd) {
        if (pathEnd === pathLength || routePath[pathEnd] === "/") {
            const pathSegment = routePath.substring(pathStart, pathEnd)
            let nextNode = currentNode.children[pathSegment]

            // If we don't find an exact match for this segment,
            // check for parameter nodes and wildcard nodes
            if (!nextNode) {
                // Check for parameter node
                if (currentNode.param) {
                    nextNode = currentNode.param
                    extractedParams[currentNode.param.paramName] = pathSegment
                }
                // Check for wildcard node if no parameter node matches
                else if (currentNode.wildcard) {
                    nextNode = currentNode.wildcard

                    // Handle wildcard based on its type
                    if (nextNode.paramName === "*") {
                        // For regular wildcard, just capture the current segment
                        extractedParams["*"] = pathSegment
                    } else if (nextNode.paramName === "**") {
                        // For ** (catch-all wildcard), capture the entire remaining path
                        // The -1 is to remove the leading slash
                        extractedParams["**"] = routePath.substring(pathStart - 1)
                        currentNode = nextNode
                        break // Exit the loop as we've matched everything
                    }
                }
            }

            // If we still don't have a next node, return null (no match)
            if (!nextNode) return null

            currentNode = nextNode
            pathStart = pathEnd + 1
        }
    }

    // Check if the current node has a handler for this HTTP method
    if (!currentNode.handler[httpMethod]) return null

    // If we found a matching handler, return it along with any extracted parameters
    return { requestHandlers: currentNode.handler[httpMethod], extractedParams }
}

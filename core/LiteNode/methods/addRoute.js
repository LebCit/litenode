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

            // Handle wildcards (e.g., "*" or "**")
            if (pathSegment === "*" || pathSegment === "**") {
                if (!currentNode.wildcard) {
                    currentNode.wildcard = new RouteNode()
                    // Mark whether this is a single segment (*) or catch-all (**) wildcard
                    currentNode.wildcard.paramName = pathSegment
                }
                nextNode = currentNode.wildcard

                // If this is "**" (catch-all wildcard), skip all remaining segments
                if (pathSegment === "**") {
                    pathEnd = pathLength
                }
            }
            // Handle optional parameters (e.g., ":file?")
            else if (pathSegment[0] === ":" && pathSegment.endsWith("?")) {
                const paramName = pathSegment.substring(1, pathSegment.length - 1)

                // Create the parameter node if it doesn't exist
                if (!currentNode.param) {
                    currentNode.param = new RouteNode()
                    currentNode.param.paramName = paramName
                    currentNode.param.isOptional = true
                }

                // For optional parameters, we also add the same handler to the current node
                // This allows the route to match even if the parameter is not provided
                nextNode = currentNode.param
            }
            // Handle regular parameters (e.g., ":file")
            else if (pathSegment[0] === ":") {
                if (!currentNode.param) {
                    currentNode.param = new RouteNode()
                    currentNode.param.paramName = pathSegment.substring(1)
                }
                nextNode = currentNode.param
            }
            // Handle regular path segments
            else {
                nextNode = currentNode.children[pathSegment] || (currentNode.children[pathSegment] = new RouteNode())
            }

            currentNode = nextNode
            pathStart = pathEnd + 1
        }
    }

    // Add the handler for the HTTP method
    currentNode.handler[httpMethod] = handlers

    // For optional parameters, also add the handler to the parent node
    // This allows routes like /users/:id? to match both /users and /users/123
    if (routePath.includes("/:") && routePath.includes("?")) {
        // Find all optional parameters in the path
        const optionalParams = routePath.match(/\/:[^\/]+\?/g)

        if (optionalParams && optionalParams.length > 0) {
            // Create routes without the optional parameters
            let baseRoute = routePath

            // Remove each optional parameter from the end, one by one
            // This handles nested optional parameters like /posts/:category?/:id?
            for (let i = 0; i < optionalParams.length; i++) {
                // Remove the last optional parameter
                const lastOptParam = optionalParams[optionalParams.length - 1 - i]
                const routeWithoutParam = baseRoute.replace(lastOptParam, "")

                // Only add new routes if they're different from the original
                if (routeWithoutParam !== routePath) {
                    addRoute(routeNode, httpMethod, routeWithoutParam, ...handlers)
                }

                baseRoute = routeWithoutParam
            }
        }
    }
}

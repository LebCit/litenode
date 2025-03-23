export function printNode(node, prefix, level = 0, prefixSymbol = "") {
    let indentation = " ".repeat(level * 4)

    console.log(`${prefixSymbol ? `${indentation}${prefixSymbol} ${prefix || "/"}` : prefix}`)

    // Add markers for optional params and wildcards
    const isOptional = node.isOptional ? " (optional)" : ""
    const isWildcard = node.paramName === "*" ? " (wildcard)" : ""

    // Print route handler information
    for (const [method, handlers] of Object.entries(node.handler)) {
        const handlerNames = handlers.map(
            (handler) =>
                handler.name ||
                handler
                    .toString()
                    .replace(/[\n]/g, "")
                    .replace(/[\s]{2,}/g, " ")
                    .substring(0, 30) + "..."
        )
        console.log(`${indentation}  └─ [${method}] ↠  ${handlerNames.join(", ")}${isOptional}${isWildcard}`)
    }

    // Print regular child nodes
    for (const [childPrefix, childNode] of Object.entries(node.children)) {
        printNode(childNode, childPrefix, level + 1, "├─")
    }

    // Print parameter node
    if (node.param) {
        printNode(node.param, `:${node.param.paramName}${node.param.isOptional ? "?" : ""}`, level + 1, "├─")
    }

    // Print wildcard node
    if (node.wildcard) {
        printNode(node.wildcard, `*`, level + 1, "├─")
    }
}

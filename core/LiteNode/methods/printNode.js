export function printNode(node, prefix, level = 0, prefixSymbol = "") {
	let indentation = " ".repeat(level * 4)

	console.log(`${prefixSymbol ? `${indentation}${prefixSymbol} ${prefix || "/"}` : prefix}`)
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
		console.log(`${indentation}  └─ [${method}] ↠  ${handlerNames.join(", ")}`)
	}

	for (const [childPrefix, childNode] of Object.entries(node.children)) {
		printNode(childNode, childPrefix, level + 1, "├─")
	}
	if (node.param) {
		printNode(node.param, `:${node.param.paramName}`, level + 1, "├─")
	}
}

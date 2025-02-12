import { BaseEvaluator } from "./BaseEvaluator.js"

export class StatementEvaluator extends BaseEvaluator {
	constructor(state, evaluator) {
		super(state)

		this.evaluator = evaluator // Store reference to the main Evaluator
	}

	async evaluateSet(node) {
		const value = await this.evaluator.evaluateNode(node.value)

		if (node.propertyChain) {
			// Get base object
			let obj = this.resolveVariable(node.name)

			if (!obj || typeof obj !== "object") throw new Error(`Cannot extend non-object variable: ${node.name}`)

			// Navigate to the second-to-last object in the chain
			let current = obj
			for (let i = 0; i < node.propertyChain.length - 1; i++) {
				const access = node.propertyChain[i]
				const property = await this.evaluator.evaluateNode(access.property)

				// Create nested object if it doesn't exist
				if (!(property in current) || current[property] === null) current[property] = {}
				else if (typeof current[property] !== "object")
					throw new Error(`Cannot create nested property on non-object value`)
				current = current[property]
			}

			// Set the final property
			const lastAccess = node.propertyChain[node.propertyChain.length - 1]
			const finalProperty = await this.evaluator.evaluateNode(lastAccess.property)
			current[finalProperty] = value
		} else {
			if (node.name.startsWith("html_")) {
				// For html_ variables, store both the raw value and a marker
				const existingHtml = this.state.templateEngine.htmlVars.get(node.name)
				const marker = existingHtml
					? existingHtml.marker
					: `__HTML_${Math.random().toString(36).substring(2, 11)}__`
				this.state.templateEngine.htmlVars.set(node.name, { marker, value })
				this.state.globalData[node.name] = marker
			} else {
				this.state.globalData[node.name] = value // Regular variable assignment, set the variable in globalData
			}
		}

		return ""
	}

	async evaluateEach(node) {
		const iterable = await this.evaluator.evaluateNode(node.iterable)
		if (!iterable || typeof iterable[Symbol.iterator] !== "function") {
			throw new Error(`Cannot iterate over ${iterable}`)
		}
		let result = ""
		let index = 0
		for (const item of iterable) {
			// Push the new context and index
			this.state.contextStack.push(item)
			this.state.indexStack.push(index)

			try {
				const bodyResults = await Promise.all(node.body.map((n) => this.evaluator.evaluateNode(n)))
				result += bodyResults.join("")
			} finally {
				// Always pop the context and index, even if there's an error
				this.state.contextStack.pop()
				this.state.indexStack.pop()
			}
			index++
		}
		return result
	}

	async evaluateInclude(node) {
		const pathValue = await this.evaluator.evaluateNode(node.path)
		if (typeof pathValue !== "string") throw new Error("Include path must be a string")
		const includedData = { ...this.state.globalData } // Create a new data object with all current data
		return await this.state.templateEngine.renderStringWithoutRestore(pathValue, includedData)
	}

	async evaluateConditional(node) {
		if (node.conditionType === "not") {
			// Return body content only if condition evaluates to false
			if (!(await this.evaluator.evaluateNode(node.condition))) {
				// Evaluate body nodes sequentially
				let result = ""
				for (const n of node.body) result += await this.evaluator.evaluateNode(n)
				return result
			}
			return ""
		}
		if (node.conditionType === "if") {
			if (await this.evaluator.evaluateNode(node.condition)) {
				// Evaluate body nodes sequentially
				let result = ""
				for (const n of node.body) result += await this.evaluator.evaluateNode(n)
				return result
			}
			for (const alternate of node.alternates || []) {
				if (alternate.conditionType === "else" || (await this.evaluator.evaluateNode(alternate.condition))) {
					// Evaluate alternate nodes sequentially
					let result = ""
					for (const n of alternate.body) result += await this.evaluator.evaluateNode(n)
					return result
				}
			}
		}
		return ""
	}
}

import { TokenType } from "../syntax/TokenTypes.js"
import { BaseEvaluator } from "./BaseEvaluator.js"
import { builtInFilters } from "./utils/builtInFilters.js"

export class ExpressionEvaluator extends BaseEvaluator {
	constructor(state, evaluator) {
		super(state)

		this.evaluator = evaluator // Store reference to the main Evaluator
		this.filters = { ...builtInFilters } // Add built-in filters
	}

	async evaluateExpression(node) {
		const result = await this.evaluator.evaluateNode(node.expression)
		return result !== undefined ? result : ""
	}

	async evaluateVariable(node) {
		const value = this.resolveVariable(node.name)

		if (node.name.startsWith("html_")) {
			const htmlVar = this.state.templateEngine.htmlVars.get(node.name)
			if (htmlVar) {
				return htmlVar.value
			}
		}

		// Return empty string for undefined values to avoid 'undefined' in output
		return value !== undefined ? value : ""
	}

	async evaluateRawHtml(node) {
		const htmlVarName = node.name.replace("#", "")
		const marker = this.state.globalData[htmlVarName]
		if (!marker && marker !== "") throw new Error(`HTML variable ${htmlVarName} not found`)
		return marker
	}

	async evaluateObject(node) {
		const object = {}
		for (const [key, value] of node.properties) {
			object[key] = await this.evaluator.evaluateNode(value)
		}
		return object
	}

	async evaluateProperty(node) {
		const obj = await this.evaluator.evaluateNode(node.object)
		if (!obj) return undefined
		return obj[node.property]
	}

	async evaluateComputedProperty(node) {
		const obj = await this.evaluator.evaluateNode(node.object)
		if (!obj) return undefined
		const prop = await this.evaluator.evaluateNode(node.property)
		if (typeof prop === "string" || typeof prop === "number") return obj[prop]
		return undefined
	}

	async evaluateFilter(node) {
		const value = await this.evaluator.evaluateNode(node.expression)
		const filter = this.filters[node.filter]
		if (!filter) throw new Error(`Unknown filter: ${node.filter}`)

		try {
			const args = await Promise.all(node.arguments.map((arg) => this.evaluator.evaluateNode(arg)))
			if (node.filter === "toLink") {
				if (args.length < 1 || args.length > 3) {
					throw new Error(
						"toLink filter expects 1 to 3 arguments: display text, external (optional), safe (optional)"
					)
				}
				return filter(value, args[0], args[1] === true, args[2] === true)
			}
			return filter(value, ...args)
		} catch (error) {
			throw new Error(`Error applying filter '${node.filter}': ${error.message}`)
		}
	}

	async evaluateUnary(node) {
		const rightUnary = await this.evaluator.evaluateNode(node.right)
		if (node.operator === TokenType.NOT) return !rightUnary
		if (node.operator === TokenType.MINUS) return -rightUnary
		throw new Error(`Unknown unary operator: ${node.operator}`)
	}

	async evaluateBinary(node) {
		const leftBinary = await this.evaluator.evaluateNode(node.left)
		const rightBinary = await this.evaluator.evaluateNode(node.right)
		return this.evaluateBinaryOp(node.operator, leftBinary, rightBinary)
	}

	async evaluateLogical(node) {
		const leftLogical = await this.evaluator.evaluateNode(node.left)
		if (node.operator === TokenType.AND) return leftLogical && (await this.evaluator.evaluateNode(node.right))
		return leftLogical || (await this.evaluator.evaluateNode(node.right))
	}

	async evaluateComparison(node) {
		const leftComp = await this.evaluator.evaluateNode(node.left)
		const rightComp = await this.evaluator.evaluateNode(node.right)
		return this.evaluateComparisonOp(node.operator, leftComp, rightComp)
	}

	async evaluateTernary(node) {
		const condition = await this.evaluator.evaluateNode(node.condition)
		return condition
			? await this.evaluator.evaluateNode(node.trueExpr)
			: await this.evaluator.evaluateNode(node.falseExpr)
	}
}

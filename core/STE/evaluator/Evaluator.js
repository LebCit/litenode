import { EvaluatorState } from "./EvaluatorState.js"
import { BaseEvaluator } from "./BaseEvaluator.js"
import { ExpressionEvaluator } from "./ExpressionEvaluator.js"
import { StatementEvaluator } from "./StatementEvaluator.js"

export class Evaluator extends BaseEvaluator {
	constructor(data, templateEngine) {
		// Create shared state
		const state = new EvaluatorState(data, templateEngine)
		super(state)

		// Pass the same state to child evaluators
		this.expressionEvaluator = new ExpressionEvaluator(state, this)
		this.statementEvaluator = new StatementEvaluator(state, this)
	}

	async evaluate(ast) {
		return await this.evaluateNode(ast)
	}

	async evaluateNode(node) {
		switch (node.type) {
			case "template":
				return await this.evaluateTemplate(node)
			case "expression":
				return await this.expressionEvaluator.evaluateExpression(node)
			case "literal":
				return node.value
			case "variable":
				return await this.expressionEvaluator.evaluateVariable(node)
			case "raw_html":
				return await this.expressionEvaluator.evaluateRawHtml(node)
			case "grouping":
				return await this.evaluateNode(node.expression)
			case "array":
				return await Promise.all(node.elements.map((element) => this.evaluateNode(element)))
			case "object":
				return await this.expressionEvaluator.evaluateObject(node)
			case "property":
				return await this.expressionEvaluator.evaluateProperty(node)
			case "computed_property":
				return await this.expressionEvaluator.evaluateComputedProperty(node)
			case "filter":
				return await this.expressionEvaluator.evaluateFilter(node)
			case "set":
				return await this.statementEvaluator.evaluateSet(node)
			case "each":
				return await this.statementEvaluator.evaluateEach(node)
			case "index_ref":
				return this.state.currentIndex
			case "this_ref":
				return this.state.currentContext
			case "include":
				return await this.statementEvaluator.evaluateInclude(node)
			case "conditional":
				return await this.statementEvaluator.evaluateConditional(node)
			case "unary":
				return await this.expressionEvaluator.evaluateUnary(node)
			case "binary":
				return await this.expressionEvaluator.evaluateBinary(node)
			case "logical":
				return await this.expressionEvaluator.evaluateLogical(node)
			case "comparison":
				return await this.expressionEvaluator.evaluateComparison(node)
			case "ternary":
				return await this.expressionEvaluator.evaluateTernary(node)
			default:
				throw new Error(`Unknown node type: ${node.type}`)
		}
	}

	async evaluateTemplate(node) {
		let result = ""
		for (const n of node.body) result += await this.evaluateNode(n)
		return result
	}
}

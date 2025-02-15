export class EvaluatorState {
	constructor(data, templateEngine) {
		this.globalData = this.normalizeData(data)
		this.contextStack = [this.globalData] // Stack to handle nested contexts
		this.indexStack = [] // Stack to handle nested indices
		this.keyStack = [] // Stack to handle nested keys
		this.templateEngine = templateEngine // Store reference to template engine
	}

	// Helper method to normalize input data
	normalizeData(data) {
		if (!data || typeof data !== "object") return {}
		if (Array.isArray(data)) return {}
		return { ...data }
	}

	get currentContext() {
		return this.contextStack[this.contextStack.length - 1]
	}

	get currentIndex() {
		return this.indexStack[this.indexStack.length - 1]
	}

	get currentKey() {
		return this.keyStack[this.keyStack.length - 1]
	}
}

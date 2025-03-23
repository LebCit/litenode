export class RouteNode {
	constructor() {
		this.handler = Object.create(null)
		this.children = Object.create(null)
		this.param = null
		this.paramName = null
		this.isOptional = false // Flag for optional parameters
		this.wildcard = null // Reference to wildcard node
	}
}

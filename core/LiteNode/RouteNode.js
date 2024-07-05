export class RouteNode {
	constructor() {
		this.handler = Object.create(null)
		this.children = Object.create(null)
		this.param = null
		this.paramName = null
	}
}

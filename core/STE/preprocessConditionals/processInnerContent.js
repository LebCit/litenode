import { preprocessConditionals } from "./index.js"

export const processInnerContent = (content, dataObject) => {
	return preprocessConditionals(content, dataObject)
}

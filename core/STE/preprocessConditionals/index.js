import { processIfBlocks } from "./processIfBlocks.js"
import { processNotBlocks } from "./processNotBlocks.js"
import { processEach } from "./processEach.js"

export const preprocessConditionals = (content, dataObject) => {
	content = processIfBlocks(content, dataObject)
	content = processNotBlocks(content, dataObject)
	content = processEach(content, dataObject)
	return content
}

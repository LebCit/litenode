import { parseValue } from "./parseValue.js"

export function parseFrontmatterLines(lines) {
	let result = {}
	let currentObject = result
	let stack = [result]

	lines.forEach((line) => {
		if (line.startsWith("#")) {
			return
		}

		if (line.includes(":")) {
			const [key, ...valueParts] = line.split(":")
			const value = valueParts.join(":").trim()
			if (value === "" || value.endsWith(":")) {
				const newObject = {}
				currentObject[key.trim()] = newObject
				stack.push(currentObject)
				currentObject = newObject
			} else {
				currentObject[key.trim()] = parseValue(value)
			}
		} else if (line === "") {
			currentObject = stack.pop()
		}
	})

	return result
}

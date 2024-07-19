export const resolveValue = (value, dataObject) => {
	if (isNaN(value)) {
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			return value.slice(1, -1)
		}
		const keys = value.trim().split(".")
		let result = dataObject
		for (let key of keys) {
			if (result && key in result) {
				result = result[key]
			} else {
				return undefined
			}
		}
		return result
	}
	return parseFloat(value)
}

export const resolveValue = (value, dataObject) => {
	if (isNaN(value)) {
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			return value.slice(1, -1)
		}
		return dataObject[value.trim()]
	}
	return parseFloat(value)
}

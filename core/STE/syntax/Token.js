export class Token {
	constructor(type, lexeme, literal, position) {
		this.type = type // Type of token (text, variable, etc.)
		this.lexeme = lexeme // The actual text/part of the template that represents this token
		this.literal = literal // The evaluated value of the token, if applicable (often used for variables)
		this.position = position // The position in the original template where this token starts
	}
}

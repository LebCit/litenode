# LiteNode

LiteNode is a lightweight and modular Node.js web framework designed to provide essential web server functionalities with a clean and intuitive API. It leverages modern JavaScript features while ensuring compatibility with both CommonJS and ES6 modules, making it versatile for various development environments. LiteNode is suitable for developers seeking a straightforward yet powerful solution for building web applications.

<p align="center" style="font-size: xx-large;">
	<a href="https://litenode.pages.dev/">Documentation</a>
</p>

## Installation

You can install LiteNode via npm:

```bash
npm install litenode
```

## Quick Start

Here is a basic example of how to create a server using LiteNode:

```javascript
// To use LiteNode in your project, you can import it using ES6 import syntax
import { LiteNode } from "litenode"

//  Or, if you are using CommonJS modules, you can require it as follows:
const { LiteNode } = require("litenode")

// Create a new instance of LiteNode
const app = new LiteNode()

// Define a route
app.get("/", (req, res) => {
    res.txt("Hello, LiteNode!")
})

// Start the server
app.startServer()
```

## Key Features

-   **Efficient Routing**: LiteNode provides a [flexible routing system](https://litenode.pages.dev/docs/routing/) allowing you to define routes with various HTTP methods.
-   **Middleware Support**: Easily integrate [middleware functions](https://litenode.pages.dev/docs/middleware/) into your application to handle common tasks such as logging, authentication, etc.
-   **Integrated JSON Body Parser**: Simplify handling of POST requests with [LiteNode's integrated JSON body parser](https://litenode.pages.dev/docs/json/).
-   **Static Asset Loader**: Serve static files effortlessly with [LiteNode's built-in static asset loader](https://litenode.pages.dev/docs/serving-static-files/).
-   **Error Handling**: Customize [error handling](https://litenode.pages.dev/docs/error-handling/) with ease, ensuring robustness and reliability in your application.
-   **Templating**: LiteNode includes an [integrated template engine](https://litenode.pages.dev/docs/rendering-templates/) for rendering HTML files with [conditional logic, looping through arrays, and negating conditions](https://litenode.pages.dev/docs/ste-helpers/).

## Strengths

-   **Lightweight and Fast**: LiteNode is designed to be lightweight, ensuring quick response times and efficient handling of requests.
-   **Modular Design**: The framework's modularity allows for easy customization and extension, enabling developers to add or modify functionalities as needed.
-   **Modern JavaScript Support**: LiteNode leverages ES6 features, making the codebase clean and modern while maintaining compatibility with CommonJS.
-   **Comprehensive Built-in Features**: The framework includes essential web server features out of the box, reducing the need for additional dependencies and simplifying development.

## Conclusion

LiteNode is a versatile and efficient web framework for Node.js, offering a range of features that cater to modern web development needs. Its lightweight design, coupled with powerful routing, middleware, and templating capabilities, makes it an excellent choice for developers seeking a balance between simplicity and functionality. Whether building small web applications, APIs, or static websites, LiteNode provides a solid foundation for rapid development and deployment.

## Origins

LiteNode is a powerful and flexible Node.js web framework built on the foundation of [Velocy](https://github.com/ishtms/velocy). It extends and improves upon Velocy's features to provide a seamless development experience for building web applications.

## License

LiteNode is licensed under the MIT License. See the [LICENSE](https://github.com/LebCit/litenode/blob/main/LICENSE) file for details.

## Issues

If you encounter any issues or have suggestions for improvement, please report them on the [GitHub Issues](https://github.com/LebCit/litenode/issues) page.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests with your enhancements.

## Author

LiteNode is authored by [LebCit](https://github.com/LebCit).

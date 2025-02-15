# LiteNode

LiteNode is a lightweight and modular Node.js web framework designed to provide essential web server functionalities with a clean and intuitive API. It leverages modern JavaScript features, making it versatile for various development environments. LiteNode is suitable for developers seeking a straightforward yet powerful solution for building web applications.

<p align="center">
    LiteNode checks for and notifies you if a new version is available whenever the server starts.<br>
    <a href="https://litenode.pages.dev/">Documentation</a>
</p>

<p align="center">
    <a href="https://lebcit.github.io/posts/ultimate-markdown-based-application-tutorial-in-node-js/">Dive into My Ultimate Markdown-based Application Tutorial in Node.js!</a>
</p>

**BREAKING CHANGE:** As of LiteNode version 4.0.0, the integrated Simple Template Engine (STE) has been upgraded to a more powerful [AST-based](https://en.wikipedia.org/wiki/Abstract_syntax_tree) template engine. With this update, the engine's tags have been unified to a single signature, making it simpler and more efficient. There are also many new features to explore, so check out the [updated documentation](https://litenode.pages.dev/docs/rendering-templates/) to fully take advantage of these improvements.

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
-   **Integrated Body Parser**: Simplify handling of POST requests with [LiteNode's integrated body parser](https://litenode.pages.dev/docs/body-parsing/), supporting `application/json`, `application/x-www-form-urlencoded`, and `multipart/form-data` content types.
-   **Static Asset Loader**: Serve static files effortlessly with [LiteNode's built-in static asset loader](https://litenode.pages.dev/docs/serving-static-files/), without server restart.
-   **Error Handling**: Customize [error handling](https://litenode.pages.dev/docs/error-handling/) with ease, ensuring robustness and reliability in your application.
-   **Templating**: LiteNode features an integrated, powerful [AST-based](https://en.wikipedia.org/wiki/Abstract_syntax_tree) template engine, called [STE](https://litenode.pages.dev/docs/rendering-templates/) (Simple Template Engine), for rendering HTML files.
-   **Markdown**: With [LiteNode's support for Markdown](https://litenode.pages.dev/docs/markdown/), you can easily create content-driven applications with rich text formatting.

## Strengths

-   **Lightweight and Fast**: LiteNode is designed to be lightweight, ensuring quick response times and efficient handling of requests.
-   **Modular Design**: The framework's modularity allows for easy customization and extension, enabling developers to add or modify functionalities as needed.
-   **Modern JavaScript Support**: LiteNode leverages ES6 features, making the codebase clean and modern.
-   **Comprehensive Built-in Features**: The framework includes essential web server features out of the box, reducing the need for additional dependencies and simplifying development.

## Conclusion

LiteNode is a versatile and efficient web framework for Node.js, offering a range of features that cater to modern web development needs. Its lightweight design, coupled with powerful routing, middleware, and templating capabilities, makes it an excellent choice for developers seeking a balance between simplicity and functionality. Whether building small web applications, APIs, or static websites, LiteNode provides a solid foundation for rapid development and deployment.

## Origins

LiteNode is a powerful and flexible Node.js web framework built on the foundation of [Velocy](https://github.com/ishtms/velocy). It extends and improves upon Velocy's features to provide a seamless development experience for building web applications. You can read more about it in [LiteNode, Node.js Web Framework](https://lebcit.github.io/posts/litenode-nodejs-web-framework/).

## License

LiteNode is licensed under the MIT License. See the [LICENSE](https://github.com/LebCit/litenode/blob/main/LICENSE) file for details.

## Issues

If you encounter any issues or have suggestions for improvement, please report them on the [GitHub Issues](https://github.com/LebCit/litenode/issues) page.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests with your enhancements.

## Author

LiteNode is authored by [LebCit](https://github.com/LebCit).

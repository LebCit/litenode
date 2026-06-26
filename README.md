# LiteNode

Lightweight, zero-dependency, and intuitive. Build web applications, APIs, and static sites with a clean and expressive API.

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

- **Truly Lightweight** 🪶 - Zero external dependencies. LiteNode ships only what you need for a production-ready web server.
- **Expressive Routing** 🛣️ - Named params, optional params, wildcards, catch-all patterns, and nested routers — all with a clean API.
- **AST Template Engine** 🏗️ - STE (Simple Template Engine) is an integrated, AST-based engine for rendering HTML with full data injection support.
- **Markdown Native** 📃 - Parse individual or entire directories of Markdown files, extract frontmatter, paginate, and generate TOCs built-in.
- **Smart Static Files** 📂 - Serve assets from a static directory. New files are picked up automatically — no server restart needed.
- **Cookie Management** 🍪 - Full cookie lifecycle: parse, set, sign, verify, and delete — including signed cookies with HMAC verification.
- **Environment Variables** ⚙️ - Built-in .env file loading with multi-environment support. No dotenv dependency required.

## Documentation

The documentation is available on [litenode.pages.dev](https://litenode.pages.dev/).  
Learn to build a Markdown-based web application using LiteNode: [litenode-markdown-app.pages.dev](https://litenode-markdown-app.pages.dev/).

## Issues

If you encounter any issues or have suggestions for improvement, please report them on the [GitHub Issues](https://github.com/LebCit/litenode/issues) page.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests with your enhancements.

## Author

LiteNode is authored by [LebCit](https://github.com/LebCit).

## License

LiteNode is licensed under the MIT License. See the [LICENSE](https://github.com/LebCit/litenode/blob/main/LICENSE) file for details.

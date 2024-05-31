# LiteNode

LiteNode is a fast, lightweight, and independent Node.js web framework designed for building efficient web applications. It features an integrated JSON body parser for effortless handling of POST requests and a built-in static asset loader for seamless file serving.

## Key Features

-   **Efficient Routing**: LiteNode provides a flexible routing system allowing you to define routes with various HTTP methods.
-   **Middleware Support**: Easily integrate middleware functions into your application to handle common tasks such as logging, authentication, etc.
-   **Integrated JSON Body Parser**: Simplify handling of POST requests with LiteNode's integrated JSON body parser.
-   **Static Asset Loader**: Serve static files effortlessly with LiteNode's built-in static asset loader.
-   **Error Handling**: Customize error handling with ease, ensuring robustness and reliability in your application.

## Installation

You can install LiteNode via npm:

```bash
npm install litenode
```

## Basic Usage

### Creating a Simple Server

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
	res.end("Hello, LiteNode!")
})

// Start the server on port 5000 by default
app.startServer()
```

This will start a server listening on port 5000.<br/>
The console will output:

```bash
Error while reading static directory: "static" directory doesn't exist!
LiteNode will continue running without serving static assets.
App @ http://localhost:5000
```

Ignore the warning messages for now, we'll address them later.

Accessing `http://localhost:5000` will respond with "Hello, LiteNode!".

### Adding Routes

You can add routes for different HTTP methods (GET, POST, PUT, DELETE, PATCH):

#### get(routePath: string, ...handlers: RouteHandler[]): LiteNode

Defines a route with the GET method.

-   `routePath`: The path of the route.
-   `handlers`: Optional middleware functions and the route handler function.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define a GET route with a route handler function
app.get("/users", (req, res) => {
	res.end("List of users")
})

// Define a GET route with middleware and a route handler function
app.get("/users/:id", authenticate, (req, res) => {
	const userId = req.params.id
	res.end(`User ID: ${userId}`)
})
```

#### post(routePath: string, ...handlers: (RouteHandler | number)[]): LiteNode

Defines a route with the POST method.

-   `routePath`: The path of the route.
-   `handlers`: Optional middleware functions and the route handler function with an optional maximum request size limit for JSON body parsing in megabytes.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define a POST route with a route handler function
app.post("/users", (req, res) => {
	// Logic to create a new user
	res.end("User created successfully")
})

// Define a route to handle POST requests with JSON body parsing
app.post(
	"/users/create-user",
	(req, res, data) => {
		// Data contains the parsed JSON body
		console.log("Received JSON data:", data)

		// Access specific fields from the JSON data
		const { username, email } = data

		// Process the received data and send a response
		// For example, save the user data to a database
		// Send a success response back to the client
		res.writeHead(200, { "Content-Type": "application/json" })
		res.end(JSON.stringify({ message: "User created successfully" }))
	},
	2 // Set a maximum request size limit of 2 MB (optional, default is 1MB)
)
```

#### put(routePath: string, ...handlers: RouteHandler[]): LiteNode

Defines a route with the PUT method.

-   `routePath`: The path of the route.
-   `handlers`: Optional middleware functions and the route handler function.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define a PUT route with a route handler function
app.put("/users/:id", (req, res) => {
	const userId = req.params.id
	// Logic to update user with ID userId
	res.end(`User with ID ${userId} updated successfully`)
})
```

#### delete(routePath: string, ...handlers: RouteHandler[]): LiteNode

Defines a route with the DELETE method.

-   `routePath`: The path of the route.
-   `handlers`: Optional middleware functions and the route handler function.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define a DELETE route with a route handler function
app.delete("/users/:id", (req, res) => {
	const userId = req.params.id
	// Logic to delete user with ID userId
	res.end(`User with ID ${userId} deleted successfully`)
})
```

#### patch(routePath: string, ...handlers: RouteHandler[]): LiteNode

Defines a route with the PATCH method.

-   `routePath`: The path of the route.
-   `handlers`: Optional middleware functions and the route handler function.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define a PATCH route with a route handler function
app.patch("/users/:id", (req, res) => {
	const userId = req.params.id
	// Logic to update specific fields of user with ID userId
	res.end(`User with ID ${userId} patched successfully`)
})
```

### Route Parameters

You can define routes with parameters:

```javascript
// Define a route to handle GET requests for user details
app.get("/user/:id", (req, res) => {
	// Extract the user ID from the request parameters
	const userId = req.params.id

	// Send a response with the user ID
	res.end(`User ID: ${userId}`)
})
```

Accessing `http://localhost:5000/user/123` will respond with "User ID: 123".

### Query Parameters

Query parameters can be accessed via `req.queryParams`:

```javascript
// Define a route to handle GET requests for search queries
app.get("/search", (req, res) => {
	// Extract the search query from the request query parameters
	const query = req.queryParams.get("q")

	// Send a response with the search query
	res.end(`Search query: ${query}`)
})
```

Accessing `http://localhost:5000/search?q=LiteNode` will respond with "Search query: LiteNode".

### Middleware

Middleware functions can be applied globally or per-route basis:

#### use(middleware: RouteHandler): LiteNode

Adds a middleware function to the middleware stack.

-   `middleware`: The middleware function to add.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define a middleware function to log incoming requests globally
app.use(async (req, res) => {
	// Log the method and URL of the incoming request
	console.log(`${req.method} ${req.url}`)
})
```

#### type Middleware = RouteHandler

Adds a middleware function to the middleware stack

-   `middleware`: The middleware function to add.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Middleware function to add a timestamp to the request object
const addTimestamp = async (req, res) => {
	// Add a timestamp to the request object
	req.timestamp = new Date()
}

// Add route with middleware
app.get("/route-with-timestamp-middleware", addTimestamp, async (req, res) => {
	// Retrieve the timestamp from the request object
	const timestamp = req.timestamp
	// Send a response with the timestamp
	res.end(`Route with a middleware function. Request timestamp: ${timestamp}`)
})
```

### Error Handling

Define custom error handling and 404 not found handling:

#### onError(handler: RouteHandler): LiteNode

Defines a custom error handling function for internal server errors.

handler: The asynchronous custom error handling function.
Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define custom error handling for internal server errors
app.onError(async (err, req, res) => {
	// Set the response status code to 500 (Internal Server Error)
	res.writeHead(500)
	// Send a response indicating internal server error
	res.end("Internal Server Error")
})
```

#### notFound(handler: RouteHandler): LiteNode

Defines a handler for 404 (Not Found) errors.

handler: The asynchronous route handler function for 404 errors.
Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Define handling for 404 (Not Found) errors
app.notFound(async (req, res) => {
	// Set the response status code to 404 (Not Found)
	res.writeHead(404)
	// Send a response indicating route not found
	res.end("Route Not Found")
})
```

### Serving Static Files

`LiteNode` serves static files from the `static` directory by default:

```javascript
const app = new LiteNode()

app.startServer()
```

This will serve files from the `static` directory.<br/>
Accessing `http://localhost:5000/path/to/file` will serve the corresponding file from the `static` directory.

The `static` directory should exist at the root of your application, otherwise the following message will appear:

```bash
Error while reading static directory: "static" directory doesn't exist!
LiteNode will continue running without serving static assets.
```

`LiteNode` can serve static files from a specified directory:

```javascript
const app = new LiteNode("public")

app.startServer()
```

This will serve files from the `public` directory.<br/>
Accessing `http://localhost:5000/path/to/file` will serve the corresponding file from the `public` directory.

The `public` directory should exist at the root of your application, otherwise the following message will appear:

```bash
Error while reading static directory: "public" directory doesn't exist!
LiteNode will continue running without serving static assets.
```

To use `LiteNode` without a static asset folder and avoid warning messages, set the directory to `__NO_STATIC_DIR__`:

```javascript
const app = new LiteNode("__NO_STATIC_DIR__")
```

This will skip serving static assets and avoid logging warnings to the console.

### Combining Routers

You can merge routers or nest routers under a specific path:

#### merge(routerToMerge: LiteNode, ...middlewares: RouteHandler[]): void

Merges routes from another LiteNode instance into the current LiteNode instance.

-   `routerToMerge`: The LiteNode instance to merge routes from.
-   `middlewares`: Optional middleware functions to be applied to the merged routes.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Create a LiteNode instance for user routes
const userRouter = new LiteNode()

// Define a route for user profile
userRouter.get("/profile", (req, res) => {
	// Set response headers
	res.writeHead(200, { "Content-Type": "text/plain" })
	// Send response with user profile data
	res.end("User Profile")
})

// Create a LiteNode instance for API routes
const apiRouter = new LiteNode()

// Define a route for API data
apiRouter.get("/data", (req, res) => {
	// Set response headers
	res.writeHead(200, { "Content-Type": "application/json" })
	// Send response with JSON data
	res.end(JSON.stringify({ message: "API Data" }))
})

// Merge userRouter and apiRouter into the main LiteNode app
app.merge(userRouter)
app.merge(apiRouter)

// Merge example with middleware function
app.merge(apiRouter, myMiddlewareFunction)
```

Accessing `http://localhost:5000/profile` will respond with "User Profile".

Accessing `http://localhost:5000/data` will respond with the JSON object `{"message": "API Data"}` in JSON format.

#### nest(prefix: string, routerToNest: LiteNode, ...middlewares: RouteHandler[]): LiteNode

Nests routes from another LiteNode instance under a specific prefix.

-   `prefix`: The prefix for nested routes.
-   `routerToNest`: The LiteNode instance to nest routes from.
-   `middlewares`: Optional middleware functions to be applied to the nested routes.
-   Returns: A reference to the LiteNode instance for method chaining.

**Example:**

```javascript
// Create a LiteNode instance for admin routes
const adminRouter = new LiteNode()

// Define a route for admin dashboard
adminRouter.get("/dashboard", (req, res) => {
	// Set response headers
	res.writeHead(200, { "Content-Type": "text/plain" })
	// Send response with admin dashboard data
	res.end("Admin Dashboard")
})

// Nest the adminRouter under the "/admin" prefix in the main LiteNode app
app.nest("/admin", adminRouter)

// Nest example with middleware function
app.nest("/admin", adminRouter, myMiddlewareFunction)
```

Accessing `http://localhost:5000/admin/dashboard` will respond with "Admin Dashboard".

#### Merging and Nesting with Middlewares

The examples above demonstrate how to merge and nest while applying middleware. However, an application in production will likely consist of multiple routes.<br/>
Utilizing the `merge` and `nest` methods with one or many middlewares will impact the parent routes and consequently the child routes by applying the defined middleware(s) to them.<br/>
To mitigate this behavior, initialize the merged `LiteNode` instance without specifying a directory for serving static files:

```javascript
const app = new LiteNode()

// Create a LiteNode instance that skips serving static assets
const subApp = new LiteNode("__NO_STATIC_DIR__")

// Global middleware
app.use(async (req, res) => {
	console.log(req.url)
})

// Route based middleware
async function myMiddleware(req, res) {
	console.log("A middleware function that will be applied to a particular route.")
}

// Define the application's entry route
app.get("/", (req, res) => {
	res.end("Hello, LiteNode!")
})

// Define a route for the sub application
subApp.get("/sub", (req, res) => {
	res.end("Sub application of the main LiteNode app")
})

// Merge subApp into the main LiteNode app
// Apply myMiddleware to the "/sub" route only!
app.merge(subApp, myMiddleware)

// Nest subApp under the "/app" prefix in the main LiteNode app
// Apply myMiddleware to the "/app/sub" route only!
app.nest("/app", subApp, myMiddleware)
```

Nested routes are by default defined as a `LiteNode` instance that skips serving static assets to prevent unintended traversal of their middleware(s) in the reverse direction.

Keep in mind the following from the above example:

1. While `subApp` is set to prevent _serving_ static files, it can still _load_ the files from the "static" directory of `app` since it's merged into it.
2. Assuming a defined `/app` route in the `app` instance, this route will not be affected by `myMiddleware`. This is because middleware applied to nested routes only impacts those routes and their children.
3. Nested instance(s) of `LiteNode` are set to skip serving static assets by default.

### Starting the Server

#### startServer(port?: number): http.Server

Starts the HTTP server and listens on the specified port.

-   `port`: Optional port number to listen on (default: 5000).
-   Returns: The HTTP server instance.

Start the server on a specified port:

```javascript
// Start the HTTP server
app.startServer(3000)
```

This will start the server and listen for incoming requests on port 3000.

## Advanced Features

### Handling POST Requests with JSON Body

You can handle POST requests with JSON bodies. The body size can be limited:

```javascript
// Define a POST route with a route handler function
app.post("/submit", async (req, res, data) => {
	// Data contains the parsed JSON body
	console.log("Received JSON data:", data)
}) // Default max request size: 1MB

// Define a route to handle user registration
app.post(
	"/register",
	async (req, res, data) => {
		try {
			// Simulate user registration process
			const { username, email, password } = data
			// Validate user data (e.g., check for required fields)
			if (!username || !email || !password) {
				// If any required field is missing, throw an error
				throw new Error("Missing required fields")
			}
			// If all validation passes, register the user
			// Database operations...
			res.writeHead(201, { "Content-Type": "application/json" })
			res.end(JSON.stringify({ message: "User registered successfully" }))
		} catch (error) {
			// Handle any errors that occur during registration
			console.error("Error registering user:", error.message)
			res.writeHead(400, { "Content-Type": "application/json" })
			res.end({ error: error.message })
		}
	},
	0.5 // Set maximum request size to 0.5MB = 512KB
)
```

### Printing the Route Tree

For debugging, you can print the route tree:

```javascript
// Print the route tree of the LiteNode instance.
app.printTree()
```

This will output a hierarchical view of the registered routes.

## Origins

LiteNode is a powerful and flexible Node.js web framework built on the foundation of [Velocy](https://github.com/ishtms/velocy). It extends and improves upon Velocy's features to provide a seamless development experience for building web applications.

### Improvements from Velocy

1. **JSON Body Parsing**: LiteNode enhances Velocy by providing built-in support for parsing JSON request bodies. This simplifies handling JSON data in request payloads, making it easier to work with APIs and data interchange.

2. **Integrated `startServer` Functionality**: Unlike Velocy, LiteNode streamlines the process of starting the HTTP server by integrating the `startServer` method directly into the framework. This simplifies server initialization and configuration, allowing developers to focus more on building their applications.

3. **Static Asset Loader**: LiteNode introduces a static asset loader feature, allowing developers to serve static files effortlessly. This feature enhances Velocy's capabilities by providing seamless integration for serving CSS, JavaScript, images, and other static assets.

4. **Error Handling**: LiteNode improves error handling compared to Velocy. It introduces custom error handling functionality with the `onError` method, allowing developers to define custom error handling logic for their applications. Additionally, LiteNode provides a built-in handler for 404 Not Found errors with the `notFound` method, enhancing the framework's robustness and reliability.

5. **Middleware Support**: LiteNode introduces comprehensive middleware support, both globally and at the route level. Developers can easily add middleware functions to handle cross-cutting concerns such as authentication, logging, and request processing. The ability to apply middleware globally, as well as to individual routes, merge, and nest operations, provides greater flexibility and control over request processing in LiteNode.

## Conclusion

`LiteNode` is a versatile and lightweight framework for creating HTTP servers in Node.js.<br/>
It provides essential routing, middleware, and static file serving functionalities, making it easy to get started with web development.

## License

LiteNode is licensed under the MIT License. See the [LICENSE](https://github.com/LebCit/litenode/blob/main/LICENSE) file for details.

## Issues

If you encounter any issues or have suggestions for improvement, please report them on the [GitHub Issues](https://github.com/LebCit/litenode/issues) page.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests with your enhancements.

## Author

LiteNode is authored by [LebCit](https://github.com/LebCit).

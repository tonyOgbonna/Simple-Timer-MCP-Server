# Simple Timer MCP Server

An MCP (Model Context Protocol) Server that provides interval timing functionality using token-based time tracking. This project serves as a beginner-friendly example of an MCP Server implementation, demonstrating core MCP development concepts through minimal, practical functionality.

## Features

-   **Token-based Timers**: Start and check timers using unique string identifiers (tokens).
-   **Elapsed Time Calculation**: Calculates and returns the time elapsed since a timer was started.
-   **Human-Readable Output**: Option to get elapsed time in a human-readable format (e.g., "2 hours, 15 minutes ago").
-   **SQLite Database**: Uses a lightweight SQLite database for persistent storage of timer data.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18.x or later recommended)
-   Yarn (v1.x or later)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tonyOgbonna/Simple-Timer-MCP-Server.git
    cd Simple-Timer-MCP-Server
    ```
    
2.  **Install dependencies:**
    ```bash
    yarn install
    ```

### Building the Project

The project is written in TypeScript and needs to be compiled to JavaScript.

```bash
yarn build
```

This will compile the TypeScript files from `src/` into the `dist/` directory.

### Running the Server

To start the MCP server, run the following command:

```bash
yarn start
```

The server will initialize the SQLite database (`timer.db` in the project root) if it doesn't exist and start listening for MCP requests via `StdioServerTransport`. You should see output similar to:

```
Database initialized and 'timers' table ensured.
MCP Server 'Simple Timer' started and listening via StdioServerTransport.
```

## Integration with MCP Hosts

This section provides general guidance on how to integrate this local MCP server with various MCP-compatible hosts (e.g., Cline, Roo Code, Cursor, Claude Code). The exact steps may vary slightly depending on the host's interface.

Typically, you will need to provide the host with the command to execute this server.

1.  **Ensure the server is built**: Before integrating, make sure the project is built by running `yarn build`.
2.  **Provide the execution command**: The command to run this server is `node dist/index.js`.

    -   **For hosts that accept a direct command**: Simply provide `node dist/index.js`.
    -   **For hosts that require a full path**: You might need to provide the absolute path to your project's `dist/index.js` file, e.g., `/path/to/your/project/timer_mcp_server/dist/index.js`.
    -   **For hosts that use `package.json` scripts**: Some hosts might automatically detect and use the `start` script defined in `package.json` (i.e., `yarn start`).

    Consult your specific MCP host's documentation for precise instructions on adding a local MCP server.

    Generally:
    
    ```json
    "mcpServers": {
      "Simple-Timer-MCP-Server": {
        "command": "node",
        "args": [
          "/path/to/install/folder/dist/index.js"
        ]
      }
    }
    ```
## MCP Tools

This MCP Server exposes two tools: `start_timer` and `check_timer`.

### `start_timer`

Starts a new timer for a given token. If a timer for the token already exists, it will inform you of the existing timer's start time.

-   **Arguments**:
    -   `token` (string, required): A unique string identifier for the timer.

-   **Example Usage (Conceptual - via MCP Client)**:
    ```json
    {
      "tool_name": "start_timer",
      "arguments": {
        "token": "my_first_timer"
      }
    }
    ```

-   **Example Response**:
    ```
    Timer for token 'my_first_timer' started at: 2025-06-03T01:55:00.000Z
    ```
    or
    ```
    Timer for token 'my_first_timer' already exists. Started at: 2025-06-03T01:00:00.000Z
    ```

### `check_timer`

Checks the elapsed time for an existing timer.

-   **Arguments**:
    -   `token` (string, required): The unique string identifier for the timer.
    -   `format` (enum, optional): `raw` (default) for milliseconds, or `human_readable` for a descriptive string.

-   **Example Usage (Conceptual - via MCP Client)**:
    ```json
    {
      "tool_name": "check_timer",
      "arguments": {
        "token": "my_first_timer",
        "format": "human_readable"
      }
    }
    ```

-   **Example Response (human_readable)**:
    ```
    Elapsed time for token 'my_first_timer': 1 hour, 30 minutes, 45 seconds.
    ```

-   **Example Response (raw)**:
    ```
    Elapsed time for token 'my_first_timer': 5445000 milliseconds.
    ```
    or
    ```
    No timer found for token 'non_existent_timer'.
    ```

## Project Structure

```
.
├── .git/                 # Git version control directory
├── dist/                 # Compiled JavaScript output
├── src/                  # TypeScript source code
│   └── index.ts          # Main MCP server logic
├── .gitignore            # Specifies intentionally untracked files to ignore
├── package.json          # Project metadata and dependencies
├── README.md             # This file
├── tsconfig.json         # TypeScript configuration
├── yarn.lock             # Yarn dependency lock file
└── test-client.ts        # Script for testing server functionality
```

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Database from 'better-sqlite3';

// Initialize SQLite database
const DB_PATH = './timer.db';
let db: Database.Database;

interface TimerData {
    token: string;
    timestamp: number;
}

function initializeDatabase() {
    db = new Database(DB_PATH);
    db.exec(`
        CREATE TABLE IF NOT EXISTS timers (
            token TEXT PRIMARY KEY,
            timestamp INTEGER
        );
    `);
    console.log("Database initialized and 'timers' table ensured.");
}

// Initialize MCP Server
const server = new McpServer({
    name: "Simple Timer MCP Server",
    version: "1.0.0",
    description: "An MCP Server that provides interval timing functionality using token-based time tracking."
});

// Define the 'start_timer' tool
server.tool(
    "start_timer",
    {
        token: z.string().describe("A unique string identifier for the timer.")
    },
    async ({ token }) => {
        const existingTimer = db.prepare('SELECT timestamp FROM timers WHERE token = ?').get(token) as TimerData | undefined;

        if (existingTimer) {
            return {
                content: [{
                    type: "text",
                    text: `Timer for token '${token}' already exists. Started at: ${new Date(existingTimer.timestamp).toISOString()}`
                }]
            };
        } else {
            const timestamp = Date.now();
            db.prepare('INSERT INTO timers (token, timestamp) VALUES (?, ?)').run(token, timestamp);
            return {
                content: [{
                    type: "text",
                    text: `Timer for token '${token}' started at: ${new Date(timestamp).toISOString()}`
                }]
            };
        }
    }
);

// Define the 'check_timer' tool
server.tool(
    "check_timer",
    {
        token: z.string().describe("The unique string identifier for the timer."),
        format: z.enum(["raw", "human_readable"]).optional().describe("Optional: Format of the elapsed time. 'raw' for milliseconds, 'human_readable' for a descriptive string. Defaults to 'raw'.")
    },
    async ({ token, format }) => {
        const timer = db.prepare('SELECT timestamp FROM timers WHERE token = ?').get(token) as TimerData | undefined;

        if (!timer) {
            return {
                content: [{
                    type: "text",
                    text: `No timer found for token '${token}'.`
                }]
            };
        } else {
            const elapsed = Date.now() - timer.timestamp;
            let responseText: string;

            if (format === "human_readable") {
                const seconds = Math.floor(elapsed / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                let parts = [];
                if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
                if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 === 1 ? '' : 's'}`);
                if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 === 1 ? '' : 's'}`);
                if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 === 1 ? '' : 's'}`);

                responseText = `Elapsed time for token '${token}': ${parts.length > 0 ? parts.join(', ') : 'less than a second'}.`;
            } else {
                responseText = `Elapsed time for token '${token}': ${elapsed} milliseconds.`;
            }

            return {
                content: [{
                    type: "text",
                    text: responseText
                }]
            };
        }
    }
);

// Main function to start the server
async function main() {
    initializeDatabase(); // No await needed for synchronous better-sqlite3
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP Server 'Simple Timer' started and listening via StdioServerTransport.");
}

main().catch(console.error);

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url'; // For ESM main check

// Initialize SQLite database
const DB_PATH = './timer.db';
export let db: Database.Database;

const TimerDataSchema = z.object({
    token: z.string(),
    timestamp: z.number(),
});

export function initializeDatabase() {
    db = new Database(DB_PATH);
    db.exec(`
        CREATE TABLE IF NOT EXISTS timers (
            token TEXT PRIMARY KEY,
            timestamp INTEGER
        );
    `);
    console.log("Database initialized and 'timers' table ensured.");
}

export const server = new McpServer({
    name: 'Simple Timer MCP Server',
    version: '1.0.0',
    description:
        'An MCP Server that provides interval timing functionality using token-based time tracking.',
});

export async function handleStartTimer({ token }: { token: string }) {
    const row = db
        .prepare('SELECT token, timestamp FROM timers WHERE token = ?')
        .get(token);
    const parseResult = TimerDataSchema.safeParse(row);

    if (parseResult.success) {
        const existingTimer = parseResult.data;
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `Timer for token '${token}' already exists. Started at: ${new Date(existingTimer.timestamp).toISOString()}`,
                },
            ],
        };
    } else if (row !== undefined) {
        console.error(
            'Schema validation failed for existing timer:',
            parseResult.error
        );
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `Timer data for token '${token}' is corrupted. Please contact an administrator.`,
                },
            ],
        };
    }
    const timestamp = Date.now();
    db.prepare('INSERT INTO timers (token, timestamp) VALUES (?, ?)').run(
        token,
        timestamp
    );
    return {
        content: [
            {
                type: 'text' as const,
                text: `Timer for token '${token}' started at: ${new Date(timestamp).toISOString()}`,
            },
        ],
    };
}

export async function handleDeleteTimer({ token }: { token: string }) {
    const row = db
        .prepare('SELECT token, timestamp FROM timers WHERE token = ?')
        .get(token);
    if (row) {
        db.prepare('DELETE FROM timers WHERE token = ?').run(token);
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `Timer for token '${token}' deleted successfully.`,
                },
            ],
        };
    } else {
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `No timer found for token '${token}' to delete.`,
                },
            ],
        };
    }
}

export async function handleListTimers() {
    const rows = db.prepare('SELECT token, timestamp FROM timers').all();
    const parseResult = z.array(TimerDataSchema).safeParse(rows);

    if (!parseResult.success) {
        console.error(
            'Schema validation failed for list_timers:',
            parseResult.error
        );
        return {
            content: [
                {
                    type: 'json' as const,
                    json: [] as any[],
                },
            ],
        };
    }

    const formattedTimers = parseResult.data.map((timer) => ({
        token: timer.token,
        startTime: new Date(timer.timestamp).toISOString(),
    }));

    return {
        content: [
            {
                type: 'json' as const,
                json: formattedTimers as any[],
            },
        ],
    };
}

export async function handleCheckTimer({ token, format }: { token: string, format?: 'raw' | 'human_readable' }) {
    const row = db
        .prepare('SELECT token, timestamp FROM timers WHERE token = ?')
        .get(token);
    const parseResult = TimerDataSchema.safeParse(row);

    if (!parseResult.success) {
        if (row !== undefined) {
            console.error(
                'Schema validation failed for check_timer:',
                parseResult.error
            );
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Timer data for token '${token}' is corrupted. Please contact an administrator.`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `No timer found for token '${token}'.`,
                },
            ],
        };
    }

    const timer = parseResult.data;
    const elapsed = Date.now() - timer.timestamp;
    let responseText: string;

    if (format === 'human_readable') {
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const parts = [];
        if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
        if (hours % 24 > 0)
            parts.push(`${hours % 24} hour${hours % 24 === 1 ? '' : 's'}`);
        if (minutes % 60 > 0)
            parts.push(
                `${minutes % 60} minute${minutes % 60 === 1 ? '' : 's'}`
            );
        if (seconds % 60 > 0)
            parts.push(
                `${seconds % 60} second${seconds % 60 === 1 ? '' : 's'}`
            );

        responseText = `Elapsed time for token '${token}': ${parts.length > 0 ? parts.join(', ') : 'less than a second'}.`;
    } else {
        responseText = `Elapsed time for token '${token}': ${elapsed} milliseconds.`;
    }

    return {
        content: [
            {
                type: 'text' as const,
                text: responseText,
            },
        ],
    };
}

server.tool(
    'start_timer',
    { token: z.string().describe('A unique string identifier for the timer.') },
    handleStartTimer
);

server.tool(
    'delete_timer',
    { token: z.string().describe('The unique string identifier for the timer to delete.') },
    handleDeleteTimer
);

server.tool('list_timers', {}, handleListTimers);

server.tool(
    'check_timer',
    {
        token: z.string().describe('The unique string identifier for the timer.'),
        format: z.enum(['raw', 'human_readable']).optional()
            .describe("Optional: Format of the elapsed time. 'raw' for milliseconds, 'human_readable' for a descriptive string. Defaults to 'raw'."),
    },
    handleCheckTimer
);

export async function main() {
    initializeDatabase();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log(
        "MCP Server 'Simple Timer' started and listening via StdioServerTransport."
    );
}

// Only run main if this script is executed directly (ESM compatible check)
// A common way is to check if the script path matches the entry point.
// For Jest environment, process.env.NODE_ENV === 'test' is also a robust check.
if (process.env.NODE_ENV !== 'test') {
    // A more direct ESM check could be:
    // if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main().catch(console.error);
}

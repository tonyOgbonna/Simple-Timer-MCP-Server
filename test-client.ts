import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runTest() {
    const client = new Client({
        name: 'Test Client',
        version: '1.0.0',
    });

    try {
        const transport = new StdioClientTransport({
            command: 'node',
            args: ['./dist/index.js'],
        });
        await client.connect(transport); // Connect the client to the server process

        console.log('--- Testing start_timer ---');
        const startResponse = (await client.callTool({
            name: 'start_timer',
            arguments: { token: 'test_timer_1' },
        })) as any;
        console.log('Start Timer Response:', startResponse.content[0].text);

        // Wait a bit to ensure some time elapses
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('\n--- Testing check_timer (raw) ---');
        const checkResponseRaw = (await client.callTool({
            name: 'check_timer',
            arguments: { token: 'test_timer_1', format: 'raw' },
        })) as any;
        console.log(
            'Check Timer (raw) Response:',
            checkResponseRaw.content[0].text
        );

        console.log('\n--- Testing check_timer (human_readable) ---');
        const checkResponseHuman = (await client.callTool({
            name: 'check_timer',
            arguments: { token: 'test_timer_1', format: 'human_readable' },
        })) as any;
        console.log(
            'Check Timer (human_readable) Response:',
            checkResponseHuman.content[0].text
        );

        console.log('\n--- Testing start_timer (existing token) ---');
        const startExistingResponse = (await client.callTool({
            name: 'start_timer',
            arguments: { token: 'test_timer_1' },
        })) as any;
        console.log(
            'Start Timer (existing) Response:',
            startExistingResponse.content[0].text
        );

        console.log('\n--- Testing check_timer (non-existent token) ---');
        const checkNonExistentResponse = (await client.callTool({
            name: 'check_timer',
            arguments: { token: 'non_existent_timer' },
        })) as any;
        console.log(
            'Check Timer (non-existent) Response:',
            checkNonExistentResponse.content[0].text
        );
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        client.close();
    }
}

runTest().catch(console.error);

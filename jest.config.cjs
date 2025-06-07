module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^better-sqlite3$': '<rootDir>/__mocks__/better-sqlite3.ts', // Force module resolution to our manual mock
    // Ensure this still works with ESM preset, or if it's needed.
    // ts-jest ESM preset might handle this better.
    // Forcing resolution to ESM versions if there are CJS/ESM conflicts in deps.
    '^@modelcontextprotocol/sdk/(.*)$': '<rootDir>/node_modules/@modelcontextprotocol/sdk/dist/esm/$1',
    '^@modelcontextprotocol/sdk$': '<rootDir>/node_modules/@modelcontextprotocol/sdk/dist/esm/index.js',
    // If other dependencies are pure ESM, they might need similar mapping or un-ignoring.
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@modelcontextprotocol/sdk)', // Process the SDK, ignore others in node_modules
    // "\\.pnp\\.[^\\\/]+$", // Default pnp ignore, keep if using pnp
  ],
  clearMocks: true, // Automatically clear mock calls and instances between every test
};

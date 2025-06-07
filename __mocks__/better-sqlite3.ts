import { jest } from '@jest/globals'; // Necessary for ESM Jest environment

// Create shared mock functions for the database methods
export const mockPrepare = jest.fn();
export const mockGet = jest.fn();
export const mockRun = jest.fn();
export const mockAll = jest.fn();
export const mockExec = jest.fn();

// Mock for the statement object returned by prepare
export const mockStatement = {
  get: mockGet,
  run: mockRun,
  all: mockAll,
};

// When prepare is called, it should return our mockStatement
// This configuration is done once when the module is loaded.
mockPrepare.mockReturnValue(mockStatement);

const mockDatabaseConstructor = jest.fn(() => {
  // Logging to confirm constructor is called by the application
  console.log('!!!! mockDatabaseConstructor from <rootDir>/__mocks__ CALLED !!!!');
  return {
    prepare: mockPrepare, // db.prepare() will be this mockPrepare
    exec: mockExec,
    // Add other direct db methods if used by the app (e.g., close, transaction)
    close: jest.fn(),
    transaction: jest.fn((cb: () => any) => cb()), // Simple transaction mock
  };
});

export default mockDatabaseConstructor;

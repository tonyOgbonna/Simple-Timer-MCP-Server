import { jest, describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import {
    handleStartTimer,
    handleCheckTimer,
    handleDeleteTimer,
    handleListTimers,
    initializeDatabase,
    // db // db import not strictly needed in tests if all interactions are via handlers + mocks
} from '../src/index';

// Manual mock is controlled by moduleNameMapper in jest.config.js pointing to <rootDir>/__mocks__

// Import the mock functions from our __mocks__ file to control their behavior directly
import {
    mockGet,
    mockRun,
    mockAll, // mockAll is part of mockStatement now
    mockExec,
    mockPrepare,
    mockStatement // mockStatement contains mockGet, mockRun, mockAll
} from '../__mocks__/better-sqlite3';

describe('Timer MCP Server Tools', () => {
  beforeAll(() => {
    initializeDatabase();
  });

  beforeEach(() => {
    // Reset relevant mock states before each test
    // clearMocks: true in jest.config.js handles .calls, .instances, .results
    // We primarily need to reset return values or specific implementations if they change per test.
    mockPrepare.mockClear().mockReturnValue(mockStatement); // Crucial: ensure prepare returns the statement object
    mockGet.mockClear();
    mockRun.mockClear();
    (mockStatement.all as jest.Mock).mockClear(); // mockAll is on mockStatement
    mockExec.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restores spies like Date.now and clears their implementations too
  });

  describe('start_timer', () => {
    it('should start a new timer if token does not exist', async () => {
      mockGet.mockReturnValue(undefined);
      const testTimestamp = 1678886400000;
      jest.spyOn(Date, 'now').mockReturnValue(testTimestamp);

      const result = await handleStartTimer({ token: 'new_timer' });

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers WHERE token = ?');
      expect(mockGet).toHaveBeenCalledWith('new_timer');
      expect(mockPrepare).toHaveBeenCalledWith('INSERT INTO timers (token, timestamp) VALUES (?, ?)');
      expect(mockRun).toHaveBeenCalledWith('new_timer', testTimestamp);
      expect(result.content[0].text).toBe(`Timer for token 'new_timer' started at: ${new Date(testTimestamp).toISOString()}`);
    });

    it('should inform if timer for token already exists', async () => {
      const existingTimestamp = 1678880000000;
      const isoString = new Date(existingTimestamp).toISOString();
      mockGet.mockReturnValue({ token: 'existing_timer', timestamp: existingTimestamp });

      const result = await handleStartTimer({ token: 'existing_timer' });

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers WHERE token = ?');
      expect(mockGet).toHaveBeenCalledWith('existing_timer');
      expect(mockRun).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(`Timer for token 'existing_timer' already exists. Started at: ${isoString}`);
    });
  });

  describe('handleCheckTimer', () => {
    it('should return raw milliseconds for an existing timer', async () => {
      const now = Date.now();
      const startTime = now - 12345;
      mockGet.mockReturnValue({ token: 'timer_raw', timestamp: startTime });
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const result = await handleCheckTimer({ token: 'timer_raw', format: 'raw' });

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers WHERE token = ?');
      expect(mockGet).toHaveBeenCalledWith('timer_raw');
      expect(result.content[0].text).toBe("Elapsed time for token 'timer_raw': 12345 milliseconds.");
    });

    it('should return human-readable format (seconds)', async () => {
      const now = Date.now();
      const startTime = now - 5000;
      mockGet.mockReturnValue({ token: 'timer_human_sec', timestamp: startTime });
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const result = await handleCheckTimer({ token: 'timer_human_sec', format: 'human_readable' });
      expect(result.content[0].text).toBe("Elapsed time for token 'timer_human_sec': 5 seconds.");
    });

    it('should return human-readable format (minutes and seconds)', async () => {
      const now = Date.now();
      const elapsedMs = (2 * 60 * 1000) + (15 * 1000); // 2 minutes 15 seconds
      const startTime = now - elapsedMs;
      mockGet.mockReturnValue({ token: 'timer_human_min_sec', timestamp: startTime });
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const result = await handleCheckTimer({ token: 'timer_human_min_sec', format: 'human_readable' });
      expect(result.content[0].text).toBe("Elapsed time for token 'timer_human_min_sec': 2 minutes, 15 seconds.");
    });

    it('should return human-readable format (hours, minutes, seconds)', async () => {
        const now = Date.now();
        const elapsedMs = (1 * 60 * 60 * 1000) + (30 * 60 * 1000) + (5 * 1000); // 1 hour, 30 mins, 5 secs
        const startTime = now - elapsedMs;
        mockGet.mockReturnValue({ token: 'timer_human_hr_min_sec', timestamp: startTime });
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const result = await handleCheckTimer({ token: 'timer_human_hr_min_sec', format: 'human_readable' });
        expect(result.content[0].text).toBe("Elapsed time for token 'timer_human_hr_min_sec': 1 hour, 30 minutes, 5 seconds.");
    });

    it('should return human-readable format (days, hours, minutes, seconds)', async () => {
        const now = Date.now();
        const elapsedMs = (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) + (30 * 60 * 1000) + (5 * 1000); // 2 days, 3 hrs, 30 mins, 5 secs
        const startTime = now - elapsedMs;
        mockGet.mockReturnValue({ token: 'timer_human_day_hr_min_sec', timestamp: startTime });
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const result = await handleCheckTimer({ token: 'timer_human_day_hr_min_sec', format: 'human_readable' });
        expect(result.content[0].text).toBe("Elapsed time for token 'timer_human_day_hr_min_sec': 2 days, 3 hours, 30 minutes, 5 seconds.");
    });

    it('should return "less than a second" for a very recent timer in human-readable format', async () => {
      const now = Date.now();
      const startTime = now - 100;
      mockGet.mockReturnValue({ token: 'timer_human_recent', timestamp: startTime });
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const result = await handleCheckTimer({ token: 'timer_human_recent', format: 'human_readable' });
      expect(result.content[0].text).toBe("Elapsed time for token 'timer_human_recent': less than a second.");
    });

    it('should return message for a non-existent timer when checking', async () => {
      mockGet.mockReturnValue(undefined);
      const result = await handleCheckTimer({ token: 'timer_non_existent', format: 'raw' });
      expect(mockGet).toHaveBeenCalledWith('timer_non_existent');
      expect(result.content[0].text).toBe("No timer found for token 'timer_non_existent'.");
    });

    it('should return corrupted data message if schema validation fails for check_timer', async () => {
      mockGet.mockReturnValue({ token: 'timer_corrupt', timestamp: 'not_a_number' });
      const result = await handleCheckTimer({ token: 'timer_corrupt' });
      expect(mockGet).toHaveBeenCalledWith('timer_corrupt');
      expect(result.content[0].text).toBe("Timer data for token 'timer_corrupt' is corrupted. Please contact an administrator.");
    });
  });

  describe('handleDeleteTimer', () => {
    it('should delete an existing timer successfully', async () => {
      mockGet.mockReturnValue({ token: 'timer_to_delete', timestamp: Date.now() });

      const result = await handleDeleteTimer({ token: 'timer_to_delete' });

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers WHERE token = ?');
      expect(mockGet).toHaveBeenCalledWith('timer_to_delete');
      expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM timers WHERE token = ?');
      expect(mockRun).toHaveBeenCalledWith('timer_to_delete');
      expect(result.content[0].text).toBe("Timer for token 'timer_to_delete' deleted successfully.");
    });

    it('should return message when trying to delete a non-existent timer', async () => {
      mockGet.mockReturnValue(undefined);

      const result = await handleDeleteTimer({ token: 'timer_del_non_existent' });

      expect(mockGet).toHaveBeenCalledWith('timer_del_non_existent');
      expect(mockRun).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe("No timer found for token 'timer_del_non_existent' to delete.");
    });
  });

  describe('handleListTimers', () => {
    it('should list all existing timers with ISO string start times', async () => {
      const now = Date.now();
      const timersData = [
        { token: 'timer1', timestamp: now - 10000 },
        { token: 'timer2', timestamp: now - 20000 },
      ];
      (mockStatement.all as jest.Mock).mockReturnValue(timersData);

      const result = await handleListTimers();

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers');
      expect(mockStatement.all).toHaveBeenCalled();
      expect(result.content[0].json).toEqual([
        { token: 'timer1', startTime: new Date(timersData[0].timestamp).toISOString() },
        { token: 'timer2', startTime: new Date(timersData[1].timestamp).toISOString() },
      ]);
    });

    it('should return an empty array if no timers exist for list_timers', async () => {
      (mockStatement.all as jest.Mock).mockReturnValue([]);

      const result = await handleListTimers();

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers');
      expect(mockStatement.all).toHaveBeenCalled();
      expect(result.content[0].json).toEqual([]);
    });

    it('should return empty json array if all timer data is corrupted for list_timers', async () => {
      const corruptedTimersData = [
        { token: 'timer_corrupt1', timestamp: 'not_a_number' },
        { token: 'timer_corrupt2', timestamp: false },
      ];
      (mockStatement.all as jest.Mock).mockReturnValue(corruptedTimersData);

      const result = await handleListTimers();

      expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers');
      expect(mockStatement.all).toHaveBeenCalled();
      expect(result.content[0].json).toEqual([]);
    });

    it('should filter out corrupted timers and return valid ones if handler logic supported it (current does not)', async () => {
        const now = Date.now();
        const mixedTimersData = [
            { token: 'valid_timer', timestamp: now - 30000 },
            { token: 'timer_corrupt', timestamp: 'a_string_timestamp' },
        ];
        (mockStatement.all as jest.Mock).mockReturnValue(mixedTimersData);

        const result = await handleListTimers();
        expect(mockPrepare).toHaveBeenCalledWith('SELECT token, timestamp FROM timers');
        expect(mockStatement.all).toHaveBeenCalled();
        // Current list_timers handler returns empty json on ANY schema parse error in the list.
        // If it were to filter, this test would change.
        expect(result.content[0].json).toEqual([]);
    });
  });
});

import { describe, expect, it } from 'vitest';
import { createHabit, createLog } from './habitUtils';
import { parseBackup, serializeBackup } from './backupUtils';

describe('Habitron backups', () => {
  it('round-trips habits through JSON', () => {
    const habit = {
      ...createHabit('Read', 'Read a chapter'),
      completionHistory: [createLog('2026-09-22', 'manual', true)]
    };

    expect(parseBackup(serializeBackup([habit]))).toEqual([habit]);
  });

  it('rejects malformed JSON and unknown backup shapes', () => {
    expect(() => parseBackup('{')).toThrow('not valid JSON');
    expect(() => parseBackup(JSON.stringify({ version: 2, habits: [] })))
      .toThrow('not a valid Habitron backup');
    expect(() => parseBackup(JSON.stringify({ version: 3, exportedAt: '', habits: [] })))
      .toThrow('not a valid Habitron backup');
  });

  it('imports version 1 backups by migrating their frequency to a schedule', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schedule, ...habit } = createHabit('Read', '');
    const legacyHabit = { ...habit, frequency: ['monday', 'friday'], streak: 4 };

    expect(parseBackup(JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: [legacyHabit]
    }))).toEqual([{ ...habit, schedule: { type: 'weekdays', days: ['monday', 'friday'] } }]);
  });

  it('rejects version 2 habits without a schedule', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schedule, ...habit } = createHabit('Read', '');

    expect(() => parseBackup(JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      habits: [habit]
    }))).toThrow('not a valid Habitron backup');
  });

  it('rejects invalid interval schedules', () => {
    const habit = createHabit('Exercise', '', { type: 'interval', intervalDays: 1 });

    expect(() => parseBackup(serializeBackup([habit])))
      .toThrow('not a valid Habitron backup');
  });

  it('rejects unknown log and habit statuses', () => {
    const habit = createHabit('Exercise', '');
    const backup = JSON.parse(serializeBackup([habit])) as {
      habits: Array<{ status?: string; completionHistory: Array<{ status?: string }> }>;
    };
    backup.habits[0].status = 'archived';
    backup.habits[0].completionHistory.push({ status: 'unknown' });

    expect(() => parseBackup(JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      habits: backup.habits
    }))).toThrow('not a valid Habitron backup');
  });

  it('rejects invalid reminder times', () => {
    const habit = createHabit('Exercise', '', { type: 'daily' }, { enabled: true, time: '25:00' });

    expect(() => parseBackup(serializeBackup([habit])))
      .toThrow('not a valid Habitron backup');
  });
});
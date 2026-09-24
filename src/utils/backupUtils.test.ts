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
    expect(() => parseBackup(JSON.stringify({ version: 1, habits: [] })))
      .toThrow('not a valid Habitron backup');
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
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: backup.habits
    }))).toThrow('not a valid Habitron backup');
  });
});
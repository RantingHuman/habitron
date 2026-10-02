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
    expect(() => parseBackup(JSON.stringify({ version: 3, habits: [] })))
      .toThrow('not a valid Habitron backup');
    expect(() => parseBackup(JSON.stringify({ version: 4, exportedAt: '', habits: [] })))
      .toThrow('not a valid Habitron backup');
  });

  it('imports version 1 backups by migrating their frequency to a schedule', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schedule, pauses, ...habit } = createHabit('Read', '');
    const legacyHabit = { ...habit, frequency: ['monday', 'friday'], streak: 4 };

    expect(parseBackup(JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: [legacyHabit]
    }))).toEqual([{ ...habit, schedule: { type: 'weekdays', days: ['monday', 'friday'] }, pauses: [] }]);
  });

  it('imports version 2 backups by anchoring intervals and converting a paused status', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schedule, pauses, ...habit } = {
      ...createHabit('Stretch', ''),
      startDate: '2026-09-01',
      completionHistory: [createLog('2026-09-10', 'manual', true)]
    };

    expect(parseBackup(JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      habits: [{ ...habit, schedule: { type: 'interval', intervalDays: 3 }, status: 'paused' }]
    }))).toEqual([{
      ...habit,
      schedule: { type: 'interval', intervalDays: 3, anchorDate: '2026-09-01' },
      pauses: [{ start: '2026-09-11' }]
    }]);
  });

  it('rejects version 3 habits without a schedule, anchor, or valid pauses', () => {
    const { schedule, ...habit } = createHabit('Read', '');
    const toBackup = (habits: unknown[]) => JSON.stringify({
      version: 3,
      exportedAt: new Date().toISOString(),
      habits
    });

    expect(() => parseBackup(toBackup([{ ...habit, schedule: { type: 'interval', intervalDays: 2 } }])))
      .toThrow('not a valid Habitron backup');
    expect(() => parseBackup(toBackup([{ ...habit, schedule, pauses: [{ start: '2026-09-22', end: '2026-09-21' }] }])))
      .toThrow('not a valid Habitron backup');

    expect(() => parseBackup(JSON.stringify({
      version: 3,
      exportedAt: new Date().toISOString(),
      habits: [habit]
    }))).toThrow('not a valid Habitron backup');
  });

  it('rejects invalid interval schedules', () => {
    const habit = createHabit('Exercise', '', { type: 'interval', intervalDays: 1, anchorDate: '2026-09-22' });

    expect(() => parseBackup(serializeBackup([habit])))
      .toThrow('not a valid Habitron backup');
  });

  it('rejects unknown log and legacy habit statuses', () => {
    const backup = JSON.parse(serializeBackup([createHabit('Exercise', '')])) as {
      habits: Array<{ status?: string; completionHistory: Array<{ status?: string }> }>;
    };
    const toBackup = (version: number) => JSON.stringify({
      version,
      exportedAt: new Date().toISOString(),
      habits: backup.habits
    });

    backup.habits[0].completionHistory.push({ status: 'unknown' });
    expect(() => parseBackup(toBackup(3))).toThrow('not a valid Habitron backup');

    backup.habits[0].completionHistory = [];
    backup.habits[0].status = 'archived';
    expect(() => parseBackup(toBackup(2))).toThrow('not a valid Habitron backup');
  });

  it('rejects invalid reminder times', () => {
    const habit = createHabit('Exercise', '', { type: 'daily' }, { enabled: true, time: '25:00' });

    expect(() => parseBackup(serializeBackup([habit])))
      .toThrow('not a valid Habitron backup');
  });
});
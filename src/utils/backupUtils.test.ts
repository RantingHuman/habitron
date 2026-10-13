import { describe, expect, it } from 'vitest';
import { archiveHabit, createHabit, pauseHabit, setCheckIn } from './habitUtils';
import { parseBackup, serializeBackup } from './backupUtils';

const toBackup = (version: number, habits: unknown[]) => JSON.stringify({
  version,
  exportedAt: new Date().toISOString(),
  habits
});

describe('Habitron backups', () => {
  it('round-trips habits through JSON', () => {
    const habit = archiveHabit(
      pauseHabit(setCheckIn(createHabit('Read', 'Read a chapter'), '2026-09-22', 'done'), '2026-09-25'),
      '2026-09-28'
    );

    expect(parseBackup(serializeBackup([habit]))).toEqual([habit]);
  });

  it('rejects malformed JSON and unknown backup shapes', () => {
    expect(() => parseBackup('{')).toThrow('not valid JSON');
    expect(() => parseBackup(JSON.stringify({ version: 4, habits: [] })))
      .toThrow('not a valid Habitron backup');
    expect(() => parseBackup(toBackup(5, []))).toThrow('not a valid Habitron backup');
  });

  it('rejects backups from other versions', () => {
    expect(() => parseBackup(toBackup(3, [createHabit('Read', '')]))).toThrow('not a valid Habitron backup');
  });

  it('rejects version 4 habits with invalid rules', () => {
    const habit = createHabit('Read', '');
    const withRules = (rules: unknown[]) => toBackup(4, [{ ...habit, rules }]);

    expect(() => parseBackup(withRules([]))).toThrow('not a valid Habitron backup');
    expect(() => parseBackup(withRules([
      { effectiveFrom: '2026-09-10', schedule: { type: 'daily' } },
      { effectiveFrom: '2026-09-05', schedule: { type: 'daily' } }
    ]))).toThrow('not a valid Habitron backup');
    expect(() => parseBackup(withRules([
      { effectiveFrom: '2026-09-10', schedule: { type: 'interval', intervalDays: 1 } }
    ]))).toThrow('not a valid Habitron backup');
  });

  it('rejects version 4 habits with invalid check-ins, pauses, or archive date', () => {
    const habit = createHabit('Read', '');
    const invalid = (overrides: Record<string, unknown>) => () => parseBackup(toBackup(4, [{ ...habit, ...overrides }]));

    expect(invalid({ checkIns: [{ date: '2026-09-10', status: 'missed' }] })).toThrow('not a valid Habitron backup');
    expect(invalid({
      checkIns: [{ date: '2026-09-10', status: 'done' }, { date: '2026-09-10', status: 'skipped' }]
    })).toThrow('not a valid Habitron backup');
    expect(invalid({ pauses: [{ start: '2026-09-22', end: '2026-09-21' }] })).toThrow('not a valid Habitron backup');
    expect(invalid({ archivedOn: 'yesterday' })).toThrow('not a valid Habitron backup');
  });

  it('rejects invalid reminder times', () => {
    const habit = createHabit('Exercise', '', { type: 'daily' }, { enabled: true, time: '25:00' });

    expect(() => parseBackup(serializeBackup([habit])))
      .toThrow('not a valid Habitron backup');
  });
});

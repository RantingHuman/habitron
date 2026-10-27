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
      pauseHabit(setCheckIn(createHabit('Read', 'Read a chapter'), '2026-09-22', { status: 'done' }), '2026-09-25'),
      '2026-09-28'
    );

    expect(parseBackup(serializeBackup([habit]))).toEqual([habit]);
  });

  it('rejects malformed JSON and unknown backup shapes', () => {
    expect(() => parseBackup('{')).toThrow('not valid JSON');
    expect(() => parseBackup(JSON.stringify({ version: 5, habits: [] })))
      .toThrow('not a valid Habitron backup');
  });

  it('rejects backups from versions it cannot migrate', () => {
    expect(() => parseBackup(toBackup(6, []))).toThrow('version 6');
    expect(() => parseBackup(toBackup(3, [createHabit('Read', '')]))).toThrow('version 3');
  });

  it('rejects habits with invalid rules', () => {
    const habit = createHabit('Read', '');
    const withRules = (rules: unknown[]) => toBackup(5, [{ ...habit, rules }]);

    expect(() => parseBackup(withRules([]))).toThrow('not a valid Habitron backup');
    expect(() => parseBackup(withRules([
      { effectiveFrom: '2026-09-10', schedule: { type: 'daily' } },
      { effectiveFrom: '2026-09-05', schedule: { type: 'daily' } }
    ]))).toThrow('not a valid Habitron backup');
    expect(() => parseBackup(withRules([
      { effectiveFrom: '2026-09-10', schedule: { type: 'interval', intervalDays: 1 } }
    ]))).toThrow('not a valid Habitron backup');
  });

  it('rejects habits with invalid check-ins, pauses, or archive date', () => {
    const habit = createHabit('Read', '');
    const invalid = (overrides: Record<string, unknown>) => () => parseBackup(toBackup(5, [{ ...habit, ...overrides }]));

    expect(invalid({ checkIns: [{ date: '2026-09-10', status: 'missed' }] })).toThrow('not a valid Habitron backup');
    expect(invalid({
      checkIns: [{ date: '2026-09-10', status: 'done' }, { date: '2026-09-10', status: 'skipped' }]
    })).toThrow('not a valid Habitron backup');
    expect(invalid({ pauses: [{ start: '2026-09-22', end: '2026-09-21' }] })).toThrow('not a valid Habitron backup');
    expect(invalid({ archivedOn: 'yesterday' })).toThrow('not a valid Habitron backup');
  });

  it('round-trips a measurable habit', () => {
    const habit = setCheckIn(
      setCheckIn(createHabit('Water', '', { type: 'daily' }, undefined, { unit: 'glasses', target: { direction: 'atLeast', amount: 8 } }),
        '2026-09-22', { amount: 6.5 }),
      '2026-09-23', { status: 'skipped' }
    );

    expect(parseBackup(serializeBackup([habit]))).toEqual([habit]);
  });

  it('rejects measurable fields that do not match the habit\'s kind', () => {
    const yesNo = createHabit('Read', '');
    const measurable = createHabit('Water', '', { type: 'daily' }, undefined,
      { unit: 'glasses', target: { direction: 'atLeast', amount: 8 } });
    const invalid = (habit: unknown) => () => parseBackup(toBackup(5, [habit]));

    expect(invalid({ ...measurable, unit: undefined })).toThrow('not a valid Habitron backup');
    expect(invalid({ ...measurable, unit: ' ' })).toThrow('not a valid Habitron backup');
    expect(invalid({ ...measurable, rules: [{ ...measurable.rules[0], target: undefined }] })).toThrow('not a valid Habitron backup');
    expect(invalid({ ...yesNo, rules: [{ ...yesNo.rules[0], target: { direction: 'atLeast', amount: 2 } }] }))
      .toThrow('not a valid Habitron backup');
    expect(invalid({ ...yesNo, checkIns: [{ date: '2026-09-22', amount: 3 }] })).toThrow('not a valid Habitron backup');
    expect(invalid({ ...measurable, checkIns: [{ date: '2026-09-22', status: 'done' }] })).toThrow('not a valid Habitron backup');
  });

  it('rejects invalid targets and amounts', () => {
    const measurable = createHabit('Water', '', { type: 'daily' }, undefined,
      { unit: 'glasses', target: { direction: 'atLeast', amount: 8 } });
    const withTarget = (target: unknown) => () =>
      parseBackup(toBackup(5, [{ ...measurable, rules: [{ ...measurable.rules[0], target }] }]));

    expect(withTarget({ direction: 'atLeast', amount: 0 })).toThrow('not a valid Habitron backup');
    expect(withTarget({ direction: 'sometimes', amount: 3 })).toThrow('not a valid Habitron backup');
    expect(parseBackup(toBackup(5, [{ ...measurable, rules: [{ ...measurable.rules[0], target: { direction: 'atMost', amount: 0 } }] }])))
      .toHaveLength(1);
    expect(() => parseBackup(toBackup(5, [{ ...measurable, checkIns: [{ date: '2026-09-22', amount: -1 }] }])))
      .toThrow('not a valid Habitron backup');
  });

  it('rejects invalid reminder times', () => {
    const habit = createHabit('Exercise', '', { type: 'daily' }, { enabled: true, time: '25:00' });

    expect(() => parseBackup(serializeBackup([habit])))
      .toThrow('not a valid Habitron backup');
  });
});

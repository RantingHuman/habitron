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
});
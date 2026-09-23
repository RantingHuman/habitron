import { ChangeEvent, useRef, useState } from 'react';
import Button from './buttons/Button';
import { useHabitronStore } from '../stores';
import { parseBackup, serializeBackup } from '../utils/backupUtils';

const DataBackup = () => {
  const { habits, replaceHabits } = useHabitronStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExport = () => {
    const blob = new Blob([serializeBackup(habits)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habitron-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setError('');
    setMessage('Backup exported.');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const importedHabits = parseBackup(await file.text());
      if (!window.confirm('Replace your current habits with this backup?')) return;

      replaceHabits(importedHabits);
      setError('');
      setMessage(`Imported ${importedHabits.length} habit${importedHabits.length === 1 ? '' : 's'}.`);
    } catch (importError) {
      setMessage('');
      setError(importError instanceof Error ? importError.message : 'Could not import the backup.');
    }
  };

  return (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      <Button name='export-data' appearance='secondary' onClick={handleExport}>Export</Button>
      <Button name='import-data' appearance='secondary' onClick={() => fileInputRef.current?.click()}>
        Import
      </Button>
      <input
        ref={fileInputRef}
        type='file'
        accept='application/json,.json'
        className='hidden'
        onChange={handleImport}
      />
      {message && <span role='status' className='text-sm'>{message}</span>}
      {error && <span role='alert' className='text-sm text-red-700 dark:text-red-300'>{error}</span>}
    </div>
  );
};

export default DataBackup;
import { useState } from 'react';
import Button from './buttons/Button';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { useHabitronStore } from '../stores';
import { Habit } from '../types/';
import { parseBackup, serializeBackup } from '../utils/backupUtils';
import { openTextFile, saveTextFile } from '../utils/fileUtils';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : fallback;

const DataBackup = () => {
  const { habits, replaceHabits } = useHabitronStore();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingImport, setPendingImport] = useState<Habit[] | null>(null);

  const showResult = (nextMessage: string, nextError = '') => {
    setMessage(nextMessage);
    setError(nextError);
  };

  const handleExport = async () => {
    try {
      const fileName = `habitron-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (await saveTextFile(fileName, serializeBackup(habits))) showResult('Backup exported.');
    } catch (exportError) {
      showResult('', getErrorMessage(exportError, 'Could not export the backup.'));
    }
  };

  const handleImport = async () => {
    try {
      const content = await openTextFile();
      if (content !== null) setPendingImport(parseBackup(content));
    } catch (importError) {
      showResult('', getErrorMessage(importError, 'Could not import the backup.'));
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    replaceHabits(pendingImport);
    showResult(`Imported ${pendingImport.length} habit${pendingImport.length === 1 ? '' : 's'}.`);
    setPendingImport(null);
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap gap-2'>
        <Button name='export-data' appearance='secondary' onClick={() => void handleExport()}>Export</Button>
        <Button name='import-data' appearance='secondary' onClick={() => void handleImport()}>Import</Button>
      </div>
      {message && <span role='status' className='text-sm'>{message}</span>}
      {error && <span role='alert' className='text-sm text-red-700 dark:text-red-300'>{error}</span>}
      { pendingImport &&
        <ConfirmationDialog isOpen={!!pendingImport} title='Import Backup'
          message={`Replace your current habits with the ${pendingImport.length} in this backup?`}
          onConfirm={handleConfirmImport} onCancel={() => setPendingImport(null)} />
      }
    </div>
  );
};

export default DataBackup;

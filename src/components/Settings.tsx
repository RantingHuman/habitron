import { useState } from 'react';
import Card from './Card';
import Button from './buttons/Button';
import DataBackup from './DataBackup';
import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { useHabitronStore } from '../stores';

const Settings = () => {
  const { resetHabits } = useHabitronStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleReset = () => {
    resetHabits();
    setShowResetDialog(false);
  };

  return (
    <>
      <Card header='Backup'>
        <p className='mb-4 text-sm'>Save your habits and history to a file, or restore them from one.</p>
        <DataBackup />
      </Card>
      <Card header='Reset'>
        <p className='mb-4 text-sm'>Permanently delete all habits and their history.</p>
        <Button appearance="danger" name="reset-habits" onClick={() => setShowResetDialog(true)}>Reset Habits</Button>
        { showResetDialog &&
          <ConfirmationDialog isOpen={showResetDialog} title='Reset Habits'
            message='This permanently deletes all habits and their history. Export a backup first if you might want them back.'
            onConfirm={handleReset} onCancel={() => setShowResetDialog(false)} />
        }
      </Card>
    </>
  );
};

export default Settings;

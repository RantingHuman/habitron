import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Button from './components/buttons/Button';
import ConfirmationDialog from './components/dialogs/ConfirmationDialog';
import { loadRecovery, useHabitronStore, usePersistenceStore } from './stores';
import useReminderNotifications from './hooks/useReminderNotifications';
import { saveTextFile } from './utils/fileUtils';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const Layout = () => {
  const { hasHydrated, error, clearError } = usePersistenceStore();
  useReminderNotifications();

  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isConfirmingStartFresh, setIsConfirmingStartFresh] = useState(false);

  const handleRetry = () => {
    clearError();
    setRecoveryMessage('');
    void useHabitronStore.persist.rehydrate();
  };

  // Saves the stored data exactly as it is, so a later version (or a person) can still read it
  const handleSaveRawData = async () => {
    try {
      const raw = await loadRecovery.readRawData();
      if (raw === null) {
        setRecoveryMessage('There is no saved data to save.');
        return;
      }
      const fileName = `habitron-unreadable-data-${new Date().toISOString().slice(0, 10)}.json`;
      if (await saveTextFile(fileName, raw)) setRecoveryMessage('Saved data written to a file.');
    } catch (saveError) {
      setRecoveryMessage(getErrorMessage(saveError, 'Could not save the data to a file.'));
    }
  };

  const handleStartFresh = async () => {
    setIsConfirmingStartFresh(false);
    setRecoveryMessage('');
    try {
      await loadRecovery.startFresh();
    } catch (startError) {
      setRecoveryMessage(getErrorMessage(startError, 'Could not clear the saved data.'));
    }
  };

  if (!hasHydrated) {
    return (
      <div className='min-h-screen flex items-center justify-center p-6 text-center'>
        {error ? (
          <div role='alert' className='max-w-md'>
            <p className='mb-2'>Habitron could not load your saved data.</p>
            <p className='mb-4 text-sm'>{error}</p>
            <div className='flex flex-wrap justify-center gap-2'>
              <Button name='retry-persistence' appearance='primary' onClick={handleRetry}>
                Try again
              </Button>
              <Button name='save-raw-data' appearance='secondary' onClick={() => void handleSaveRawData()}>
                Save raw data to a file
              </Button>
              <Button name='start-fresh' appearance='danger' onClick={() => setIsConfirmingStartFresh(true)}>
                Start fresh
              </Button>
            </div>
            {recoveryMessage && <p role='status' className='mt-4 text-sm'>{recoveryMessage}</p>}
            <ConfirmationDialog isOpen={isConfirmingStartFresh} title='Start Fresh'
              message='This permanently deletes your saved habits and check-ins. Save the raw data to a file first if you might want it back.'
              onConfirm={() => void handleStartFresh()} onCancel={() => setIsConfirmingStartFresh(false)} />
          </div>
        ) : (
          <p>Loading Habitron...</p>
        )}
      </div>
    );
  }

  return (
    <>
      <header>
        <Navbar />
      </header>
      {error && (
        <div role='alert' className='bg-red-100 text-red-900 border-b border-red-500 px-4 py-2 text-center'>
          Changes could not be saved. Your latest update may be lost.
        </div>
      )}
      <div className="container mx-auto px-4 py-4 max-w-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
    </>
  )
}

export default Layout;
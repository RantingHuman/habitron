import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Button from './components/buttons/Button';
import { useHabitronStore, usePersistenceStore } from './stores';
import useReminderNotifications from './hooks/useReminderNotifications';

const Layout = () => {
  const { hasHydrated, error, clearError } = usePersistenceStore();
  useReminderNotifications();

  const handleRetry = () => {
    clearError();
    void useHabitronStore.persist.rehydrate();
  };

  if (!hasHydrated) {
    return (
      <div className='min-h-screen flex items-center justify-center p-6 text-center'>
        {error ? (
          <div role='alert' className='max-w-md'>
            <p className='mb-4'>Habitron could not load your saved data.</p>
            <Button name='retry-persistence' appearance='primary' onClick={handleRetry}>
              Try again
            </Button>
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
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import DataBackup from './components/DataBackup';
import Button from './components/buttons/Button';
import { useHabitronStore, usePersistenceStore } from './stores';

const Layout = () => {
  const { hasHydrated, error, clearError } = usePersistenceStore();

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
      <div className='container mx-auto px-4 pt-4 max-w-xl'>
        <DataBackup />
      </div>
      <div className="container mx-auto px-4 py-4 max-w-xl">
        <Outlet />
      </div>
      <ThemeToggle />
    </>
  )
}

export default Layout;
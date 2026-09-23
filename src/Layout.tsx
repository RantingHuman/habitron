import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import DataBackup from './components/DataBackup';
import { usePersistenceStore } from './stores';

const Layout = () => {
  const { status } = usePersistenceStore();

  return (
    <>
      <header>
        <Navbar />
      </header>
      {status === 'error' && (
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
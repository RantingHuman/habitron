import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';

const Layout = () => {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <div className="container mx-auto px-4 py-4 max-w-xl">
        <Outlet />
      </div>
      <ThemeToggle />
    </>
  )
}

export default Layout;
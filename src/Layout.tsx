import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';

const Layout = () => {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <div className="container mx-auto px-4 py-4 max-w-lg">
        <Outlet />
      </div>
    </>
  )
}

export default Layout;
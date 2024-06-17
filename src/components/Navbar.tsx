import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
const Navbar = () => {
  return (
    <nav className='bg-blue-300 dark:bg-blue-700 text-2xl'>
      <div className='max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4'>

        <NavLink to='/'>
          <span className="self-center text-2xl font-semibold whitespace-nowrap">Habitron</span>
        </NavLink>

        <div className='block w-auto'>
          <ul className='flex flex-row gap-2'>
            <li>
              <NavLink to='/add-habit'>+</NavLink>
            </li>
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
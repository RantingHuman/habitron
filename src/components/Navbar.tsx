import { NavLink } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import ThemeToggle from './ThemeToggle';
const Navbar = () => {
  return (
    <nav className='bg-orange-200 dark:bg-blue-900 text-2xl text-orange-600 dark:text-inherit border-b border-black pt-[env(safe-area-inset-top)]'>
      <div className='max-w-screen-xl flex font-bold flex-wrap items-center justify-between mx-auto p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]'>

        <NavLink to={ROUTES.HOME}>
          <h1 className="self-center text-3xl uppercase whitespace-nowrap drop-shadow-custom">Habitron</h1>
        </NavLink>

        <div className='block w-auto'>
          <ul className='flex flex-row items-center gap-4'>
            <li>
              <NavLink to={ROUTES.ADD_HABIT} aria-label='Add habit'>
                +
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.SETTINGS} aria-label='Settings'>
                {/* U+FE0E asks for the text glyph; iOS otherwise draws a colour emoji */}
                {'\u2699\uFE0E'}
              </NavLink>
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
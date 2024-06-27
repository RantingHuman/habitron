import { NavLink } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
const Navbar = () => {
  return (
    <nav className='bg-orange-200 dark:bg-blue-900 text-2xl text-orange-600 dark:text-inherit border-b border-black'>
      <div className='max-w-screen-xl flex font-bold flex-wrap items-center justify-between mx-auto p-4'>

        <NavLink to={ROUTES.HOME}>
          <h1 className="self-center text-3xl uppercase whitespace-nowrap drop-shadow-custom">Habitron</h1>
        </NavLink>

        <div className='block w-auto'>
          <ul className='flex flex-row gap-2'>
            <li>
              <NavLink to={ROUTES.ADD_HABIT}>
                +
              </NavLink>
            </li>            
          </ul>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
import { NavLink } from 'react-router-dom';
const Navbar = () => {
  return (
    <nav className='bg-blue-300 dark:bg-blue-700'>
      <div className='max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4'>

        <NavLink className='' to='/'>
          <span className="self-center text-2xl font-semibold whitespace-nowrap">Habitron</span>
        </NavLink>
        <NavLink to='/add-habit'>Add Habit</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
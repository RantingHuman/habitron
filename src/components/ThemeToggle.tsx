import { useHabitronStore } from "../stores";

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useHabitronStore();

  return (
    <button
      type='button'
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
      className='size-9 rounded-md text-xl bg-yellow-300 dark:bg-slate-700 text-black dark:text-white shadow-custom'
    >
      {darkMode ? '☀︎' : '☾'}
    </button>
  );
}

export default ThemeToggle;
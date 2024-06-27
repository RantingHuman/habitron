import { useHabitronStore } from "../stores";

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useHabitronStore();

  return (
    <button
      onClick={toggleDarkMode}
      className='fixed bottom-4 right-4 size-11 rounded-md text-2xl bg-yellow-300 dark:bg-slate-700 text-black dark:text-white shadow-custom'
    >
      {darkMode ? '☀︎' : '☾'}
    </button>
  );
}

export default ThemeToggle;
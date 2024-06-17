import { useHabitronStore } from "../stores";

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useHabitronStore();

  return (
    <button
      onClick={toggleDarkMode}
      className=""
    >
      {darkMode ? '☀︎' : '☾'}
    </button>
  );
}

export default ThemeToggle;
import { HashRouter, Routes, Route } from 'react-router-dom';
import HabitList from './components/HabitList';
import HabitForm from './components/HabitForm';
import './App.css'
import Layout from './Layout';
// import { useEffect } from 'react';
import { useHabitronStore } from './stores/';
import HabitDetail from './components/HabitDetail';
import { ROUTES } from './utils/constants';

function App() {
  // const { addTestHabits } = useHabitronStore();
  // useEffect(() => {
  //  addTestHabits();
  // }, [addTestHabits]);
  const { darkMode } = useHabitronStore();
  return (
    <HashRouter>
      <div className={(darkMode ? 'dark' : '') + ' bg-sky-200 dark:bg-slate-950 text-neutral-800 dark:text-neutral-200 min-h-screen'}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Layout />}>
            <Route index element={<HabitList />} />
            <Route path={ROUTES.ADD_HABIT} element={<HabitForm />} />
            <Route path={ROUTES.EDIT_HABIT} element={<HabitForm />} />
            <Route path={ROUTES.VIEW_HABIT} element={<HabitDetail />} />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App

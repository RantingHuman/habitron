import { HashRouter, Routes, Route } from 'react-router-dom';
import HabitList from './components/HabitList';
import HabitForm from './components/HabitForm';
import './App.css'
import Layout from './Layout';
// import { useEffect } from 'react';
import { useHabitronStore } from './stores/';
import HabitDetail from './components/HabitDetail';

function App() {
  // const { addTestHabits } = useHabitronStore();
  // useEffect(() => {
  //  addTestHabits();
  // }, [addTestHabits]);
  const { darkMode } = useHabitronStore();
  return (
    <HashRouter>
      <div className={(darkMode ? 'dark' : '') + ' bg-white dark:bg-slate-800 text-black dark:text-white min-h-screen'}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HabitList />} />
            <Route path="add-habit" element={<HabitForm />} />
            <Route path="edit-habit/:id" element={<HabitForm />} />
            <Route path="view-habit/:id" element={<HabitDetail />} />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App

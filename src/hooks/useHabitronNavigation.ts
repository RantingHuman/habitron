import { useNavigate, generatePath } from "react-router-dom";
import { ROUTES } from "../utils/constants";

interface HabitronNavigationHook {
  navigateToAddHabit: () => void;
  navigateToHome: () => void;
  navigateToViewHabit: (habitId: string) => void;
  navigateToEditHabit: (habitId: string) => void;
}

const useHabitronNavigation = (): HabitronNavigationHook => {
  const navigate = useNavigate();

  const navigateToAddHabit = () => navigate(ROUTES.ADD_HABIT);
  const navigateToHome = () => navigate(ROUTES.HOME);
  const navigateToViewHabit = (habitId: string) =>
    navigate(generatePath(ROUTES.VIEW_HABIT, { id: habitId }));
  const navigateToEditHabit = (habitId: string) =>
    navigate(generatePath(ROUTES.EDIT_HABIT, { id: habitId }));

  return { navigateToAddHabit, navigateToHome, navigateToViewHabit, navigateToEditHabit };
};

export default useHabitronNavigation;
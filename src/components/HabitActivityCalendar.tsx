import ActivityCalendar from 'react-activity-calendar';
import { Habit } from '../types/';
import { getActivityCalendarData } from '../utils/habitUtils';
import { useMemo } from 'react';
import { useHabitronStore } from '../stores';
import { CALENDAR_THEME_COLORS } from '../utils/constants';

const HabitActivityCalendar = ({ habit }: { habit: Habit }) => {
  const { darkMode } = useHabitronStore();
  const scheme = darkMode ? 'dark' : 'light';
  const theme = {
    light: [CALENDAR_THEME_COLORS.LIGHT_INACTIVE, CALENDAR_THEME_COLORS.LIGHT_ACTIVE],
    dark: [CALENDAR_THEME_COLORS.DARK_INACTIVE, CALENDAR_THEME_COLORS.DARK_ACTIVE]
  }
  const blockRadius = 0;
  const blockSize = 20;


  const activityData = useMemo(() => getActivityCalendarData(habit), [habit]);
  return (
    <ActivityCalendar data={activityData} 
    maxLevel={1} 
    hideColorLegend={true} 
    colorScheme={scheme} 
    theme={theme}
    blockRadius={blockRadius}
    blockSize={blockSize} />
  );
}

export default HabitActivityCalendar;
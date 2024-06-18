import ActivityCalendar from 'react-activity-calendar';
import { Habit } from '../types/';
import { getActivityCalendarData } from '../utils/habitUtils';
import { useMemo } from 'react';
import { useHabitronStore } from '../stores';

const HabitActivityCalendar = ({ habit }: { habit: Habit }) => {
  const { darkMode } = useHabitronStore();
  const scheme = darkMode ? 'dark' : 'light';
  const theme = {
    light: ['rgb(209, 213, 219)', 'rgb(147, 197, 253)'],
    dark: ['rgb(51, 65, 85)', 'rgb(29, 78, 216)']
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
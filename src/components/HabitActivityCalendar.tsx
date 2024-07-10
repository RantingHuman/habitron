import ActivityCalendar, { Activity, BlockElement } from 'react-activity-calendar';
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
  const blockSize = 30;

  const renderBlock = (block: BlockElement, activity: Activity) => {
    const {x, y, width, height } = block.props;

    const textX = parseFloat(x) + parseFloat(width) / 2;
    const textY = parseFloat(y) + parseFloat(height) / 2;

    return (
      <g>
        {block}
        <text x={textX} y={textY} textAnchor="middle" alignmentBaseline="middle" fontSize="10" fill="black">
          {activity.date.split('-')[2]}
        </text>
      </g>
    )

  }


  const activityData = useMemo(() => getActivityCalendarData(habit), [habit]);
  return (
    <div className='text-center'>
      <ActivityCalendar data={activityData}
        maxLevel={1}
        hideColorLegend={true}
        colorScheme={scheme}
        theme={theme}
        blockRadius={blockRadius}
        blockSize={blockSize}   
        renderBlock={renderBlock}     
         />
    </div>
  );
}

export default HabitActivityCalendar;
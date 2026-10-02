import { useHabitronStore } from '../stores';
import HabitListItem from './HabitListItem';
import HabitListHeader from './HabitListHeader';
import Button from './buttons/Button';
import { NavLink } from 'react-router-dom';
import { parseISO, subWeeks } from 'date-fns';
import { getLastNDates, getToday } from '../utils/dateUtils';
import { HOME_DAYS_TO_SHOW } from '../utils/constants';
import { TouchEvent, useEffect, useMemo, useRef, useState } from 'react';

const SWIPE_THRESHOLD_PX = 50;

const HabitList = () => {
  const { habits } = useHabitronStore();
  const [today, setToday] = useState(() => getToday());
  // 0 shows the week ending today, 1 the week before, and so on
  const [weeksBack, setWeeksBack] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setToday((currentToday) => {
        const nextToday = getToday();
        return nextToday === currentToday ? currentToday : nextToday;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const dates = useMemo(
    () => getLastNDates(HOME_DAYS_TO_SHOW, subWeeks(parseISO(today), weeksBack)),
    [today, weeksBack]
  );

  const showOlderWeek = () => setWeeksBack((weeks) => weeks + 1);
  const showNewerWeek = () => setWeeksBack((weeks) => Math.max(0, weeks - 1));

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    // Swiping right reveals older days, like scrolling back through a calendar
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) showOlderWeek();
    else showNewerWeek();
  };

  return (
  habits.length > 0 ?
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <HabitListHeader
        dates={dates}
        today={today}
        onOlder={showOlderWeek}
        onNewer={weeksBack > 0 ? showNewerWeek : undefined}
      />
      <ul>
        {habits.map((habit) => (
          <HabitListItem key={habit.id} habit={habit} dates={dates} />
        ))}
      </ul>
    </div>
    :
    <div>
      <p>No habits yet! Add one to get started.</p>
      <br />
        <NavLink to="/add-habit">
          <Button appearance="primary" name="add-habit">
            Add Habit
          </Button>
        </NavLink>

    </div>
  );
}

export default HabitList;

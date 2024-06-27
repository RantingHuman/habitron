import { Habit, Log } from '../types/';
import { getToday, getCurrentTimestamp, getTimestampFromDate, getEarliestDateForHistory } from './dateUtils';

export const createHabit = (name: string, description: string) => {
  const newHabit: Habit = {
    name,
    description,
    frequency: [],
    streak: 0,
    startDate: getToday(),
    logs: []
  };

  return newHabit;
}

export const createLog = (habit: Habit, date?: string, type: 'manual' | 'computed' = 'manual', completed: boolean = false) => {
  const newLog: Log = {
    logDate: date || getToday(),
    logTimestamp: getCurrentTimestamp(),
    type,
    completed,
    habit
  };

  return newLog;
}

export const getActivityCalendarData = (habit: Habit) => {
  const earliestDate = getEarliestDateForHistory();
  const today = getToday();
  console.log(earliestDate);

  let todayExists = false;
  let earliestDateExists = false;

  const filteredLogs = habit.logs.filter(log => {
    return log.logDate >= earliestDate;
  }).sort((a, b) => getTimestampFromDate(a.logDate) - getTimestampFromDate(b.logDate));

  const activityData = filteredLogs.map(log => {
    const date = log.logDate;
    const count = log.completed ? 1 : 0;
    const level = log.completed ? 1 : 0;

    if (date === today) {
      todayExists = true;
    }

    if (date === earliestDate) {
      earliestDateExists = true;
    }

    return { date, count, level };
  });

  if (!earliestDateExists) {
    activityData.unshift({
      date: earliestDate,
      count: 0,
      level: 0
    });
  }

  if (!todayExists) {
    activityData.push({
      date: today,
      count: 0,
      level: 0
    });
  }
  console.log(activityData);
  return activityData;
}
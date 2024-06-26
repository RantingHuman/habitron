import { Habit, Log } from '../types/';
import {v4 as uuidv4} from 'uuid';
import { getToday, getCurrentTimestamp, dateComparator, getEarliestDateForHistory } from './dateUtils';

export const createHabit = (name: string, description: string) => {
  const newHabit: Habit = {
    id: uuidv4(),
    name,
    description,
    frequency: [],
    streak: 0,
    startDate: getToday(),
    completionHistory: []
  };

  return newHabit;
}

export const createLog = (date?: string, type: 'manual' | 'computed' = 'manual', completed: boolean = false) => {
  const newLog: Log = {
    id: uuidv4(),
    timestamp: getCurrentTimestamp(),
    date: date || getToday(),
    type,
    completed
  };

  return newLog;
}

export const getActivityCalendarData = (habit: Habit) => {
  const earliestDate = getEarliestDateForHistory();
  const today = getToday();
  console.log(earliestDate);

  let todayExists = false;
  let earliestDateExists = false;

  const filteredLogs = habit.completionHistory.filter(log => {    
    return log.date >= earliestDate;
  }).sort((a, b) => dateComparator(a.date, b.date));

  const activityData = filteredLogs.map(log => {
    const date = log.date;
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
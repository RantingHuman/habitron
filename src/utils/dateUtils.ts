import { format, parseISO, isSameDay, subDays } from 'date-fns';
import { DATE_FORMAT_FULL, HISTORY_DAYS_TO_SHOW } from './constants';

export const getLastNDates = (n: number, formatString: string = DATE_FORMAT_FULL) => {
  const MAX_N = 100;
  if(n <= 0) return [];
  if(n > MAX_N) n = MAX_N;
  const today = new Date();
  const lastNDates = Array.from({ length: n }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return format(date, formatString);
  });
  return lastNDates;
};

export const getToday = (formatString: string = DATE_FORMAT_FULL) => {
  return format(new Date(), formatString);
}

export const getCurrentTimestamp = () => {
  return new Date().getTime();
}

export const areTimestampsSameDay = (time1: string | number, time2: string | number) => {
  return isSameDay(time1, time2);
}

export const getTimestampFromDate = (date: string) => {
  return parseISO(date).getTime();
}

export const getDateFromTimestamp = (timestamp: string | number, formatString: string = DATE_FORMAT_FULL) => {
  return format(new Date(timestamp), formatString);
}

export const getEarliestDateForHistory = (formatString: string = DATE_FORMAT_FULL) => {
  const today = new Date();
  return format(subDays(today, HISTORY_DAYS_TO_SHOW), formatString);    
}
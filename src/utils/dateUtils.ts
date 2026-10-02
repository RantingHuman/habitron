import { format, subDays, eachDayOfInterval } from 'date-fns';
import { DATE_FORMAT_FULL } from './constants';

export const getLastNDates = (n: number, referenceDate: Date = new Date()) => {
  const MAX_N = 100;
  if(n <= 0) return [];
  if(n > MAX_N) n = MAX_N;
  return eachDayOfInterval({
    start: subDays(referenceDate, n - 1),
    end: referenceDate
  });
};

export const getToday = (formatString: string = DATE_FORMAT_FULL) => {
  return format(new Date(), formatString);
}

export const getCurrentTimestamp = () => {
  return new Date().getTime();
}

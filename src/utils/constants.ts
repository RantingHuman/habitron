export const APP_NAME = 'Habitron';
export const HOME_DAYS_TO_SHOW = 4;
export const DATE_FORMAT_MON_DAY = 'MMM dd';
export const DATE_FORMAT_FULL = 'yyyy-MM-dd';
export const HISTORY_DAYS_TO_SHOW = 99;

export const CALENDAR_THEME_COLORS = {
  LIGHT_ACTIVE: 'rgb(251,146,60)',
  LIGHT_INACTIVE: 'rgb(254,243,199)',
  DARK_ACTIVE: 'rgb(29, 78, 216)',
  DARK_INACTIVE: 'rgb(51, 65, 85)'
}

export const VALIDATION_MESSAGES = {
  HABIT_NAME_REQUIRED: 'Please enter a habit name.',
};

export const ROUTES = {
  HOME: '/',
  ADD_HABIT: '/add-habit',
  VIEW_HABIT: '/view-habit/:id',
  EDIT_HABIT: '/edit-habit/:id',
};
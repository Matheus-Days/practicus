import { createTheme } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const formatDate = (
  date: string,
  format = 'DD/MM/YYYY',
  timeValue = 'YYYY-MM-DD'
): string => {
  if (!date) return '';
  const parsedDate = dayjs.tz(date, timeValue, 'America/Fortaleza');
  return parsedDate.format(format);
};

export const muiTheme = createTheme({
  typography: {
    fontFamily: 'var(--font-montserrat)'
  },
  palette: {
    primary: {
      main: '#52818A'
    }
  }
});

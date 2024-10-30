import { createTheme } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (date: string): string => {
  if (!date) return '';
  return dayjs(date).tz('America/Fortaleza').format('DD/MM/YYYY');
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

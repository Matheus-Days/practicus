import { createTheme } from '@mui/material';
import { DateField } from '@prismicio/client';

export function formatDate(date: DateField): string {
  if (!date) return '';
  const jsDate = new Date(date.toString());
  const day = jsDate.getDate();
  const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
  const year = jsDate.getFullYear();
  return `${day}/${month}/${year}`;
}

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

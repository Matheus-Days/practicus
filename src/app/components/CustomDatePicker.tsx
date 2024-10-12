import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ptBR } from '@mui/x-date-pickers/locales';
import { Dayjs } from 'dayjs';
import { MdCalendarMonth } from 'react-icons/md';

const brazilLocale =
  ptBR.components.MuiLocalizationProvider.defaultProps.localeText;

type DatePickerProps = {
  defaultValue?: Dayjs;
  onDatePick?: (date: Dayjs | null) => void;
};

export default function CustomDatePicker({
  defaultValue,
  onDatePick
}: DatePickerProps) {
  return (
    <LocalizationProvider adapterLocale="pt-br" dateAdapter={AdapterDayjs}>
      <DatePicker
        defaultValue={defaultValue}
        views={['year', 'month']}
        format="MM / YYYY"
        localeText={brazilLocale}
        onChange={onDatePick}
        slots={{
          openPickerIcon: MdCalendarMonth
        }}
        slotProps={{
          textField: {
            placeholder: 'Filtrar por data',
            sx: {
              '& .MuiOutlinedInput-root': {
                width: '170px',
                borderRadius: '0.75rem',
                fontSize: '0.8125rem',
                lineHeight: '1.2188rem',
                letterSpacing: '0.0094rem',
                color: '#163945'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#52818A'
              },
              '& .MuiInputBase-input': {
                height: 'fit-content',
                padding: '1.125rem 0 1.125rem 0.75rem '
              },
              '& .MuiInputBase-input::placeholder': {
                opacity: 1
              }
            }
          },
          openPickerButton: {
            sx: {
              color: '#163945'
            }
          }
        }}
      />
    </LocalizationProvider>
  );
}

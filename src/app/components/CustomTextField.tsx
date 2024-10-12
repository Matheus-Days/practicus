import { InputAdornment, TextField } from '@mui/material';
import { ChangeEvent, ChangeEventHandler, useState } from 'react';
import { MdOutlineSearch } from 'react-icons/md';

type CustomTextFieldProps = {
  defaultValue?: string | null;
  onValue?: (val: string) => void;
};

export default function CustomTextField({
  defaultValue,
  onValue
}: CustomTextFieldProps): JSX.Element {
  const [val, setVal] = useState('');

  return (
    <TextField
      variant="filled"
      className="flex-grow"
      placeholder="Pesquisar artigo"
      onChange={(ev) => setVal(ev.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onValue && onValue(val)}
      defaultValue={defaultValue}
      sx={{
        '& ::before': {
          display: 'none'
        },
        '& ::after': {
          display: 'none'
        }
      }}
      slotProps={{
        htmlInput: {
          sx: {
            padding: '1rem 1.5rem'
          }
        },
        input: {
          sx: {
            borderRadius: '1.75rem',
            backgroundColor: 'white'
          },
          endAdornment: (
            <InputAdornment
              position="end"
              className="cursor-pointer"
              onClick={() => onValue && onValue(val)}
            >
              <div className="p-3">
                <MdOutlineSearch className="text-[24px]" />
              </div>
            </InputAdornment>
          )
        }
      }}
    />
  );
}

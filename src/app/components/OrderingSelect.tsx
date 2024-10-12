import { FormControl, Select, SelectChangeEvent } from '@mui/material';
import OrderingMenuItem from './OrderingMenuItem';

export type OrderingValue = 'oldest' | 'newest';

const ORDERING: { [key in OrderingValue]: OrderingValue } = {
  oldest: 'oldest',
  newest: 'newest'
};

type OrderingSelectProps = {
  defaultValue?: OrderingValue;
  onChange?: (ev: SelectChangeEvent<OrderingValue | 'none'>) => void;
};

export default function OrderingSelect({
  defaultValue,
  onChange
}: OrderingSelectProps): JSX.Element {
  return (
    <FormControl
      variant="outlined"
      className="w-[9.5rem]"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '0.75rem',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#52818A'
        },
        '& .MuiSelect-select': {
          padding: '1.125rem 0.75rem',
          fontSize: '0.8125rem',
          lineHeight: '1.2188rem',
          letterSpacing: '0.0094rem',
          color: '#163945'
        },
        '& .MuiSvgIcon-root': {
          color: '#163945'
        }
      }}
    >
      <Select
        onChange={onChange}
        placeholder="Ordernar por"
        defaultValue={ defaultValue || "none"}
      >
        <OrderingMenuItem value="none" disabled hidden>
          Ordernar por
        </OrderingMenuItem>
        <OrderingMenuItem value={ORDERING.newest}>Recentes</OrderingMenuItem>
        <OrderingMenuItem value={ORDERING.oldest}>Antigos</OrderingMenuItem>
      </Select>
    </FormControl>
  );
}
